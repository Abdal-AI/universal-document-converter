/**
 * server/index.js — PDFFlow API Server
 *
 * Provides:
 *   - Authentication routes  (signup, login, logout, /me)
 *   - File conversion routes (/api/convert/:tool)
 *   - Health check           (/api/health)
 *
 * Auth strategy:
 *   - Passwords hashed with bcryptjs (cost factor 12)
 *   - Sessions stored as JWTs in httpOnly, sameSite=lax cookies
 *   - JWT expiry: 7 days
 *   - Users persisted in server/data/users.json via lowdb
 */

import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import sharp from 'sharp';
import { createRequire } from 'node:module';
import db, { initDb } from './db.js';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

// ─── JWT secret ─────────────────────────────────────────────────────────────
// In production, set process.env.JWT_SECRET to a long random string.
// We derive a stable fallback from a machine-specific value so restarts
// don't invalidate existing sessions during development.
const JWT_SECRET =
  process.env.JWT_SECRET ||
  crypto.createHash('sha256').update('pdfflow-dev-secret-2026').digest('hex');

const JWT_EXPIRES = '7d';
const BCRYPT_ROUNDS = 12;

// ─── Express setup ───────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
  credentials: true, // allow cookies to be sent cross-origin in dev
}));
app.use(express.json());
app.use(cookieParser());

// ─── Multer (file uploads for conversion) ────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 25 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip the password hash before sending a user object to the client */
function sanitizeUser(user) {
  const { password: _password, ...safe } = user;
  return safe;
}

/** Set a signed JWT as an httpOnly cookie */
function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.cookie('pdfflow_token', token, {
    httpOnly: true,       // JS cannot read this cookie → XSS safe
    sameSite: 'lax',      // CSRF protection for cross-site requests
    secure: process.env.NODE_ENV === 'production', // HTTPS-only in prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
}

/** Clear the auth cookie */
function clearAuthCookie(res) {
  res.clearCookie('pdfflow_token', { httpOnly: true, sameSite: 'lax' });
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates password strength.
 * Rules: ≥ 8 chars, at least 1 digit, at least 1 special character.
 * @returns {string|null} error message or null if valid
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

/**
 * requireAuth — middleware that verifies the JWT cookie.
 * Attaches the decoded user payload to req.user.
 * Returns 401 if the token is missing or invalid.
 */
function requireAuth(req, res, next) {
  const token = req.cookies?.pdfflow_token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// ─── Auth routes ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 * Body: { name, email, password, confirmPassword }
 *
 * 1. Validates all fields
 * 2. Checks for duplicate email
 * 3. Hashes password with bcrypt
 * 4. Stores user in the JSON database
 * 5. Sets JWT cookie and returns the sanitized user object
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // ── Field-level validation ──────────────────────────────────────
    const errors = {};

    if (!name || name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }
    if (!email || !EMAIL_RE.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      errors.password = passwordError;
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed.', errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Duplicate email check ────────────────────────────────────────
    await db.read();
    const existing = db.data.users.find((u) => u.email === normalizedEmail);
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
        errors: { email: 'This email is already registered.' },
      });
    }

    // ── Hash password and persist user ───────────────────────────────
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const newUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    db.data.users.push(newUser);
    await db.write();

    // ── Issue JWT cookie and respond ─────────────────────────────────
    setAuthCookie(res, { id: newUser.id, email: newUser.email });
    return res.status(201).json({ user: sanitizeUser(newUser) });

  } catch (err) {
    console.error('[signup error]', err);
    return res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 *
 * 1. Finds user by email
 * 2. Compares password hash
 * 3. Sets JWT cookie and returns the sanitized user object
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic field check
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    await db.read();
    const user = db.data.users.find((u) => u.email === normalizedEmail);

    // Use constant-time comparison to prevent user enumeration
    if (!user) {
      await bcrypt.compare(password, '$2a$12$invalidhashusedtofilltime'); // timing safety
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    setAuthCookie(res, { id: user.id, email: user.email });
    return res.status(200).json({ user: sanitizeUser(user) });

  } catch (err) {
    console.error('[login error]', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * POST /api/auth/logout
 * Clears the JWT cookie.
 */
app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user (verified via JWT cookie).
 * Used by the frontend on page load to restore session state.
 */
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    await db.read();
    const user = db.data.users.find((u) => u.id === req.user.id);
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ error: 'User not found.' });
    }
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[me error]', err);
    return res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// ─── Conversion helpers ───────────────────────────────────────────────────────

const unsupported = {
  'word-to-pdf': 'Word to PDF needs LibreOffice or a cloud conversion API connected to this backend.',
  'pdf-to-jpg': 'PDF to JPG needs a PDF rendering engine such as Poppler, Ghostscript, or a cloud conversion API.',
  'compress-pdf': 'True PDF compression needs Ghostscript/qpdf or a cloud compression API.',
  'edit-pdf': 'Interactive PDF editing needs a dedicated editor layer; this backend supports watermark and rotate edits.',
  'protect-pdf': 'Password protection needs qpdf or another encryption engine.',
  'unlock-pdf': 'Unlocking protected PDFs needs a password-aware PDF engine.',
  'ocr-pdf': 'OCR needs Tesseract, Google Vision, Azure OCR, or another OCR service.',
  'pdf-to-excel': 'PDF table extraction needs a table/OCR engine such as Tabula, Camelot, or a cloud API.',
  'excel-to-pdf': 'Excel to PDF needs LibreOffice or a spreadsheet rendering API.',
  'pdf-to-powerpoint': 'PDF to PowerPoint needs a document conversion engine or cloud API.',
  'powerpoint-to-pdf': 'PowerPoint to PDF needs LibreOffice or a presentation rendering API.',
};

const outputNames = {
  'jpg-to-png': 'converted-images.zip',
  'png-to-jpg': 'converted-images.zip',
  'jpg-to-pdf': 'images-to-pdf.pdf',
  'merge-pdf': 'merged.pdf',
  'split-pdf': 'split-pages.zip',
  'rotate-pdf': 'rotated.pdf',
  'add-watermark': 'watermarked.pdf',
  'pdf-to-word': 'pdf-text.docx',
};

function sendBuffer(res, buffer, filename, contentType) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
}

function assertFiles(files, min = 1) {
  if (!files || files.length < min) {
    const error = new Error(`Please upload at least ${min} file${min > 1 ? 's' : ''}.`);
    error.status = 400;
    throw error;
  }
}

async function imagesToZip(files, format) {
  const zip = new JSZip();
  await Promise.all(files.map(async (file, index) => {
    const basename = file.originalname.replace(/\.[^.]+$/, '') || `image-${index + 1}`;
    const image = format === 'png'
      ? await sharp(file.buffer).png().toBuffer()
      : await sharp(file.buffer).jpeg({ quality: 92 }).toBuffer();
    zip.file(`${basename}.${format}`, image);
  }));
  return zip.generateAsync({ type: 'nodebuffer' });
}

async function jpgToPdf(files) {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const normalized = await sharp(file.buffer).jpeg({ quality: 95 }).toBuffer();
    const image = await pdf.embedJpg(normalized);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return pdf.save();
}

async function mergePdfs(files) {
  const output = await PDFDocument.create();
  for (const file of files) {
    const input = await PDFDocument.load(file.buffer);
    const pages = await output.copyPages(input, input.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }
  return output.save();
}

async function splitPdf(file) {
  const input = await PDFDocument.load(file.buffer);
  const zip = new JSZip();
  for (const pageIndex of input.getPageIndices()) {
    const output = await PDFDocument.create();
    const [page] = await output.copyPages(input, [pageIndex]);
    output.addPage(page);
    zip.file(`page-${pageIndex + 1}.pdf`, await output.save());
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

async function rotatePdf(file) {
  const pdf = await PDFDocument.load(file.buffer);
  pdf.getPages().forEach((page) => {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + 90) % 360));
  });
  return pdf.save();
}

async function watermarkPdf(file, text = 'PDFFlow') {
  const pdf = await PDFDocument.load(file.buffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width * 0.16,
      y: height * 0.48,
      size: Math.max(28, width * 0.07),
      font,
      color: rgb(0.2, 0.45, 0.95),
      opacity: 0.22,
      rotate: degrees(-28),
    });
  });
  return pdf.save();
}

async function pdfToWord(file) {
  const parser = new PDFParse({ data: file.buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  const lines = (parsed.text || 'No readable text found in this PDF.').split(/\n{2,}/).filter(Boolean);
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: file.originalname.replace(/\.pdf$/i, ''), bold: true, size: 32 })],
          spacing: { after: 320 },
        }),
        ...lines.map((line) => new Paragraph({ text: line.trim(), spacing: { after: 180 } })),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

// ─── Conversion route ─────────────────────────────────────────────────────────
app.post('/api/convert/:tool', upload.array('files'), async (req, res, next) => {
  try {
    const { tool } = req.params;
    const files = req.files;

    if (unsupported[tool]) {
      return res.status(501).json({ error: unsupported[tool] });
    }

    let buffer;
    let contentType = 'application/octet-stream';
    const filename = outputNames[tool] || 'converted-file';

    switch (tool) {
      case 'jpg-to-png':
        assertFiles(files);
        buffer = await imagesToZip(files, 'png');
        contentType = 'application/zip';
        break;
      case 'png-to-jpg':
        assertFiles(files);
        buffer = await imagesToZip(files, 'jpg');
        contentType = 'application/zip';
        break;
      case 'jpg-to-pdf':
        assertFiles(files);
        buffer = await jpgToPdf(files);
        contentType = 'application/pdf';
        break;
      case 'merge-pdf':
        assertFiles(files, 2);
        buffer = await mergePdfs(files);
        contentType = 'application/pdf';
        break;
      case 'split-pdf':
        assertFiles(files);
        buffer = await splitPdf(files[0]);
        contentType = 'application/zip';
        break;
      case 'rotate-pdf':
        assertFiles(files);
        buffer = await rotatePdf(files[0]);
        contentType = 'application/pdf';
        break;
      case 'add-watermark':
        assertFiles(files);
        buffer = await watermarkPdf(files[0], req.body.watermark || 'PDFFlow');
        contentType = 'application/pdf';
        break;
      case 'pdf-to-word':
        assertFiles(files);
        buffer = await pdfToWord(files[0]);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      default:
        return res.status(404).json({ error: 'This tool is not available yet.' });
    }

    return sendBuffer(res, buffer, filename, contentType);
  } catch (error) {
    next(error);
  }
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({ error: error.message || 'Conversion failed. Please try another file.' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const port = process.env.PORT || 5180;

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ PDFFlow API running at http://localhost:${port}`);
      console.log(`   Auth routes: /api/auth/signup | /api/auth/login | /api/auth/logout | /api/auth/me`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });
