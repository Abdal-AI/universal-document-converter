import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import sharp from 'sharp';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 25 },
});

app.use(cors());
app.use(express.json());

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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

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

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({ error: error.message || 'Conversion failed. Please try another file.' });
});

const port = process.env.PORT || 5180;
app.listen(port, () => {
  console.log(`PDF conversion API running at http://localhost:${port}`);
});
