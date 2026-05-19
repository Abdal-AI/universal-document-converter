import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Check,
  ChevronRight,
  Cloud,
  Download,
  Droplets,
  Eye,
  EyeOff,
  FileArchive,
  FileImage,
  FileInput,
  FileLock2,
  FileOutput,
  FilePenLine,
  FileSpreadsheet,
  FileText,
  FileType,
  Files,
  Globe2,
  Image,
  Layers3,
  Link2,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  Monitor,
  Play,
  RotateCw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5180' : '');
const apiUrl = (path) => `${API_BASE}${path}`;

function DropboxIcon({ size = 24, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.003 3.693l-5.69 3.633 4.316 3.42 5.688-3.634-4.314-3.419zm-5.69 10.92l5.69 3.633 4.315-3.418-5.689-3.635-4.316 3.42zm11.38-7.287l4.314 3.419-5.688 3.634-4.315-3.42 5.689-3.633zm-5.69 10.92l-4.315-3.418-5.69 3.634 5.69 3.633 4.315-3.419-5.69-3.63z" />
    </svg>
  );
}

function GoogleDriveIcon({ size = 24, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M14.288 3.6L7.155 16.035h14.275L14.288 3.6zM2.541 21.6h7.135L16.81 9.418 9.675 3.6 2.541 21.6zm8.85 0h10.052l3.568-6.182H14.96l-3.569 6.182z"/>
    </svg>
  );
}

const tools = [
  { id: 'pdf-to-word',       name: 'PDF to Word',       icon: FileText,       description: 'Extract PDF text into an editable DOCX file.',       accept: '.pdf,application/pdf',                     live: true },
  { id: 'word-to-pdf',       name: 'Word to PDF',       icon: FileType,       description: 'Convert Word documents into polished PDFs.',         accept: '.doc,.docx',                               live: true },
  { id: 'pdf-to-jpg',        name: 'PDF to JPG',        icon: FileImage,      description: 'Export PDF pages as JPG images.',                    accept: '.pdf,application/pdf',                     live: true },
  { id: 'jpg-to-pdf',        name: 'JPG to PDF',        icon: Image,          description: 'Combine images into shareable PDFs.',               accept: '.jpg,.jpeg,image/jpeg',                    live: true },
  { id: 'jpg-to-png',        name: 'JPG to PNG',        icon: FileImage,      description: 'Convert JPG images into PNG files.',                accept: '.jpg,.jpeg,image/jpeg',                    live: true },
  { id: 'merge-pdf',         name: 'Merge PDF',         icon: Layers3,        description: 'Join multiple PDF files in the right order.',       accept: '.pdf,application/pdf',                     live: true },
  { id: 'split-pdf',         name: 'Split PDF',         icon: Scissors,       description: 'Extract pages into separate PDF files.',            accept: '.pdf,application/pdf',                     live: true },
  { id: 'compress-pdf',      name: 'Compress PDF',      icon: FileArchive,    description: 'Shrink PDF size without visible quality loss.',      accept: '.pdf,application/pdf',                     live: true },
  { id: 'edit-pdf',          name: 'Edit PDF',          icon: FilePenLine,    description: 'Add text overlays and annotations to any PDF.',     accept: '.pdf,application/pdf',                     live: true },
  { id: 'protect-pdf',       name: 'Protect PDF',       icon: FileLock2,      description: 'Add confidential watermarks and metadata.',         accept: '.pdf,application/pdf',                     live: true },
  { id: 'unlock-pdf',        name: 'Unlock PDF',        icon: Lock,           description: 'Remove permission restrictions from PDFs.',         accept: '.pdf,application/pdf',                     live: true },
  { id: 'rotate-pdf',        name: 'Rotate PDF',        icon: RotateCw,       description: 'Fix page orientation instantly.',                   accept: '.pdf,application/pdf',                     live: true },
  { id: 'add-watermark',     name: 'Add Watermark',     icon: Droplets,       description: 'Brand files with custom text watermarks.',          accept: '.pdf,application/pdf',                     live: true },
  { id: 'ocr-pdf',           name: 'OCR PDF',           icon: Sparkles,       description: 'Extract readable text from any PDF.',               accept: '.pdf,application/pdf',                     live: true },
  { id: 'pdf-to-excel',      name: 'PDF to Excel',      icon: FileSpreadsheet, description: 'Extract PDF data into a structured CSV file.',    accept: '.pdf,application/pdf',                     live: true },
  { id: 'excel-to-pdf',      name: 'Excel to PDF',      icon: FileOutput,     description: 'Publish clean PDF reports from spreadsheets.',     accept: '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', live: true },
  { id: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', icon: Play,           description: 'Convert PDF pages into editable PPTX slides.',     accept: '.pdf,application/pdf',                     live: true },
  { id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', icon: FileInput,      description: 'Convert PPTX slide decks into PDF files.',         accept: '.ppt,.pptx',                               live: true },
];


const features = [
  ['Fast Conversion', Zap],
  ['Secure File Processing', ShieldCheck],
  ['Cloud Storage Support', Cloud],
  ['Drag & Drop Upload', UploadCloud],
  ['Batch Processing', Files],
  ['AI Powered Compression', BrainCircuit],
  ['Mobile Friendly', BadgeCheck],
];

const testimonials = [
  {
    name: 'Maya Chen',
    role: 'Operations Lead',
    quote: 'PDFFlow replaced six separate tools for our team. It feels instant, calm, and reliable.',
  },
  {
    name: 'Daniel Hart',
    role: 'Agency Founder',
    quote: 'The upload flow is beautifully simple, and the dashboard makes batch work feel effortless.',
  },
  {
    name: 'Sara Malik',
    role: 'Legal Consultant',
    quote: 'Secure PDF handling, clean previews, and fast downloads. Exactly what professional teams need.',
  },
];

function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

function formatSize(bytes) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

// ─── Auth Context ──────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore session on mount by validating the httpOnly JWT cookie
  useEffect(() => {
    fetch(apiUrl('/api/auth/me'), { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  const login = useCallback((userData) => setUser(userData), []);

  const logout = useCallback(async () => {
    try {
      await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}
// ──────────────────────────────────────────────────────────────────────────────

function App() {
  const { user, login, logout } = useAuth();
  const [authModal, setAuthModal] = useState(false);
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const matchToolId = location.pathname.split('/')[1] || 'pdf-to-word';
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDownloadingFromCloud, setIsDownloadingFromCloud] = useState(false);
  const inputRef = useRef(null);

  const activeTool = useMemo(() => tools.find((tool) => tool.id === matchToolId) || tools[0], [matchToolId]);
  const totalSize = useMemo(() => files.reduce((sum, item) => sum + item.file.size, 0), [files]);

  function openDropbox() {
    const appKey = import.meta.env.VITE_DROPBOX_APP_KEY;
    if (!appKey) {
      setError("Dropbox App Key is missing. Please add VITE_DROPBOX_APP_KEY to .env");
      return;
    }
    if (window.Dropbox) {
      window.Dropbox.appKey = appKey;
      window.Dropbox.choose({
        success: async function(files) {
          setIsDownloadingFromCloud(true);
          try {
             const downloadedFiles = await Promise.all(files.map(async (file) => {
               const res = await fetch(file.link);
               const blob = await res.blob();
               return new File([blob], file.name, { type: blob.type || 'application/octet-stream' });
             }));
             addFiles(downloadedFiles);
          } catch(err) {
             setError("Failed to download from Dropbox.");
          } finally {
             setIsDownloadingFromCloud(false);
          }
        },
        linkType: "direct",
        multiselect: true,
      });
    } else {
      setError("Dropbox API failed to load.");
    }
  }

  function openGoogleDrive() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const appId = import.meta.env.VITE_GOOGLE_APP_ID;
    
    if (!clientId || !apiKey || !appId) {
      setError("Google Drive API keys are missing. Please add them to .env");
      return;
    }

    if (!window.google || !window.gapi) {
      setError("Google APIs are still loading.");
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          window.gapi.load('picker', () => {
             const view = new window.google.picker.DocsView();
             view.setIncludeFolders(true);
             const picker = new window.google.picker.PickerBuilder()
                .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
                .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                .setDeveloperKey(apiKey)
                .setAppId(appId)
                .setOAuthToken(tokenResponse.access_token)
                .addView(view)
                .setCallback(async (data) => {
                   if (data.action === window.google.picker.Action.PICKED) {
                      setIsDownloadingFromCloud(true);
                      try {
                         const downloadedFiles = await Promise.all(data.docs.map(async (doc) => {
                            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`, {
                               headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                            });
                            const blob = await res.blob();
                            return new File([blob], doc.name, { type: doc.mimeType });
                         }));
                         addFiles(downloadedFiles);
                      } catch(err) {
                         setError("Failed to download from Google Drive.");
                      } finally {
                         setIsDownloadingFromCloud(false);
                      }
                   }
                })
                .build();
             picker.setVisible(true);
          });
        }
      }
    });
    tokenClient.requestAccessToken();
  }

  useEffect(() => {
    setFiles([]);
    setProgress(0);
    setError('');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  function fileMatchesTool(file) {
    const acceptParts = activeTool.accept.split(',').map((part) => part.trim().toLowerCase());
    const lowerName = file.name.toLowerCase();
    const lowerType = file.type.toLowerCase();
    return acceptParts.some((part) => {
      if (part.startsWith('.')) return lowerName.endsWith(part);
      if (part.endsWith('/*')) return lowerType.startsWith(part.replace('/*', '/'));
      return lowerType === part;
    });
  }

  function chooseTool(tool) {
    navigate('/' + tool.id);
  }

  function goHome() {
    navigate('/');
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    const accepted = incoming.filter(fileMatchesTool);

    if (!accepted.length) {
      setError(`Please upload file type for ${activeTool.name}.`);
      return;
    }

    setError('');
    setFiles((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        status: 'Ready',
        outputBlob: null,
        outputName: '',
      })),
    ]);
  }

  async function processFiles() {
    if (!files.length || isProcessing) return;
    setIsProcessing(true);
    setProgress(0);
    setError('');
    setFiles((current) => current.map((item) => ({ ...item, status: 'Processing' })));

    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(value + Math.floor(Math.random() * 10) + 6, 86));
    }, 260);

    try {
      const body = new FormData();
      files.forEach((item) => body.append('files', item.file));
      const response = await fetch(apiUrl(`/api/convert/${activeTool.id}`), {
        method: 'POST',
        body,
      });

      if (!response.ok) {
        let message = 'Conversion failed. Please try another file.';
        try {
          const payload = await response.json();
          message = payload.error || message;
        } catch {
          message = await response.text();
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const outputName = disposition.match(/filename="([^"]+)"/)?.[1] || `${activeTool.id}-output`;

      setProgress(100);
      setFiles((current) => current.map((item) => ({
        ...item,
        status: 'Converted',
        outputBlob: blob,
        outputName,
      })));
    } catch (conversionError) {
      setError(conversionError.message.includes('fetch')
        ? 'Conversion API is not running. Start it with npm.cmd run api.'
        : conversionError.message);
      setFiles((current) => current.map((item) => ({ ...item, status: 'Ready' })));
    } finally {
      window.clearInterval(timer);
      setIsProcessing(false);
    }
  }

  function downloadFile(item) {
    const blob = item.outputBlob || item.file;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = item.outputName || item.file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  function removeFile(id) {
    setFiles((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main className='min-h-screen bg-white text-slate-950 antialiased'>
      <div className="relative min-h-screen overflow-hidden bg-white transition-colors duration-500">
        <FloatingNav
          onHome={goHome}
          user={user}
          onOpenAuth={() => setAuthModal(true)}
          onLogout={logout}
        />
        <Routes>
          <Route path="/:toolId" element={
            <ToolPage
              activeTool={activeTool}
              files={files}
              inputRef={inputRef}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              addFiles={addFiles}
              processFiles={processFiles}
              isProcessing={isProcessing}
              progress={progress}
              error={error}
              totalSize={totalSize}
              removeFile={removeFile}
              downloadFile={downloadFile}
              onBack={goHome}
              openGoogleDrive={openGoogleDrive}
              openDropbox={openDropbox}
              isDownloadingFromCloud={isDownloadingFromCloud}
            />
          } />
          <Route path="/" element={
            <>
              <Hero
                files={files}
                inputRef={inputRef}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                addFiles={addFiles}
                processFiles={processFiles}
                activeTool={activeTool}
                isProcessing={isProcessing}
                progress={progress}
                error={error}
                openGoogleDrive={openGoogleDrive}
                openDropbox={openDropbox}
                isDownloadingFromCloud={isDownloadingFromCloud}
              />
              <ToolsGrid activeTool={activeTool} onSelectTool={chooseTool} />
              <Features />
              <Workflow />
              <Dashboard files={files} totalSize={totalSize} removeFile={removeFile} downloadFile={downloadFile} />
              <AiSummarizer />
              <Testimonials />
              <Pricing />
              <Footer />
            </>
          } />
        </Routes>
      </div>
      {/* Auth modal — rendered outside the scroll container */}
      <AuthModal
        open={authModal}
        onClose={() => setAuthModal(false)}
        onSuccess={(u) => { login(u); setAuthModal(false); }}
      />
    </main>
  );
}

function ToolPage({
  activeTool,
  files,
  inputRef,
  isDragging,
  setIsDragging,
  addFiles,
  processFiles,
  isProcessing,
  progress,
  error,
  totalSize,
  removeFile,
  downloadFile,
  onBack,
}) {
  const Icon = activeTool.icon;

  return (
    <section className="relative mx-auto min-h-screen max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <nav className="mb-8 flex items-center text-sm font-bold text-slate-500">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-red-700 transition">
          <ChevronRight className="rotate-180" size={16} />
          Back to all tools
        </button>
        <ChevronRight size={14} className="mx-2 opacity-50" />
        <span className="text-slate-900">{activeTool.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="lg:sticky lg:top-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/80 px-4 py-2 text-sm font-black text-red-700 shadow-lg shadow-red-600/10 backdrop-blur">
            <Icon size={16} />
            {activeTool.live ? 'Working converter' : 'Converter engine required'}
          </div>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl">
            {activeTool.name}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            {activeTool.description} Add files here, run the converter, then download the finished output from your queue.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <StatusRow label="Accepted files" value={activeTool.accept.split(',')[0].toUpperCase()} />
            <StatusRow label="Files queued" value={files.length} />
            <StatusRow label="Total size" value={formatSize(totalSize)} />
            <StatusRow label="Status" value={activeTool.live ? 'Ready' : 'Needs engine'} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-[2rem] border border-slate-200/80 bg-white/95 p-5 shadow-premium backdrop-blur-2xl sm:p-8"
        >
          <input ref={inputRef} type="file" accept={activeTool.accept} multiple className="hidden" onChange={(event) => addFiles(event.target.files)} />
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            className={classNames(
              'grid min-h-[24rem] w-full place-items-center rounded-[1.6rem] border-2 border-dashed border-red-200 bg-red-50/70 p-8 text-center transition',
              isDragging && 'scale-[1.01] border-red-500 shadow-glow'
            )}
          >
            <div className="flex flex-col items-center w-full max-w-sm">
              <span className="grid h-20 w-20 place-items-center rounded-3xl bg-red-600 text-white shadow-glow mb-6">
                <UploadCloud size={34} />
              </span>
              <span className="block text-2xl font-black text-slate-950">Drop files here</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-slate-500 mb-6">
                Upload files for {activeTool.name}.
              </span>
              
              {isDownloadingFromCloud ? (
                 <div className="flex flex-col items-center gap-3 py-6 text-red-600">
                    <Loader2 className="animate-spin" size={32} />
                    <span className="font-bold text-sm">Downloading from cloud...</span>
                 </div>
              ) : (
                 <div className="flex flex-col w-full gap-3">
                    <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-4 font-black text-white shadow-glow transition hover:-translate-y-1 hover:bg-red-700">
                       <Monitor size={20} /> Upload from Computer
                    </button>
                    <div className="grid grid-cols-2 gap-3 w-full">
                       <button type="button" onClick={openGoogleDrive} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:text-red-600">
                          <GoogleDriveIcon size={18} /> Google Drive
                       </button>
                       <button type="button" onClick={openDropbox} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:text-red-600">
                          <DropboxIcon size={18} /> Dropbox
                       </button>
                    </div>
                 </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={processFiles} disabled={!files.length || isProcessing} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-black text-white shadow-glow transition hover:-translate-y-1 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              Convert {activeTool.name}
            </button>
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-black text-slate-800 shadow-lg transition hover:-translate-y-1 hover:border-red-300">
              <UploadCloud size={20} />
              Add more files
            </button>
          </div>

          {(isProcessing || progress > 0) && (
            <div className="mt-5 rounded-2xl bg-slate-100 p-2">
              <div className="h-3 overflow-hidden rounded-full bg-white">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400" animate={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="mt-8">
            <Dashboard files={files} totalSize={totalSize} removeFile={removeFile} downloadFile={downloadFile} compact />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FloatingNav({ onHome, user, onOpenAuth, onLogout }) {
  const [open, setOpen] = useState(false);
  const links = ['Tools', 'Workflow', 'Pricing', 'Security'];

  return (
    <header className="fixed left-0 right-0 top-4 z-50 px-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-slate-200/80 bg-white/95 px-4 py-3 shadow-xl shadow-red-900/5 backdrop-blur-2xl">
        <button type="button" onClick={onHome} className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white shadow-glow">
            <Sparkles size={20} />
          </span>
          <span className="text-lg font-black tracking-tight text-slate-950">PDFFlow</span>
        </button>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a key={link} href={`/#${link.toLowerCase()}`} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700">
              {link}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* Auth button - avatar when logged in, Sign In when logged out */}
          {user ? (
            <UserAvatar user={user} onLogout={onLogout} />
          ) : (
            <button type="button" onClick={onOpenAuth} className="hidden rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700 md:inline-flex">
              Sign in
            </button>
          )}
          <button type="button" aria-label="Open menu" onClick={() => setOpen((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white md:hidden">
            <Menu size={18} />
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto mt-3 max-w-7xl rounded-3xl border border-slate-200/80 bg-white/95 p-3 shadow-premium backdrop-blur md:hidden">
            {links.map((link) => (
              <a key={link} href={`/#${link.toLowerCase()}`} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 font-semibold text-slate-700">
                {link}
              </a>
            ))}
            {/* Mobile auth action */}
            {user ? (
              <button type="button" onClick={() => { setOpen(false); onLogout(); }} className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 font-bold text-red-600">
                <LogOut size={15} /> Sign out
              </button>
            ) : (
              <button type="button" onClick={() => { setOpen(false); onOpenAuth(); }} className="mt-1 w-full rounded-2xl bg-red-600 px-4 py-3 font-bold text-white">
                Sign in
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero({ files, inputRef, isDragging, setIsDragging, addFiles, processFiles, activeTool, isProcessing, progress, error, openGoogleDrive, openDropbox, isDownloadingFromCloud }) {
  return (
    <section id="upload" className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/80 px-4 py-2 text-sm font-bold text-red-700 shadow-lg shadow-red-600/10 backdrop-blur">
          <WandSparkles size={16} />
          {activeTool.live ? 'Live local converter' : 'API-ready converter'}
        </div>
        <h1 className="text-balance text-5xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
          Every PDF Tool You Need in One Place
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Choose a tool, upload the matching files, and download real converted output from the local API where supported.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7 }}
        className="mx-auto mt-10 w-full max-w-4xl"
      >
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={classNames(
            'relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 p-5 shadow-premium backdrop-blur-2xl transition duration-300 sm:p-8',
            isDragging && 'scale-[1.01] border-red-400 shadow-glow'
          )}
        >
          <input ref={inputRef} type="file" accept={activeTool.accept} multiple className="hidden" onChange={(event) => addFiles(event.target.files)} />
          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            
            <div className="grid min-h-72 place-items-center rounded-[1.5rem] border-2 border-dashed border-red-200 bg-red-50/70 p-6 text-center transition">
              <div className="flex flex-col items-center w-full max-w-sm">
                <span className="grid h-16 w-16 place-items-center rounded-[1.5rem] bg-red-600 text-white shadow-glow mb-5">
                  <UploadCloud size={28} />
                </span>
                <span className="block text-xl font-black text-slate-950">Drop files for {activeTool.name}</span>
                <span className="mt-2 block text-sm font-semibold text-slate-500 mb-6">or click a method below to browse</span>
                
                {isDownloadingFromCloud ? (
                   <div className="flex flex-col items-center gap-2 py-4 text-red-600">
                      <Loader2 className="animate-spin" size={28} />
                      <span className="font-bold text-sm">Downloading from cloud...</span>
                   </div>
                ) : (
                   <div className="flex flex-col w-full gap-2">
                      <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 px-5 py-3 font-black text-white shadow-glow transition hover:-translate-y-1 hover:bg-red-700">
                         <Monitor size={18} /> Upload from Computer
                      </button>
                      <div className="grid grid-cols-2 gap-2 w-full">
                         <button type="button" onClick={openGoogleDrive} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:text-red-600">
                            <GoogleDriveIcon size={16} /> Google Drive
                         </button>
                         <button type="button" onClick={openDropbox} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-red-300 hover:text-red-600">
                            <DropboxIcon size={16} /> Dropbox
                         </button>
                      </div>
                   </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-500">Upload status</p>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                    Secure
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  <StatusRow label="Selected tool" value={activeTool.name} />
                  <StatusRow label="Files queued" value={files.length} />
                  <StatusRow label="Cloud ready" value="Drive + Dropbox" />
                  <StatusRow label="API mode" value={activeTool.live ? 'Working locally' : 'Needs engine'} />
                </div>
              </div>
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={processFiles} disabled={!files.length || isProcessing} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-black text-white shadow-glow transition hover:-translate-y-1 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  Run {activeTool.name}
                </button>
                <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-black text-slate-800 shadow-lg transition hover:-translate-y-1 hover:border-red-300">
                  <UploadCloud size={20} />
                  Add files
                </button>
              </div>
              {(isProcessing || progress > 0) && (
                <div className="rounded-2xl bg-slate-100 p-2">
                  <div className="h-3 overflow-hidden rounded-full bg-white">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400" animate={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mx-auto mt-10 grid w-full max-w-4xl grid-cols-3 gap-3 text-center sm:gap-6">
        {[
          ['14M+', 'files converted'],
          ['99.9%', 'uptime'],
          ['256-bit', 'encrypted flow'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-lg backdrop-blur">
            <p className="text-2xl font-black text-red-600 sm:text-3xl">{value}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}

function ToolsGrid({ activeTool, onSelectTool }) {
  return (
    <section id="tools" className="relative px-4 py-20 sm:px-6 lg:px-8">
      <SectionTitle eyebrow="PDF toolkit" title="A beautiful tool for every PDF job" subtitle="One consistent workflow across conversion, editing, compression, security, and OCR." />
      <div className="mx-auto mt-12 grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          const selected = activeTool.id === tool.id;

          return (
          <motion.button
            type="button"
            key={tool.id}
            onClick={() => onSelectTool(tool)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: Math.min(index * 0.025, 0.25) }}
            className={classNames(
              'group rounded-3xl border p-5 text-left shadow-lg shadow-red-950/5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-premium',
              selected
                ? 'border-red-300 bg-red-600 text-white'
                : 'border-slate-200/80 bg-white/95'
            )}
          >
            <span className={classNames(
              'grid h-12 w-12 place-items-center rounded-2xl transition group-hover:scale-110',
              selected
                ? 'bg-white text-red-600'
                : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'
            )}>
              <Icon size={22} />
            </span>
            <div className="mt-5 flex items-center justify-between gap-2">
              <h3 className="text-base font-black">{tool.name}</h3>
              <span className={classNames(
                'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
                selected ? 'bg-white/20 text-white' : tool.live ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'
              )}>
                {tool.live ? 'Live' : 'Engine'}
              </span>
            </div>
            <p className={classNames('mt-2 text-sm leading-6', selected ? 'text-red-50' : 'text-slate-500')}>{tool.description}</p>
          </motion.button>
          );
        })}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="security" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionTitle align="left" eyebrow="Premium features" title="Built for teams that move fast" subtitle="Responsive, secure, and ready for cloud workflows, batch queues, and future backend API processing." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(([label, Icon]) => (
            <div key={label} className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-lg backdrop-blur">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-700">
                <Icon size={22} />
              </span>
              <span className="font-black">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section id="workflow" className="px-4 py-20 sm:px-6 lg:px-8">
      <SectionTitle eyebrow="Workflow" title="Upload, process, download" subtitle="A three-step conversion path that keeps users confident from first click to final file." />
      <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
        {[
          ['Upload', UploadCloud, 'Drag files in, preview the queue, or import from cloud storage.'],
          ['Process', Sparkles, 'Choose a PDF tool and watch real-time progress with clean status states.'],
          ['Download', Download, 'Download converted files instantly or keep working in the dashboard.'],
        ].map(([title, Icon, copy], index) => (
          <div key={title} className="relative rounded-[2rem] border border-slate-200/80 bg-white/80 p-7 shadow-premium backdrop-blur">
            <span className="absolute right-6 top-6 text-5xl font-black text-red-100">0{index + 1}</span>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-600 text-white shadow-glow">
              <Icon size={24} />
            </span>
            <h3 className="mt-8 text-2xl font-black">{title}</h3>
            <p className="mt-3 leading-7 text-slate-600">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Dashboard({ files, totalSize, removeFile, downloadFile, compact = false }) {
  return (
    <section className={compact ? '' : 'px-4 py-20 sm:px-6 lg:px-8'}>
      <div className={classNames('mx-auto rounded-[2rem] border border-slate-200/80 bg-white p-4 text-slate-950 shadow-premium sm:p-6', compact ? 'max-w-none lg:p-6' : 'max-w-7xl lg:p-8')}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-red-600">Uploaded files dashboard</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your conversion queue</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniMetric label="Files" value={files.length} />
            <MiniMetric label="Size" value={formatSize(totalSize)} />
            <MiniMetric label="Mode" value="Secure" />
          </div>
        </div>
        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-red-950/5">
          {files.length ? (
            <div className="divide-y divide-slate-100">
              {files.map((item) => (
                <div key={item.id} className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
                      <FileText size={22} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black">{item.file.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatSize(item.file.size)} - {item.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => downloadFile(item)} disabled={item.status !== 'Converted'} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45">
                      <Download size={16} />
                      Download
                    </button>
                    <button type="button" aria-label="Remove file" onClick={() => removeFile(item.id)} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-red-50 hover:text-red-600">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-56 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-red-50 text-red-600">
                  <Files size={28} />
                </span>
                <h3 className="mt-5 text-xl font-black">No files uploaded yet</h3>
                <p className="mt-2 max-w-md text-slate-500">Add PDFs in the hero uploader to preview files, process them, and download the converted output.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function AiSummarizer() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-red-100 bg-gradient-to-br from-white to-red-50 p-6 shadow-premium lg:grid-cols-[1fr_0.9fr] lg:p-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white shadow-glow">
            <BrainCircuit size={16} />
            AI PDF summarizer
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-5xl">Understand long PDFs before you convert them</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Generate summaries, extract action items, identify tables, and prepare OCR recommendations from uploaded documents.
          </p>
          <button type="button" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-black text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-1 hover:bg-red-700">
            Try AI summary <ArrowRight size={18} />
          </button>
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-lg">
          {['Executive summary', 'Key dates and numbers', 'Detected tables', 'Recommended compression'].map((item, index) => (
            <div key={item} className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 last:mb-0">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-100 text-sm font-black text-red-700">{index + 1}</span>
              <span className="font-bold">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <SectionTitle eyebrow="Loved by professionals" title="Reviews from teams who live in PDFs" subtitle="Clean tools, fast processing, and a workflow that feels calm even during deadline work." />
      <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
        {testimonials.map((item) => (
          <div key={item.name} className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-7 shadow-lg backdrop-blur">
            <div className="mb-5 flex gap-1 text-red-500">
              {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={18} fill="currentColor" />)}
            </div>
            <p className="leading-7 text-slate-600">"{item.quote}"</p>
            <div className="mt-6">
              <p className="font-black">{item.name}</p>
              <p className="text-sm font-semibold text-slate-500">{item.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8">
      <SectionTitle eyebrow="100% Free" title="Free Forever" subtitle="No subscriptions, no hidden fees. All premium features are included completely for free." />
      <div className="mx-auto mt-12 max-w-md">
        <Plan featured name="Free Plan" price="$0" features={['Unlimited batch processing', 'AI summarizer and OCR', 'Cloud integrations', 'Priority API processing', 'Secure downloads']} />
      </div>
    </section>
  );
}

function Plan({ name, price, features: planFeatures, featured }) {
  return (
    <div className={classNames('rounded-[2rem] border p-7 shadow-premium', featured ? 'border-red-500 bg-red-600 text-white' : 'border-slate-200/80 bg-white/95')}>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-2xl font-black">{name}</h3>
        {featured && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">Best value</span>}
      </div>
      <p className="mt-6 text-5xl font-black">{price}<span className="text-base font-bold opacity-70">/mo</span></p>
      <div className="mt-7 space-y-3">
        {planFeatures.map((feature) => (
          <div key={feature} className="flex items-center gap-3">
            <span className={classNames('grid h-6 w-6 place-items-center rounded-full', featured ? 'bg-white text-red-700' : 'bg-red-100 text-red-700')}>
              <Check size={14} />
            </span>
            <span className="font-semibold">{feature}</span>
          </div>
        ))}
      </div>
      <button type="button" className={classNames('mt-8 w-full rounded-2xl px-5 py-4 font-black transition hover:-translate-y-1', featured ? 'bg-white text-red-700' : 'bg-red-600 text-white hover:bg-red-700')}>
        Get started
      </button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="px-4 pb-8 pt-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-lg backdrop-blur md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white">
              <Sparkles size={20} />
            </span>
            <span className="text-lg font-black">PDFFlow</span>
          </div>
          <p className="mt-4 max-w-sm leading-7 text-slate-600">A premium all-in-one PDF converter experience with secure upload flows and modern conversion tools.</p>
          <div className="mt-5 flex gap-2">
            {[Globe2, Link2, Mail].map((Icon, index) => (
              <a key={index} href="#" aria-label="Social link" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:text-red-700">
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>
        {[
          ['Quick links', ['Tools', 'Compress PDF', 'Merge PDF', 'OCR PDF']],
          ['Company', ['About', 'Contact', 'API', 'Status']],
          ['Legal', ['Terms', 'Privacy', 'Security', 'Cookies']],
        ].map(([title, links]) => (
          <div key={title}>
            <h3 className="font-black">{title}</h3>
            <div className="mt-4 space-y-3">
              {links.map((link) => (
                <a key={link} href="#" className="block text-sm font-semibold text-slate-500 transition hover:text-red-700">
                  {link}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-7xl text-center text-sm font-semibold text-slate-500">Copyright 2026 PDFFlow. Built for fast, secure document workflows.</p>
    </footer>
  );
}

function SectionTitle({ eyebrow, title, subtitle, align = 'center' }) {
  return (
    <div className={classNames('mx-auto max-w-3xl', align === 'center' ? 'text-center' : 'text-left')}>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-red-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{title}</h2>
      <p className="mt-5 text-lg leading-8 text-slate-600">{subtitle}</p>
    </div>
  );
}

// ─── inputClass helper ────────────────────────────────────────────────────────
function inputClass(hasError) {
  return classNames(
    'w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2',
    hasError
      ? 'border-red-400 focus:ring-red-400'
      : 'border-slate-200 focus:border-red-400 focus:ring-red-400'
  );
}

// ─── Field — labeled input wrapper ───────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs font-semibold text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── UserAvatar — initials circle + dropdown ─────────────────────────────────
function UserAvatar({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-red-600 text-xs font-black text-white">{initials}</span>
        <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
        <ChevronRight size={14} className={classNames('transition-transform duration-200', open && 'rotate-90')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-premium"
          >
            <div className="mb-1 border-b border-slate-100 px-3 py-2">
              <p className="truncate text-sm font-black text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={15} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AuthModal — Sign In / Sign Up ────────────────────────────────────────────
function AuthModal({ open, onClose, onSuccess }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  // Reset form state when modal opens or tab changes
  useEffect(() => {
    setForm({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setGlobalError('');
    setLoading(false);
    setShowPw(false);
    setShowCpw(false);
  }, [open, tab]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  function setField(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  // Password strength: 0-4
  function getStrength(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/\d/.test(pw)) s++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw)) s++;
    return s;
  }
  const strength = getStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-red-500', 'bg-red-600', 'bg-red-700'][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);
    const isSignup = tab === 'signup';
    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
    const body = isSignup
      ? { name: form.name, email: form.email, password: form.password, confirmPassword: form.confirmPassword }
      : { email: form.email, password: form.password };
    try {
      const res = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setGlobalError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      onSuccess(data.user);
    } catch {
      setGlobalError('Cannot reach the server. Make sure the API is running (npm run api).');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-red-950/20 backdrop-blur-sm" />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/95 p-8 shadow-premium backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            >
              <X size={16} />
            </button>

            {/* Logo */}
            <div className="mb-7 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white shadow-glow">
                <Sparkles size={20} />
              </span>
              <span className="text-lg font-black tracking-tight text-slate-950">PDFFlow</span>
            </div>

            {/* Tab switcher */}
            <div className="mb-7 flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {['login', 'signup'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={classNames(
                    'flex-1 rounded-xl py-2.5 text-sm font-black transition',
                    tab === t
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {t === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-black text-slate-950">
              {tab === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {tab === 'login'
                ? 'Enter your credentials to access your account.'
                : 'Join PDFFlow and start converting documents for free.'}
            </p>

            {/* Global error banner */}
            <AnimatePresence>
              {globalError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  {globalError}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {/* Full Name — signup only */}
              {tab === 'signup' && (
                <Field label="Full Name" error={errors.name}>
                  <input
                    type="text"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={setField('name')}
                    autoComplete="name"
                    className={inputClass(errors.name)}
                  />
                </Field>
              )}

              {/* Email */}
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={setField('email')}
                  autoComplete="email"
                  className={inputClass(errors.email)}
                />
              </Field>

              {/* Password */}
              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={setField('password')}
                    autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                    className={classNames(inputClass(errors.password), 'pr-11')}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {/* Strength meter — visible on signup */}
                {tab === 'signup' && form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={classNames(
                            'h-1 flex-1 rounded-full transition-colors duration-300',
                            strength >= i ? strengthColor : 'bg-slate-200'
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{strengthLabel}</p>
                  </div>
                )}
              </Field>

              {/* Confirm password — signup only */}
              {tab === 'signup' && (
                <Field label="Confirm Password" error={errors.confirmPassword}>
                  <div className="relative">
                    <input
                      type={showCpw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={setField('confirmPassword')}
                      autoComplete="new-password"
                      className={classNames(inputClass(errors.confirmPassword), 'pr-11')}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowCpw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    >
                      {showCpw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </Field>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-2xl bg-red-600 py-4 font-black text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Please wait…
                  </span>
                ) : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Tab switch link */}
            <p className="mt-5 text-center text-sm text-slate-500">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
                className="font-bold text-red-600 hover:underline"
              >
                {tab === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Wrap App in AuthProvider so useAuth() works everywhere
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
