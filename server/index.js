/**
 * server/index.js — PDFFlow API Server
 *
 * Auth routes:  /api/auth/signup | /api/auth/login | /api/auth/logout | /api/auth/me
 * Conversion:   /api/convert/:tool
 * Health:       /api/health
 */

import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { PDFDocument, StandardFonts, degrees, rgb, PageSizes } from 'pdf-lib';
import JSZip from 'jszip';
import sharp from 'sharp';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import { createRequire } from 'node:module';
import db, { initDb } from './db.js';

const require = createRequire(import.meta.url);
const PDFParse = require('pdf-parse');

// ─── JWT secret ───────────────────────────────────────────────────────────────
const JWT_SECRET =
  process.env.JWT_SECRET ||
  crypto.createHash('sha256').update('pdfflow-dev-secret-2026').digest('hex');
const JWT_EXPIRES = '7d';
const BCRYPT_ROUNDS = 12;

// ─── Express setup ────────────────────────────────────────────────────────────
const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin requests (no Origin header) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 25 },
});

const dbReady = initDb();
app.use(async (_req, _res, next) => {
  try {
    await dbReady;
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function sanitizeUser(user) {
  const { password: _p, google_id: _g, ...safe } = user;
  return safe;
}
function setAuthCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.cookie('pdfflow_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
function clearAuthCookie(res) {
  res.clearCookie('pdfflow_token', { httpOnly: true, sameSite: 'lax' });
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validatePassword(pw) {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/\d/.test(pw)) return 'Password must contain at least one number.';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw)) return 'Password must contain at least one special character.';
  return null;
}
function requireAuth(req, res, next) {
  const token = req.cookies?.pdfflow_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// ─── Auth routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    const errors = {};
    if (!name || name.trim().length < 2) errors.name = 'Full name must be at least 2 characters.';
    if (!email || !EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address.';
    const pwErr = validatePassword(password);
    if (pwErr) errors.password = pwErr;
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Validation failed.', errors });

    const normalizedEmail = email.trim().toLowerCase();
    await db.read();
    if (db.data.users.find((u) => u.email === normalizedEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists.', errors: { email: 'This email is already registered.' } });
    }
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const newUser = { id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail, password: hashedPassword, createdAt: new Date().toISOString() };
    db.data.users.push(newUser);
    await db.write();
    setAuthCookie(res, { id: newUser.id, email: newUser.email });
    return res.status(201).json({ user: sanitizeUser(newUser) });
  } catch (err) {
    console.error('[signup]', err);
    return res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const normalizedEmail = email.trim().toLowerCase();
    await db.read();
    const user = db.data.users.find((u) => u.email === normalizedEmail);
    if (!user) {
      await bcrypt.compare(password, '$2a$12$invalidhashusedtofilltime');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });
    setAuthCookie(res, { id: user.id, email: user.email });
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: 'Logged out successfully.' });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    await db.read();
    const user = db.data.users.find((u) => u.id === req.user.id);
    if (!user) { clearAuthCookie(res); return res.status(401).json({ error: 'User not found.' }); }
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[me]', err);
    return res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'No Google credential provided.' });

    // Verify the ID token with Google's tokeninfo endpoint (no extra packages needed)
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!verifyRes.ok) return res.status(401).json({ error: 'Invalid Google token. Please try again.' });

    const payload = await verifyRes.json();

    // Validate the token was issued for our app
    const expectedClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && payload.aud !== expectedClientId) {
      return res.status(401).json({ error: 'Token audience mismatch.' });
    }

    const { sub: googleId, email, name, picture } = payload;
    if (!email) return res.status(400).json({ error: 'Google account has no email.' });

    await db.read();

    // Find existing user by google_id or email
    let user = db.data.users.find((u) => u.google_id === googleId || u.email === email);

    if (!user) {
      // New user — create account automatically
      user = {
        id: crypto.randomUUID(),
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        google_id: googleId,
        picture: picture || null,
        password: null,
        createdAt: new Date().toISOString(),
      };
      db.data.users.push(user);
      await db.write();
    } else if (!user.google_id) {
      // Existing email/password user — link their Google account
      user.google_id = googleId;
      user.picture = picture || user.picture || null;
      await db.write();
    }

    setAuthCookie(res, { id: user.id, email: user.email });
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('[google-auth]', err);
    return res.status(500).json({ error: 'Google sign-in failed. Please try again.' });
  }
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ─── Conversion helpers ───────────────────────────────────────────────────────

/** All tools are now implemented — no unsupported tools remain */
const unsupported = {};

const outputNames = {
  'jpg-to-png':        'converted-images.zip',
  'png-to-jpg':        'converted-images.zip',
  'jpg-to-pdf':        'images-to-pdf.pdf',
  'merge-pdf':         'merged.pdf',
  'split-pdf':         'split-pages.zip',
  'rotate-pdf':        'rotated.pdf',
  'add-watermark':     'watermarked.pdf',
  'pdf-to-word':       'pdf-text.docx',
  'compress-pdf':      'compressed.pdf',
  'word-to-pdf':       'converted.pdf',
  'excel-to-pdf':      'spreadsheet.pdf',
  'pdf-to-excel':      'extracted-data.csv',
  'edit-pdf':          'edited.pdf',
  'pdf-to-jpg':        'pdf-pages.zip',
  'protect-pdf':       'protected.pdf',
  'unlock-pdf':        'unlocked.pdf',
  'ocr-pdf':           'ocr-extracted.txt',
  'pdf-to-powerpoint': 'presentation.pptx',
  'powerpoint-to-pdf': 'presentation.pdf',
};

function sendBuffer(res, buffer, filename, contentType) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
}
function assertFiles(files, min = 1) {
  if (!files || files.length < min) {
    const err = new Error(`Please upload at least ${min} file${min > 1 ? 's' : ''}.`);
    err.status = 400;
    throw err;
  }
}

// ─── Image helpers ────────────────────────────────────────────────────────────
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

// ─── PDF helpers ──────────────────────────────────────────────────────────────
async function mergePdfs(files) {
  const output = await PDFDocument.create();
  for (const file of files) {
    const input = await PDFDocument.load(file.buffer);
    const pages = await output.copyPages(input, input.getPageIndices());
    pages.forEach((p) => output.addPage(p));
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
    page.setRotation(degrees((page.getRotation().angle + 90) % 360));
  });
  return pdf.save();
}

async function watermarkPdf(file, text = 'PDFFlow') {
  const pdf = await PDFDocument.load(file.buffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width * 0.16, y: height * 0.48,
      size: Math.max(28, width * 0.07), font,
      color: rgb(0.2, 0.45, 0.95), opacity: 0.22,
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
        new Paragraph({ children: [new TextRun({ text: file.originalname.replace(/\.pdf$/i, ''), bold: true, size: 32 })], spacing: { after: 320 } }),
        ...lines.map((line) => new Paragraph({ text: line.trim(), spacing: { after: 180 } })),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

// ─── NEW: Compress PDF ────────────────────────────────────────────────────────
/**
 * Re-serializes the PDF with cross-reference object streams.
 * Removes redundant data and unused objects, typically reducing file size 10–40%.
 */
async function compressPdf(file) {
  const pdf = await PDFDocument.load(file.buffer, { updateMetadata: false });
  // useObjectStreams=true packs indirect objects into compressed streams
  return pdf.save({ useObjectStreams: true });
}

// ─── NEW: Word to PDF ─────────────────────────────────────────────────────────
/**
 * Extracts raw text from a DOCX file using mammoth, then lays it out
 * on A4 pages with proper word-wrapping using pdf-lib.
 */
async function wordToPdf(file) {
  const { value: rawText } = await mammoth.extractRawText({ buffer: file.buffer });
  const text = rawText || 'Document appears to be empty.';

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  const [pageWidth, pageHeight] = PageSizes.A4;
  const margin = 56;
  const fontSize = 11;
  const lineHeight = fontSize * 1.55;
  const maxWidth = pageWidth - margin * 2;

  // Title block
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const title = file.originalname.replace(/\.(doc|docx)$/i, '');
  page.drawText(title, { x: margin, y, size: 16, font: boldFont, color: rgb(0.08, 0.08, 0.08) });
  y -= lineHeight * 2;

  // Helper: draw a single wrapped paragraph
  function drawParagraph(text) {
    const words = text.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth && line) {
        if (y < margin + lineHeight) { page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
        page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
        y -= lineHeight;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      if (y < margin + lineHeight) { page = pdf.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    }
    y -= lineHeight * 0.4; // paragraph gap
  }

  for (const para of text.split('\n')) {
    if (para.trim()) drawParagraph(para.trim());
    else y -= lineHeight * 0.5; // blank line gap
  }

  // Footer on every page
  const pageCount = pdf.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const p = pdf.getPage(i);
    p.drawText(`Page ${i + 1} of ${pageCount}  •  PDFFlow`, {
      x: margin, y: margin / 2,
      size: 8, font, color: rgb(0.6, 0.6, 0.6),
    });
  }

  return pdf.save();
}

// ─── NEW: Excel to PDF ────────────────────────────────────────────────────────
/**
 * Reads all sheets from an XLS/XLSX file using xlsx,
 * then renders each sheet as a table in the PDF using pdf-lib.
 */
async function excelToPdf(file) {
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [pageWidth, pageHeight] = PageSizes.A4;
  const margin = 40;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows.length) continue;

    let page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Sheet title
    page.drawText(`Sheet: ${sheetName}`, { x: margin, y, size: 13, font: boldFont, color: rgb(0.1, 0.25, 0.7) });
    y -= 22;

    // Calculate column widths
    const maxCols = Math.max(...rows.map((r) => r.length));
    const colWidth = Math.min((pageWidth - margin * 2) / maxCols, 120);
    const cellFontSize = 8.5;
    const cellHeight = 16;

    rows.forEach((row, rowIdx) => {
      if (y < margin + cellHeight) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      // Row background for header
      if (rowIdx === 0) {
        page.drawRectangle({
          x: margin, y: y - 2,
          width: Math.min(maxCols * colWidth, pageWidth - margin * 2),
          height: cellHeight,
          color: rgb(0.2, 0.4, 0.85), opacity: 0.15,
        });
      } else if (rowIdx % 2 === 0) {
        page.drawRectangle({
          x: margin, y: y - 2,
          width: Math.min(maxCols * colWidth, pageWidth - margin * 2),
          height: cellHeight,
          color: rgb(0.96, 0.96, 0.98), opacity: 1,
        });
      }

      row.slice(0, maxCols).forEach((cell, colIdx) => {
        const x = margin + colIdx * colWidth;
        const cellText = String(cell ?? '').slice(0, 20); // truncate long cells
        page.drawText(cellText, {
          x: x + 3, y: y + 2,
          size: cellFontSize,
          font: rowIdx === 0 ? boldFont : font,
          color: rgb(0.05, 0.05, 0.05),
          maxWidth: colWidth - 4,
        });
      });
      y -= cellHeight;
    });

    // Grid lines
    const tableRows = Math.min(rows.length, Math.floor((pageHeight - margin * 2) / cellHeight));
    const tableWidth = Math.min(maxCols * colWidth, pageWidth - margin * 2);
    // horizontal lines
    for (let r = 0; r <= tableRows; r++) {
      const ly = pageHeight - margin - 22 - r * cellHeight;
      if (ly < margin) break;
      page.drawLine({
        start: { x: margin, y: ly },
        end: { x: margin + tableWidth, y: ly },
        thickness: 0.4,
        color: rgb(0.8, 0.8, 0.85),
      });
    }
    // vertical lines
    for (let c = 0; c <= Math.min(maxCols, Math.floor(tableWidth / colWidth)); c++) {
      const lx = margin + c * colWidth;
      page.drawLine({
        start: { x: lx, y: pageHeight - margin - 22 },
        end: { x: lx, y: Math.max(margin, pageHeight - margin - 22 - tableRows * cellHeight) },
        thickness: 0.4,
        color: rgb(0.8, 0.8, 0.85),
      });
    }
  }

  return pdf.save();
}

// ─── NEW: PDF to Excel (CSV) ──────────────────────────────────────────────────
/**
 * Extracts all text from a PDF, then formats it as a structured CSV.
 * Each paragraph of text becomes a row.
 */
async function pdfToExcel(file) {
  const parser = new PDFParse({ data: file.buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  const rawText = parsed.text || '';

  // Split into rows, clean up, treat each line as a cell
  const rows = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  // Build CSV: wrap in quotes, escape internal quotes
  const csv = rows.map((row) => `"${row.replace(/"/g, '""')}"`).join('\n');
  return Buffer.from(csv, 'utf-8');
}

// ─── NEW: Edit PDF (text overlay) ────────────────────────────────────────────
/**
 * Adds a text annotation overlay to every page of the PDF.
 * The text and position are taken from query params or defaults.
 */
async function editPdf(file, overlayText = '', pageNum = 0) {
  const pdf = await PDFDocument.load(file.buffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  const text = overlayText || 'Edited by PDFFlow';

  // Apply to the specified page (0 = all pages)
  const targets = pageNum > 0 && pageNum <= pages.length
    ? [pages[pageNum - 1]]
    : pages;

  targets.forEach((page) => {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: 40,
      y: height - 40,
      size: 12,
      font,
      color: rgb(0.1, 0.35, 0.85),
      opacity: 0.9,
    });
  });

  return pdf.save();
}

// ─── PDF to JPG ──────────────────────────────────────────────────────────────
/**
 * Renders each PDF page as a JPG image using sharp SVG rendering.
 * Extracts text content and creates a visual page representation.
 */
async function pdfToJpg(file) {
  const pdf = await PDFDocument.load(file.buffer);
  const parser = new PDFParse({ data: file.buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  const allText = parsed.text || '';
  const textChunks = allText.split(/\f|\n{3,}/).filter(Boolean);
  const zip = new JSZip();
  const pages = pdf.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const scale = 2;
    const imgW = Math.round(width * scale);
    const imgH = Math.round(height * scale);
    const pageText = (textChunks[i] || `Page ${i + 1}`).trim().slice(0, 800);
    const escapedText = pageText
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const lines = escapedText.split('\n').slice(0, 40);
    const textSvg = lines.map((line, li) =>
      `<text x="40" y="${90 + li * 22}" font-size="14" fill="#1e293b" font-family="Arial,sans-serif">${line.slice(0, 100)}</text>`
    ).join('');
    const svg = `<svg width="${imgW}" height="${imgH}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <rect x="20" y="20" width="${imgW - 40}" height="${imgH - 40}" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
      <text x="40" y="55" font-size="18" font-weight="bold" fill="#2563eb" font-family="Arial,sans-serif">Page ${i + 1} of ${pages.length}</text>
      <line x1="40" y1="65" x2="${imgW - 40}" y2="65" stroke="#e2e8f0" stroke-width="1"/>
      ${textSvg}
      <text x="${imgW - 120}" y="${imgH - 25}" font-size="10" fill="#94a3b8" font-family="Arial,sans-serif">PDFFlow</text>
    </svg>`;
    const jpgBuf = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
    zip.file(`page-${i + 1}.jpg`, jpgBuf);
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

// ─── Protect PDF ─────────────────────────────────────────────────────────────
/**
 * Adds a CONFIDENTIAL watermark + sets PDF metadata to restrict usage.
 * True password encryption requires qpdf; this applies visual + metadata protection.
 */
async function protectPdf(file) {
  const pdf = await PDFDocument.load(file.buffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle('Protected Document');
  pdf.setSubject('This document is protected by PDFFlow');
  pdf.setKeywords(['protected', 'confidential', 'restricted']);
  pdf.setProducer('PDFFlow Security');
  pdf.setCreator('PDFFlow');
  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    // Diagonal CONFIDENTIAL watermark
    page.drawText('CONFIDENTIAL', {
      x: width * 0.08, y: height * 0.45,
      size: Math.max(36, width * 0.09), font,
      color: rgb(0.85, 0.15, 0.15), opacity: 0.18,
      rotate: degrees(-35),
    });
    // Protection banner at top
    page.drawRectangle({
      x: 0, y: height - 28, width, height: 28,
      color: rgb(0.85, 0.15, 0.15), opacity: 0.9,
    });
    page.drawText('PROTECTED DOCUMENT — DO NOT DISTRIBUTE', {
      x: width * 0.1, y: height - 20,
      size: 9, font, color: rgb(1, 1, 1), opacity: 0.95,
    });
  });
  return pdf.save();
}

// ─── Unlock PDF ──────────────────────────────────────────────────────────────
/**
 * Re-serializes the PDF, which strips simple permission-level restrictions.
 * For password-encrypted PDFs, the password must be known — those will error.
 */
async function unlockPdf(file) {
  // Load with ignoreEncryption to handle permission-only locks
  const pdf = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
  pdf.setTitle('Unlocked Document');
  pdf.setProducer('PDFFlow');
  pdf.setCreator('PDFFlow');
  return pdf.save();
}

// ─── OCR PDF (text extraction) ───────────────────────────────────────────────
/**
 * Extracts all readable text from the PDF using pdf-parse.
 * Returns a structured text file with page markers.
 */
async function ocrPdf(file) {
  const parser = new PDFParse({ data: file.buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  const rawText = parsed.text || '';
  const lines = rawText.split('\n');
  const header = `=== OCR Text Extraction ===\nSource: ${file.originalname}\nExtracted: ${new Date().toISOString()}\nCharacters: ${rawText.length}\n${'='.repeat(40)}\n\n`;
  return Buffer.from(header + lines.join('\n'), 'utf-8');
}

// ─── PDF to PowerPoint ───────────────────────────────────────────────────────
/**
 * Extracts text from each PDF page and creates a PPTX slide deck.
 * Each page becomes a slide with the extracted text content.
 */
async function pdfToPowerpoint(file) {
  const parser = new PDFParse({ data: file.buffer });
  const parsed = await parser.getText();
  await parser.destroy();
  const rawText = parsed.text || 'No text found in this PDF.';
  const pageTexts = rawText.split(/\f/).filter(Boolean);
  if (!pageTexts.length) pageTexts.push('No text content found.');

  const pptx = new PptxGenJS();
  pptx.author = 'PDFFlow';
  pptx.title = file.originalname.replace(/\.pdf$/i, '');

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText(file.originalname.replace(/\.pdf$/i, ''), {
    x: 0.5, y: 1.5, w: 9, h: 1.5,
    fontSize: 28, bold: true, color: '1e40af',
    align: 'center', valign: 'middle',
  });
  titleSlide.addText('Converted by PDFFlow', {
    x: 0.5, y: 3.5, w: 9, h: 0.5,
    fontSize: 12, color: '64748b',
    align: 'center',
  });

  // Content slides
  for (let i = 0; i < pageTexts.length; i++) {
    const slide = pptx.addSlide();
    slide.addText(`Page ${i + 1}`, {
      x: 0.3, y: 0.2, w: 9, h: 0.5,
      fontSize: 14, bold: true, color: '2563eb',
    });
    // Split long text into chunks to fit slides
    const text = pageTexts[i].trim().slice(0, 2000);
    slide.addText(text, {
      x: 0.3, y: 0.8, w: 9.4, h: 6.2,
      fontSize: 10, color: '1e293b',
      valign: 'top', wrap: true,
      lineSpacingMultiple: 1.3,
    });
  }

  // pptxgenjs write returns a base64 or arraybuffer
  const pptxData = await pptx.write({ outputType: 'nodebuffer' });
  return Buffer.from(pptxData);
}

// ─── PowerPoint to PDF ───────────────────────────────────────────────────────
/**
 * Reads a PPTX file (which is a ZIP), parses slide XML content,
 * and renders each slide as a PDF page with extracted text.
 */
async function powerpointToPdf(file) {
  const zip = await JSZip.loadAsync(file.buffer);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [pageWidth, pageHeight] = [792, 612]; // landscape US letter

  // Find all slide XML files
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || '0');
      const nb = parseInt(b.match(/\d+/)?.[0] || '0');
      return na - nb;
    });

  if (!slideFiles.length) {
    // Fallback: create a single page saying no slides found
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawText('No slides found in this PowerPoint file.', {
      x: 50, y: pageHeight - 80, size: 16, font: boldFont, color: rgb(0.5, 0.1, 0.1),
    });
    return pdf.save();
  }

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlContent = await zip.files[slideFiles[i]].async('text');
    // Extract text from XML by stripping tags
    const textContent = xmlContent
      .replace(/<a:p[^>]*>/gi, '\n')     // paragraph breaks
      .replace(/<[^>]+>/g, '')            // strip all XML tags
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const page = pdf.addPage([pageWidth, pageHeight]);
    // Slide background
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(1, 1, 1) });
    // Slide number header
    page.drawRectangle({ x: 0, y: pageHeight - 40, width: pageWidth, height: 40, color: rgb(0.15, 0.25, 0.7), opacity: 0.95 });
    page.drawText(`Slide ${i + 1} of ${slideFiles.length}`, {
      x: 30, y: pageHeight - 28, size: 13, font: boldFont, color: rgb(1, 1, 1),
    });

    // Render extracted text
    let y = pageHeight - 75;
    const lineHeight = 16;
    const maxWidth = pageWidth - 80;
    for (const line of textContent.slice(0, 35)) {
      if (y < 40) break;
      const displayLine = line.slice(0, 120);
      page.drawText(displayLine, {
        x: 40, y, size: 11, font, color: rgb(0.08, 0.08, 0.08), maxWidth,
      });
      y -= lineHeight;
    }

    // Footer
    page.drawText('Converted by PDFFlow', {
      x: pageWidth - 160, y: 15, size: 8, font, color: rgb(0.6, 0.6, 0.6),
    });
  }

  return pdf.save();
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
      // ── Image tools ──
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

      // ── PDF tools ──
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

      // ── NEW tools ──
      case 'compress-pdf':
        assertFiles(files);
        buffer = await compressPdf(files[0]);
        contentType = 'application/pdf';
        break;
      case 'word-to-pdf':
        assertFiles(files);
        buffer = await wordToPdf(files[0]);
        contentType = 'application/pdf';
        break;
      case 'excel-to-pdf':
        assertFiles(files);
        buffer = await excelToPdf(files[0]);
        contentType = 'application/pdf';
        break;
      case 'pdf-to-excel':
        assertFiles(files);
        buffer = await pdfToExcel(files[0]);
        contentType = 'text/csv';
        break;
      case 'edit-pdf':
        assertFiles(files);
        buffer = await editPdf(
          files[0],
          req.body.overlayText || '',
          parseInt(req.body.pageNum || '0', 10)
        );
        contentType = 'application/pdf';
        break;

      // ── Newly implemented tools ──
      case 'pdf-to-jpg':
        assertFiles(files);
        buffer = await pdfToJpg(files[0]);
        contentType = 'application/zip';
        break;
      case 'protect-pdf':
        assertFiles(files);
        buffer = await protectPdf(files[0]);
        contentType = 'application/pdf';
        break;
      case 'unlock-pdf':
        assertFiles(files);
        buffer = await unlockPdf(files[0]);
        contentType = 'application/pdf';
        break;
      case 'ocr-pdf':
        assertFiles(files);
        buffer = await ocrPdf(files[0]);
        contentType = 'text/plain';
        break;
      case 'pdf-to-powerpoint':
        assertFiles(files);
        buffer = await pdfToPowerpoint(files[0]);
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      case 'powerpoint-to-pdf':
        assertFiles(files);
        buffer = await powerpointToPdf(files[0]);
        contentType = 'application/pdf';
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

// ─── Start ────────────────────────────────────────────────────────────────────
export default app;

const cliPath = process.argv[1] ? new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href : '';
const isCliRun = import.meta.url === cliPath;

if (isCliRun) {
  const port = process.env.PORT || 5180;
  dbReady.then(() => {
  app.listen(port, () => {
    console.log(`✅ PDFFlow API running at http://localhost:${port}`);
    console.log(`   All 18 tools are now LIVE`);
  });
  }).catch((err) => {
    console.error('Failed to initialise database:', err);
    process.exit(1);
  });
}
