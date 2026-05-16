# 📄 PDFFlow — Universal Document Converter

<div align="center">

![PDFFlow Banner](https://img.shields.io/badge/PDFFlow-Universal%20Document%20Converter-blue?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**A modern, full-stack document conversion platform with 18+ PDF tools, a real-time conversion API, dark mode, drag-and-drop uploads, and a beautiful glassmorphism UI — all in a single codebase.**

[🚀 Live Demo](#getting-started) · [📋 Features](#features) · [🛠 Tools](#supported-tools) · [📦 Installation](#installation)

</div>

---

## ✨ Overview

**PDFFlow** is a production-grade universal document converter built with **React 19**, **Vite**, **Express 5**, and a curated set of Node.js PDF/image libraries. It provides a complete frontend UI with an animated tool grid, file dashboard, and upload queue — backed by a local REST API that performs real file conversions without any cloud dependency.

> Upload a file → choose your tool → download the converted output in seconds.

---

## 🎯 Features

| Feature | Description |
|---|---|
| ⚡ **Instant Conversion** | Real-time progress bar with animated feedback |
| 🌗 **Dark / Light Mode** | Fully themed with a one-click toggle |
| 🖱️ **Drag & Drop Upload** | Drop files anywhere or browse from device |
| 📊 **File Dashboard** | Live queue with file sizes, statuses, and download buttons |
| 🔒 **Secure Local Processing** | Files never leave your machine — fully local API |
| 🧠 **AI Summarizer UI** | Ready-to-extend AI PDF summarization section |
| 📱 **Fully Responsive** | Mobile-first design with smooth animations |
| 🧩 **18 PDF Tools** | A complete toolkit for any document workflow |
| 💎 **Glassmorphism UI** | Premium frosted-glass design with Framer Motion animations |
| 🔗 **Hash-based Routing** | Deep-linkable tool pages via URL hash (`#pdf-to-word`) |

---

## 🛠 Supported Tools

### ✅ Live (API-backed)

| Tool | Endpoint | Output |
|---|---|---|
| PDF → Word | `/api/convert/pdf-to-word` | `.docx` |
| JPG → PDF | `/api/convert/jpg-to-pdf` | `.pdf` |
| JPG → PNG | `/api/convert/jpg-to-png` | `.zip` |
| Merge PDF | `/api/convert/merge-pdf` | `.pdf` |
| Split PDF | `/api/convert/split-pdf` | `.zip` |
| Rotate PDF | `/api/convert/rotate-pdf` | `.pdf` |
| Add Watermark | `/api/convert/add-watermark` | `.pdf` |

### 🔧 Engine-ready (Extendable)

These tools are scaffolded in the UI and return helpful error messages from the API. They are ready to be implemented by connecting an external engine (LibreOffice, Ghostscript, Tesseract, etc.):

`Word → PDF` · `PDF → JPG` · `Compress PDF` · `Edit PDF` · `Protect PDF` · `Unlock PDF` · `OCR PDF` · `PDF → Excel` · `Excel → PDF` · `PDF → PowerPoint` · `PowerPoint → PDF`

---

## 🏗️ Tech Stack

### Frontend
- **React 19** — Component-driven UI
- **Vite 5** — Lightning-fast dev server and build tool
- **Tailwind CSS 3** — Utility-first styling
- **Framer Motion** — Smooth page and component animations
- **Lucide React** — Consistent icon library

### Backend (Local API)
- **Express 5** — REST API server
- **Multer** — Multipart file uploads (up to 50 MB, 25 files)
- **pdf-lib** — PDF creation, merging, splitting, rotating, watermarking
- **pdf-parse** — PDF text extraction
- **docx** — DOCX document generation
- **sharp** — High-performance image conversion (JPG ↔ PNG)
- **JSZip** — ZIP archive creation for batch outputs

---

## 📦 Installation

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### 1. Clone the repository

```bash
git clone https://github.com/Abdal-AI/universal-document-converter.git
cd universal-document-converter
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development environment

#### Option A — Run everything together (recommended)

```bash
npm run dev:all
```

This starts both the Vite frontend (port **5174**) and the Express API server (port **5180**) concurrently.

#### Option B — Run separately

```bash
# Terminal 1 — Start the API server
npm run api

# Terminal 2 — Start the frontend
npm run dev
```

### 4. Open in browser

```
http://localhost:5174
```

---

## 📁 Project Structure

```
universal-document-converter/
├── src/
│   ├── main.jsx          # Full React application (all components)
│   └── styles.css        # Global styles and Tailwind base
├── server/
│   └── index.js          # Express REST API with all conversion logic
├── index.html            # HTML entry point
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
└── package.json          # Scripts and dependencies
```

---

## 🔌 API Reference

Base URL: `http://localhost:5180`

### Health Check

```http
GET /api/health
```

Response: `{ "ok": true }`

---

### Convert a File

```http
POST /api/convert/:tool
Content-Type: multipart/form-data

files: <file(s)>
```

**Path parameters:**

| Parameter | Description |
|---|---|
| `tool` | One of the [live tool IDs](#-live-api-backed) (e.g., `pdf-to-word`) |

**Form fields:**

| Field | Type | Description |
|---|---|---|
| `files` | `File[]` | One or more files to convert |
| `watermark` | `string` | *(add-watermark only)* Custom watermark text (default: `PDFFlow`) |

**Limits:** Max 50 MB per file, 25 files per request.

**Example (cURL):**

```bash
curl -X POST http://localhost:5180/api/convert/pdf-to-word \
  -F "files=@document.pdf" \
  --output converted.docx
```

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite frontend on port 5174 |
| `npm run api` | Start Express API server on port 5180 |
| `npm run dev:all` | Start both frontend and API concurrently |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |

---

## 🧩 Extending the API

To add backend support for an engine-ready tool, add a `case` to the `switch` in `server/index.js` and remove the tool ID from the `unsupported` object:

```js
// server/index.js
case 'compress-pdf':
  assertFiles(files);
  buffer = await compressPdfWithGhostscript(files[0]);
  contentType = 'application/pdf';
  break;
```

---

## 🔒 Security & Privacy

- **All conversions happen locally** — no file is ever sent to a third-party server.
- Files are held in memory only during the request lifecycle (Multer `memoryStorage`).
- CORS is enabled for local development. Restrict `cors()` origins before deploying to production.

---

## 🚀 Deployment

### Build for production

```bash
npm run build
```

The `dist/` folder can be served by any static host (Vercel, Netlify, GitHub Pages).

> **Note:** The Express API server must be deployed separately (e.g., Railway, Render, or a VPS). Update the `fetch` URL in `src/main.jsx` from `http://localhost:5180` to your production API URL.

---

## 🗺️ Roadmap

- [ ] Cloud storage import (Google Drive, Dropbox)
- [ ] AI-powered PDF summarization (OpenAI / Gemini integration)
- [ ] OCR via Tesseract.js (client-side) or Tesseract CLI (server-side)
- [ ] Word/Excel/PowerPoint conversion via LibreOffice bridge
- [ ] User authentication and file history
- [ ] Batch download as ZIP
- [ ] PDF annotation and signature tools

---

## 🤝 Contributing

Contributions are welcome! Please open an issue to discuss your idea before submitting a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Abdal AI**

[![GitHub](https://img.shields.io/badge/GitHub-Abdal--AI-181717?style=flat-square&logo=github)](https://github.com/Abdal-AI)

---

<div align="center">

Made with ❤️ and a lot of PDFs.

⭐ **Star this repo** if you find it useful!

</div>
