import pptxgen from 'pptxgenjs';
import JSZip from 'jszip';
import fs from 'node:fs/promises';

const OUT_DIR = 'D:/old laptop/4TH SEMESTER/DATA BASE THEORY/presentaion';
const OUT = `${OUT_DIR}/Future Trends in Database Systems - Group 2.pptx`;

const pptx = new pptxgen();
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'CUSTOM_WIDE';
pptx.author = 'Group 2';
pptx.company = 'University Seminar';
pptx.subject = 'Future Trends in Database Systems';
pptx.title = 'Future Trends in Database Systems';
pptx.lang = 'en-US';
pptx.theme = { headFontFace: 'Aptos Display', bodyFontFace: 'Aptos', lang: 'en-US' };

const W = 13.333;
const H = 7.5;
const C = {
  navy: '071527',
  navy2: '0B2447',
  ink: '0F172A',
  blue: '2563EB',
  cyan: '38BDF8',
  sky: 'E0F2FE',
  white: 'FFFFFF',
  soft: 'F8FAFC',
  slate: '64748B',
  line: 'CBD5E1',
  green: '22C55E',
  amber: 'F59E0B',
  red: 'EF4444',
  violet: '7C3AED',
};

function addBg(slide, dark = false) {
  slide.background = { color: dark ? C.navy : C.soft };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: dark ? C.navy : C.soft }, line: { color: dark ? C.navy : C.soft, transparency: 100 } });
  if (dark) {
    slide.addShape(pptx.ShapeType.chevron, { x: 9.18, y: 0.2, w: 3.65, h: 7.0, fill: { color: C.navy2, transparency: 12 }, line: { color: C.navy2, transparency: 100 } });
    slide.addShape(pptx.ShapeType.arc, { x: 11.75, y: -1.15, w: 2.95, h: 2.95, adjustPoint: 0.23, fill: { color: C.blue, transparency: 12 }, line: { color: C.blue, transparency: 100 }, rotate: 18 });
    slide.addShape(pptx.ShapeType.arc, { x: -1.25, y: 6.05, w: 1.8, h: 1.8, adjustPoint: 0.22, fill: { color: C.cyan, transparency: 25 }, line: { color: C.cyan, transparency: 100 }, rotate: 220 });
  } else {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.18, fill: { color: C.blue }, line: { color: C.blue } });
    slide.addShape(pptx.ShapeType.rect, { x: 12.78, y: 0, w: 0.55, h: 0.56, fill: { color: C.sky }, line: { color: C.sky, transparency: 100 } });
  }
}

function addTitle(slide, heading, sub, dark = false) {
  slide.addText(heading, { x: 0.62, y: 0.42, w: 9.6, h: 0.42, fontFace: 'Aptos Display', fontSize: 22.5, bold: true, color: dark ? C.white : C.ink, margin: 0, fit: 'shrink' });
  slide.addText(sub, { x: 0.64, y: 0.92, w: 10.5, h: 0.24, fontSize: 9.6, color: dark ? 'B6D8FF' : C.slate, margin: 0, fit: 'shrink' });
  slide.addShape(pptx.ShapeType.line, { x: 0.64, y: 1.26, w: 1.05, h: 0, line: { color: C.cyan, width: 2.2 } });
}

function footer(slide, n, dark = false) {
  slide.addText(`Group 2 | Future Trends in Database Systems | ${String(n).padStart(2, '0')}`, { x: 0.62, y: 7.08, w: 4.8, h: 0.15, fontSize: 6.8, color: dark ? '9CC8F5' : C.slate, margin: 0 });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 7.36, w: W, h: 0.02, fill: { color: C.cyan, transparency: 15 }, line: { color: C.cyan, transparency: 100 } });
}

function slideBase(n, heading, sub, dark = false) {
  const slide = pptx.addSlide();
  addBg(slide, dark);
  if (heading) addTitle(slide, heading, sub, dark);
  footer(slide, n, dark);
  return slide;
}

function bullets(slide, arr, x, y, w, opts = {}) {
  const color = opts.color || C.ink;
  const size = opts.size || 10.6;
  const gap = opts.gap || 0.42;
  const dot = opts.dot || C.cyan;
  arr.forEach((b, i) => {
    const yy = y + i * gap;
    slide.addShape(pptx.ShapeType.ellipse, { x, y: yy + 0.07, w: 0.08, h: 0.08, fill: { color: dot }, line: { color: dot } });
    slide.addText(b, { x: x + 0.2, y: yy, w, h: opts.h || 0.32, fontSize: size, color, margin: 0, fit: 'shrink', breakLine: false });
  });
}

function para(slide, text, x, y, w, h, dark = false, size = 10.4) {
  slide.addText(text, { x, y, w, h, fontSize: size, color: dark ? 'D7EAFE' : C.slate, margin: 0.02, fit: 'shrink', breakLine: false, valign: 'mid' });
}

function card(slide, title, body, x, y, w, h, accent = C.blue, dark = false) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: dark ? '10233F' : C.white, transparency: dark ? 4 : 0 }, line: { color: dark ? '315A8A' : C.line, transparency: dark ? 25 : 0 } });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, fill: { color: accent }, line: { color: accent, transparency: 100 } });
  slide.addText(title, { x: x + 0.18, y: y + 0.16, w: w - 0.34, h: 0.2, fontSize: 11.2, bold: true, color: dark ? C.white : C.ink, margin: 0, fit: 'shrink' });
  slide.addText(body, { x: x + 0.18, y: y + 0.48, w: w - 0.34, h: h - 0.62, fontSize: 8.8, color: dark ? 'B6D8FF' : C.slate, margin: 0.02, fit: 'shrink', breakLine: false });
}

function iconDb(slide, x, y, s, color = C.blue) {
  slide.addShape(pptx.ShapeType.can, { x, y, w: s, h: s * 0.82, fill: { color, transparency: 4 }, line: { color: C.white, transparency: 55 } });
  slide.addShape(pptx.ShapeType.line, { x: x + 0.08, y: y + s * 0.3, w: s - 0.16, h: 0, line: { color: C.white, transparency: 30, width: 1 } });
  slide.addShape(pptx.ShapeType.line, { x: x + 0.08, y: y + s * 0.55, w: s - 0.16, h: 0, line: { color: C.white, transparency: 30, width: 1 } });
}

function iconAi(slide, x, y, s, color = C.cyan) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w: s, h: s, rectRadius: 0.08, fill: { color, transparency: 8 }, line: { color: C.white, transparency: 60 } });
  for (let i = 0; i < 4; i++) {
    slide.addShape(pptx.ShapeType.line, { x: x - 0.1, y: y + 0.16 + i * s * 0.2, w: 0.1, h: 0, line: { color, width: 1.2 } });
    slide.addShape(pptx.ShapeType.line, { x: x + s, y: y + 0.16 + i * s * 0.2, w: 0.1, h: 0, line: { color, width: 1.2 } });
  }
  slide.addText('AI', { x: x + s * 0.18, y: y + s * 0.34, w: s * 0.64, h: s * 0.18, fontSize: 10.2, bold: true, color: C.white, align: 'center', margin: 0 });
}

function iconChain(slide, x, y, s, color = C.violet) {
  for (let i = 0; i < 3; i++) {
    slide.addShape(pptx.ShapeType.roundRect, { x: x + i * s * 0.36, y: y + (i % 2) * s * 0.18, w: s * 0.32, h: s * 0.32, rectRadius: 0.04, fill: { color, transparency: 4 }, line: { color: C.white, transparency: 65 } });
    if (i < 2) slide.addShape(pptx.ShapeType.line, { x: x + i * s * 0.36 + s * 0.31, y: y + 0.16 + (i % 2) * s * 0.18, w: s * 0.22, h: i % 2 ? -s * 0.12 : s * 0.12, line: { color: C.cyan, width: 1.6 } });
  }
}

function iconVector(slide, x, y, s, color = C.green) {
  const pts = [[0.12, 0.72], [0.43, 0.35], [0.7, 0.6], [0.88, 0.22]];
  pts.forEach(([px, py]) => slide.addShape(pptx.ShapeType.ellipse, { x: x + px * s, y: y + py * s, w: s * 0.11, h: s * 0.11, fill: { color }, line: { color } }));
  for (let i = 0; i < pts.length - 1; i++) slide.addShape(pptx.ShapeType.line, { x: x + (pts[i][0] + 0.05) * s, y: y + (pts[i][1] + 0.05) * s, w: (pts[i + 1][0] - pts[i][0]) * s, h: (pts[i + 1][1] - pts[i][1]) * s, line: { color: C.white, transparency: 30, width: 1.5 } });
}

function iconCloud(slide, x, y, s, color = C.blue) {
  slide.addShape(pptx.ShapeType.cloud, { x, y, w: s * 1.25, h: s * 0.72, fill: { color, transparency: 5 }, line: { color: C.white, transparency: 60 } });
}

function notes(slide, lines) {
  slide.addNotes(lines.join('\n'));
}

let s;

// 1
s = pptx.addSlide();
addBg(s, true);
s.addText('Future Trends\nin Database Systems', { x: 0.7, y: 0.9, w: 6.6, h: 1.35, fontFace: 'Aptos Display', fontSize: 30, bold: true, color: C.white, margin: 0, fit: 'shrink' });
s.addText('Group 2 Presentation', { x: 0.72, y: 2.55, w: 3.2, h: 0.22, fontSize: 13.5, color: C.cyan, bold: true, margin: 0 });
para(s, 'A detailed university seminar on autonomous databases, blockchain databases, vector databases, and AI-assisted query optimization.', 0.72, 2.95, 6.7, 0.55, true, 12);
['Hadi', 'Abdal', 'Shujaat', 'Fawad'].forEach((m, i) => {
  s.addShape(pptx.ShapeType.roundRect, { x: 9.05, y: 1.25 + i * 0.58, w: 2.7, h: 0.38, rectRadius: 0.07, fill: { color: 'FFFFFF', transparency: 92 }, line: { color: '6EA8FF', transparency: 45 } });
  s.addText(`${i + 1}`, { x: 9.17, y: 1.36 + i * 0.58, w: 0.18, h: 0.1, fontSize: 7.6, bold: true, color: C.cyan, margin: 0 });
  s.addText(m, { x: 9.55, y: 1.33 + i * 0.58, w: 1.75, h: 0.14, fontSize: 11.5, color: C.white, margin: 0 });
});
s.addText('GROUP 2', { x: 9.25, y: 0.72, w: 2.25, h: 0.28, fontSize: 17, bold: true, color: C.cyan, align: 'center', margin: 0 });
iconDb(s, 7.75, 4.78, 0.62); iconChain(s, 8.7, 4.75, 0.72); iconVector(s, 9.86, 4.73, 0.76); iconCloud(s, 11.05, 4.9, 0.58); iconAi(s, 12.1, 4.85, 0.52);
footer(s, 1, true);
notes(s, ['Introduce Group 2 and the topic. Explain that the presentation studies where database systems are going next: automation, distributed trust, semantic AI search, and intelligent performance tuning.', 'Tell the audience that each section includes definition, working, examples, advantages, challenges, and future career value.']);

// 2
s = slideBase(2, 'Introduction to Database Systems', 'Databases are the organized memory of modern applications, businesses, and AI systems.', false);
card(s, 'What is a database?', 'A database is an organized collection of data that can be stored, searched, updated, protected, and analyzed. It allows applications to manage information reliably instead of storing random files without structure.', 0.75, 1.55, 3.55, 1.35, C.blue);
card(s, 'Why databases matter today', 'Every digital service depends on databases: banking apps, university portals, e-commerce websites, hospitals, social media, cloud platforms, and AI systems all require fast and secure access to data.', 4.65, 1.55, 3.55, 1.35, C.green);
card(s, 'From traditional to AI-powered', 'Database systems have moved from single-server relational systems to cloud-native, distributed, automated, and AI-integrated platforms that can handle huge data volumes and intelligent search.', 8.55, 1.55, 3.55, 1.35, C.violet);
const timeline = [['1960s-80s', 'Hierarchical / Network'], ['1990s', 'Relational SQL'], ['2000s', 'NoSQL / Big Data'], ['2010s', 'Cloud DB'], ['2020s+', 'AI-native DB']];
timeline.forEach((t, i) => {
  const x = 1.0 + i * 2.35;
  s.addShape(pptx.ShapeType.line, { x: x + 0.55, y: 4.7, w: i < 4 ? 1.55 : 0, h: 0, line: { color: C.blue, width: 2 } });
  s.addShape(pptx.ShapeType.ellipse, { x: x + 0.35, y: 4.5, w: 0.42, h: 0.42, fill: { color: i === 4 ? C.cyan : C.blue }, line: { color: C.white } });
  s.addText(t[0], { x: x - 0.12, y: 3.85, w: 1.35, h: 0.16, fontSize: 8.6, bold: true, color: C.blue, align: 'center', margin: 0 });
  s.addText(t[1], { x: x - 0.28, y: 5.08, w: 1.65, h: 0.2, fontSize: 8.2, color: C.slate, align: 'center', margin: 0, fit: 'shrink' });
});
bullets(s, ['Big data growth means organizations must store and process massive structured and unstructured data.', 'Cloud computing makes databases scalable, globally available, and easier to manage.', 'AI creates new data needs such as embeddings, semantic search, automated tuning, and intelligent analytics.'], 0.9, 6.05, 10.9, { size: 9.9, gap: 0.34 });
notes(s, ['Explain databases using simple examples such as student records, bank transactions, and online shopping orders.', 'Emphasize that future database systems are important because data volume, speed requirements, security risks, and AI usage are all increasing.']);

// 3
s = slideBase(3, 'Traditional vs Modern Databases', 'Modern database architecture expands from single-server storage to cloud, distributed, and AI-integrated systems.', false);
const headers = ['Aspect', 'Traditional Relational', 'Cloud Databases', 'Distributed Databases', 'AI-Integrated DB'];
const rows = [
  ['Scalability', 'Limited by server capacity', 'Elastic scaling on demand', 'Scale across nodes/regions', 'Adapts resources using workload signals'],
  ['Speed', 'Strong for structured SQL', 'Fast managed infrastructure', 'Parallel processing and replication', 'Optimized by ML-assisted planning'],
  ['Security', 'Local controls and backups', 'Managed security and patching', 'Replication plus access controls', 'Threat detection and policy automation'],
  ['Data Handling', 'Tables, rows, schemas', 'Relational, NoSQL, analytics', 'High-volume global data', 'Structured plus unstructured embeddings'],
  ['Storage', 'Centralized server storage', 'Managed cloud storage', 'Sharded/replicated storage', 'Hybrid data + vector indexes'],
];
s.addShape(pptx.ShapeType.roundRect, { x: 0.55, y: 1.55, w: 12.15, h: 5.1, rectRadius: 0.06, fill: { color: C.white }, line: { color: C.line } });
headers.forEach((h, i) => s.addText(h, { x: 0.75 + i * 2.4, y: 1.82, w: i ? 2.05 : 1.45, h: 0.22, fontSize: 8.5, bold: true, color: C.blue, margin: 0, align: i ? 'center' : 'left', fit: 'shrink' }));
rows.forEach((r, ri) => {
  const y = 2.34 + ri * 0.74;
  s.addShape(pptx.ShapeType.line, { x: 0.72, y: y - 0.18, w: 11.62, h: 0, line: { color: 'E2E8F0', width: 0.7 } });
  r.forEach((cell, ci) => s.addText(cell, { x: 0.75 + ci * 2.4, y, w: ci ? 2.08 : 1.45, h: 0.32, fontSize: ci ? 7.6 : 8.4, bold: ci === 0, color: ci === 0 ? C.ink : C.slate, margin: 0.01, fit: 'shrink', breakLine: false, align: ci ? 'center' : 'left' }));
});
para(s, 'Key idea: traditional databases are still useful, but modern systems add elasticity, distributed availability, automation, and AI-aware data processing.', 0.75, 6.85, 11.7, 0.28, false, 10.6);
notes(s, ['Use this comparison to show that modern databases are not a replacement for all traditional systems; they add capabilities needed for current applications.', 'Explain scalability, speed, security, data handling, and storage architecture in everyday language.']);

// 4
s = slideBase(4, 'What are Autonomous Databases?', 'Autonomous databases use AI, machine learning, and automation to reduce manual database administration.', true);
para(s, 'An autonomous database is a self-driving database system that can perform many routine management tasks automatically. Instead of depending on a human administrator for every backup, patch, tuning decision, or scaling action, the database monitors itself and applies safe automated actions.', 0.85, 1.55, 6.25, 1.0, true, 12.3);
bullets(s, ['Self-driving: provisions resources, monitors workload, tunes performance, and manages storage.', 'Machine learning: studies workload patterns and predicts better configuration choices.', 'Automatic maintenance: applies updates, backups, patching, and routine operations with less downtime.', 'Example: Oracle Autonomous Database promotes automated patching, upgrades, tuning, and elastic scaling.'], 0.9, 3.0, 5.8, { color: C.white, size: 10.5, gap: 0.5 });
iconDb(s, 8.1, 2.05, 0.82); iconAi(s, 9.35, 2.08, 0.72); iconCloud(s, 10.55, 2.2, 0.8);
['Telemetry', 'ML analysis', 'Automated action', 'Improved database'].forEach((t, i) => {
  const x = 7.3 + i * 1.32;
  s.addShape(pptx.ShapeType.roundRect, { x, y: 4.25, w: 1.05, h: 0.8, rectRadius: 0.07, fill: { color: [C.blue, C.violet, C.green, C.cyan][i], transparency: 6 }, line: { color: C.white, transparency: 65 } });
  s.addText(t, { x: x + 0.08, y: 4.53, w: 0.9, h: 0.16, fontSize: 7.4, bold: true, color: C.white, align: 'center', margin: 0, fit: 'shrink' });
  if (i < 3) s.addShape(pptx.ShapeType.chevron, { x: x + 1.08, y: 4.47, w: 0.25, h: 0.25, fill: { color: C.cyan }, line: { color: C.cyan } });
});
notes(s, ['Define autonomous databases clearly: they are databases that automate routine administration tasks using AI, ML, and policy-based automation.', 'Mention that Oracle is the most common example, but managed cloud databases from major providers also automate backups, patches, scaling, and monitoring.']);

// 5
s = slideBase(5, 'Features of Autonomous Databases', 'Autonomous systems combine management, recovery, security, and performance automation.', false);
const feats = [
  ['Self-managing', 'Automatically handles provisioning, configuration, backups, storage management, and monitoring so teams spend less time on repetitive administration.', C.blue],
  ['Self-healing', 'Detects failures, retries operations, restores services, and uses high availability features to reduce downtime and improve reliability.', C.green],
  ['Self-securing', 'Applies security patches, encryption, access controls, and threat monitoring to reduce exposure from delayed manual maintenance.', C.violet],
  ['Performance optimization', 'Uses workload statistics to tune SQL execution, indexes, memory, and resources for changing application demand.', C.amber],
  ['Automatic scaling', 'Adds or reduces compute and storage according to workload so performance and cost remain balanced.', C.cyan],
  ['Automated backups', 'Creates scheduled backups and recovery points to protect against accidental deletion, corruption, or disaster events.', C.red],
];
feats.forEach((f, i) => card(s, f[0], f[1], 0.72 + (i % 3) * 4.05, 1.55 + Math.floor(i / 3) * 2.15, 3.65, 1.65, f[2]));
notes(s, ['Explain each feature in a practical way. For example, self-managing means fewer manual configuration tasks; self-healing means the system responds to failures; self-securing means updates and controls are applied faster.', 'Give real-world examples: cloud database services with automatic backup, auto-scaling, automatic tuning, and security patching.']);

// 6
s = slideBase(6, 'Advantages and Challenges of Autonomous Databases', 'Autonomous databases improve operations, but they also introduce adoption and dependency concerns.', false);
s.addChart(pptx.ChartType.bar, [
  { name: 'Potential benefit', labels: ['Human effort', 'Operational cost', 'Performance delay', 'Security exposure'], values: [75, 60, 55, 65] },
  { name: 'After automation', labels: ['Human effort', 'Operational cost', 'Performance delay', 'Security exposure'], values: [30, 42, 25, 28] },
], { x: 0.75, y: 1.7, w: 5.25, h: 3.35, valAxisMaxVal: 100, showLegend: true, legendPos: 'b', catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, valGridLine: { color: 'E2E8F0', transparency: 30 }, chartColors: [C.slate, C.blue] });
card(s, 'Advantages', 'Reduced human effort, lower routine operational cost, faster performance tuning, stronger default security, fewer manual errors, and quicker database setup for new projects.', 6.55, 1.65, 5.45, 1.65, C.green);
card(s, 'Challenges', 'High implementation cost, migration complexity, dependence on cloud providers, limited control over internal automation, and the need for teams to trust automated decisions.', 6.55, 3.65, 5.45, 1.65, C.red);
para(s, 'Conclusion: autonomous databases are powerful for organizations that want reliability and speed, but planning is needed before migration.', 0.78, 5.85, 10.8, 0.36, false, 11.2);
notes(s, ['Read the advantage and challenge sections as a balanced view.', 'The chart is conceptual: it shows the typical direction of improvement when routine operations are automated.', 'Emphasize that autonomous databases do not remove the need for database professionals; they change the type of work professionals do.']);

// 7
s = slideBase(7, 'Introduction to Blockchain Databases', 'Blockchain databases are decentralized, tamper-evident ledgers designed for shared trust.', true);
iconChain(s, 0.95, 1.85, 1.05);
para(s, 'A blockchain database stores data in blocks that are linked together using cryptographic hashes. Instead of one central authority controlling the full database, copies of the ledger can be shared across many network participants.', 2.4, 1.55, 8.7, 0.78, true, 11.8);
bullets(s, ['Decentralized storage: multiple participants keep copies of the ledger instead of relying on only one server.', 'Immutable records: once a block is validated, changing it is extremely difficult because it would affect later blocks.', 'Transparency and auditability: participants can verify the history of transactions.', 'Difference from traditional systems: blockchain prioritizes trust and verification, while traditional databases usually prioritize speed and centralized control.'], 0.98, 3.0, 9.2, { color: C.white, size: 10.3, gap: 0.47 });
para(s, 'Best fit: multi-party processes such as banking settlement, healthcare record sharing, supply-chain traceability, and identity verification.', 0.98, 5.95, 9.5, 0.34, true, 11.4);
notes(s, ['Define blockchain as a shared immutable ledger using the IBM wording in simple terms: shared, tamper-evident, and useful for tracking transactions or assets.', 'Explain that decentralization does not automatically make every system better; it is valuable when multiple parties need trust.']);

// 8
s = slideBase(8, 'Working of Blockchain Databases', 'A blockchain workflow validates transactions, groups them into blocks, and shares the ledger across the network.', false);
const steps = [
  ['1. Transaction', 'A user or system requests an action, such as payment, record update, asset movement, or identity verification.'],
  ['2. Block creation', 'Validated transactions are grouped into a block with metadata, timestamp, and link to the previous block.'],
  ['3. Hashing', 'A cryptographic hash creates a unique fingerprint; any change in block data changes the hash.'],
  ['4. Consensus', 'Network participants agree that the block is valid using a consensus mechanism.'],
  ['5. Distributed ledger', 'The accepted block is added to the chain and copied across participating nodes.'],
];
steps.forEach((st, i) => {
  const x = 0.75 + i * 2.43;
  s.addShape(pptx.ShapeType.roundRect, { x, y: 1.85, w: 1.82, h: 1.35, rectRadius: 0.08, fill: { color: [C.blue, C.violet, C.green, C.amber, C.cyan][i], transparency: 6 }, line: { color: C.white } });
  s.addText(st[0], { x: x + 0.12, y: 2.08, w: 1.58, h: 0.18, fontSize: 9.4, bold: true, color: C.white, align: 'center', margin: 0, fit: 'shrink' });
  s.addText(st[1], { x: x + 0.12, y: 2.43, w: 1.58, h: 0.45, fontSize: 6.9, color: C.white, align: 'center', margin: 0, fit: 'shrink', breakLine: false });
  if (i < 4) s.addShape(pptx.ShapeType.chevron, { x: x + 1.88, y: 2.34, w: 0.28, h: 0.28, fill: { color: C.blue }, line: { color: C.blue } });
});
card(s, 'Real-world workflow example', 'In a supply chain, each movement of a product can be recorded as a transaction. Manufacturers, transporters, warehouses, and retailers can verify the same product history without depending on one company database.', 1.0, 4.25, 5.55, 1.7, C.blue);
card(s, 'Security logic', 'Blockchain security comes from cryptographic links, distributed copies, consensus validation, and tamper-evident records. It is strongest when participants need proof of data history.', 6.95, 4.25, 5.25, 1.7, C.violet);
notes(s, ['Walk step-by-step through the process flow.', 'Use a product supply chain example: each handoff becomes a transaction, blocks record the history, and participants can audit the trail.']);

// 9
s = slideBase(9, 'Applications of Blockchain Databases', 'Blockchain is most useful where records must be shared, verified, and protected from tampering.', true);
const bapps = [
  ['Banking and finance', 'Cross-border payments, settlements, asset tokenization, audit trails, and fraud-resistant transaction history.'],
  ['Healthcare records', 'Secure sharing of patient record access logs, consent history, prescriptions, and medical data provenance.'],
  ['Supply chain management', 'Track products from origin to customer, verify authenticity, reduce counterfeit goods, and improve recall tracing.'],
  ['Voting systems', 'Transparent ballot tracking and verifiable records, although privacy, identity, and governance challenges remain important.'],
  ['Digital identity', 'User-controlled identity credentials that can be verified without exposing unnecessary personal information.'],
];
bapps.forEach((a, i) => card(s, a[0], a[1], 0.75 + (i % 2) * 5.85, 1.55 + Math.floor(i / 2) * 1.63, i === 4 ? 11.25 : 5.25, 1.22, [C.blue, C.green, C.violet, C.amber, C.cyan][i], true));
notes(s, ['Explain each industry example and connect it to blockchain strengths: shared trust, auditability, and tamper-evident history.', 'Mention that blockchain should not be used only because it is trendy. It fits best when many parties need a shared source of truth.']);

// 10
s = slideBase(10, 'Introduction to Vector Databases', 'Vector databases store embeddings so AI systems can search by meaning rather than exact words.', false);
iconVector(s, 0.92, 1.65, 0.85);
para(s, 'A vector database is a database designed to store and search vector embeddings. An embedding is a list of numbers produced by an AI model to represent the meaning or features of text, images, audio, or other data.', 2.0, 1.58, 9.7, 0.7, false, 11.6);
card(s, 'Why vector databases matter in AI', 'Traditional keyword search finds exact words. Vector search can find similar meaning, so it supports semantic search, retrieval-augmented generation, image similarity, recommendations, and intelligent assistants.', 0.85, 2.75, 5.55, 1.6, C.green);
card(s, 'Semantic search concept', 'The query and documents are converted into vectors. The database compares the query vector with stored vectors and returns the closest results based on similarity distance.', 6.8, 2.75, 5.35, 1.6, C.blue);
bullets(s, ['Popular vector database tools include Pinecone, Weaviate, Milvus, ChromaDB, pgvector, and cloud vector search services.', 'Vector databases are important because modern AI systems often need external knowledge, not only the model training data.', 'They help convert unstructured content into searchable knowledge for applications such as ChatGPT-style assistants.'], 1.0, 5.25, 10.5, { size: 9.8, gap: 0.36 });
notes(s, ['Explain embeddings using a simple analogy: a vector is like a coordinate that places similar meanings close together.', 'Mention that vector databases are central to AI applications because they let systems retrieve relevant knowledge before generating answers.']);

// 11
s = slideBase(11, 'How Vector Databases Work', 'Vector search follows a pipeline: embed data, store vectors, search nearest neighbors, and return context.', true);
const vsteps = [['Data', 'PDFs, text, images'], ['Embedding model', 'converts to vectors'], ['Vector index', 'stores + organizes'], ['Similarity search', 'nearest neighbors'], ['AI response', 'uses retrieved context']];
vsteps.forEach((st, i) => {
  const x = 0.85 + i * 2.35;
  s.addShape(pptx.ShapeType.roundRect, { x, y: 1.95, w: 1.65, h: 1.18, rectRadius: 0.08, fill: { color: [C.blue, C.violet, C.green, C.amber, C.cyan][i], transparency: 5 }, line: { color: C.white, transparency: 65 } });
  s.addText(st[0], { x: x + 0.1, y: 2.18, w: 1.42, h: 0.16, fontSize: 8.8, bold: true, color: C.white, align: 'center', margin: 0 });
  s.addText(st[1], { x: x + 0.1, y: 2.56, w: 1.42, h: 0.18, fontSize: 7.4, color: 'E0F2FE', align: 'center', margin: 0, fit: 'shrink' });
  if (i < 4) s.addShape(pptx.ShapeType.chevron, { x: x + 1.72, y: 2.4, w: 0.32, h: 0.32, fill: { color: C.cyan }, line: { color: C.cyan } });
});
bullets(s, ['Embeddings: numerical vectors generated by AI models to capture meaning or features.', 'Similarity search: compares vectors using distance measures such as cosine similarity, dot product, or Euclidean distance.', 'Nearest neighbor search: finds the most similar vectors quickly, often using approximate indexes for speed.', 'AI integration: results are sent to an AI model as context, improving answers with relevant private or current data.', 'Tools: Pinecone, Weaviate, Milvus, and ChromaDB are common choices for AI retrieval systems.'], 1.05, 4.1, 10.3, { color: C.white, size: 9.8, gap: 0.38 });
notes(s, ['Describe the pipeline slowly: raw data becomes embeddings; embeddings are stored; the query is embedded; the database finds nearest vectors; the application uses those results.', 'Mention that approximate nearest neighbor search is used because exact comparison across millions of vectors can be expensive.']);

// 12
s = slideBase(12, 'Applications of Vector Databases', 'Vector databases power many AI experiences that depend on semantic matching and fast retrieval.', false);
const vapps = [
  ['ChatGPT and AI assistants', 'Retrieve documents, notes, product data, or policies so the assistant can answer with relevant context.'],
  ['Recommendation systems', 'Find similar products, songs, movies, jobs, or courses using user preference embeddings.'],
  ['Image search', 'Search by visual similarity instead of filenames, captions, or manually written tags.'],
  ['Voice recognition', 'Match speech patterns, commands, or audio features in intelligent audio systems.'],
  ['NLP applications', 'Semantic search, clustering, duplicate detection, sentiment analysis, and question answering.'],
];
vapps.forEach((a, i) => card(s, a[0], a[1], 0.72 + (i % 2) * 5.9, 1.55 + Math.floor(i / 2) * 1.42, i === 4 ? 11.25 : 5.25, 1.05, [C.blue, C.green, C.violet, C.amber, C.cyan][i]));
s.addChart(pptx.ChartType.doughnut, [{ name: 'Use case mix', labels: ['AI assistants', 'Recommendations', 'Image search', 'NLP'], values: [35, 25, 20, 20] }], { x: 4.35, y: 5.75, w: 3.6, h: 1.05, holeSize: 58, showLegend: true, legendPos: 'r', chartColors: [C.blue, C.green, C.violet, C.amber], showValue: false });
notes(s, ['Use this slide to connect vector databases to systems students already know, like ChatGPT and recommendation engines.', 'Explain that the doughnut chart is an illustrative summary of common use-case categories, not a market share statistic.']);

// 13
s = slideBase(13, 'AI-Assisted Query Optimization', 'AI helps databases choose faster execution plans and reduce manual performance tuning.', true);
para(s, 'Query optimization is the process of deciding how a SQL query should be executed. A database may choose different join orders, indexes, scan methods, memory settings, and execution strategies. AI-assisted optimization improves these decisions using workload history and machine learning.', 0.9, 1.55, 10.5, 0.78, true, 11.4);
const q = [['Collect', 'query history + statistics'], ['Learn', 'patterns and cost behavior'], ['Plan', 'indexes, joins, execution path'], ['Improve', 'lower latency + faster throughput']];
q.forEach((it, i) => {
  const x = 1.0 + i * 2.6;
  s.addShape(pptx.ShapeType.roundRect, { x, y: 3.0, w: 1.9, h: 0.95, rectRadius: 0.08, fill: { color: [C.blue, C.violet, C.green, C.cyan][i], transparency: 6 }, line: { color: C.white, transparency: 65 } });
  s.addText(it[0], { x: x + 0.16, y: 3.2, w: 1.58, h: 0.16, fontSize: 11, bold: true, color: C.white, align: 'center', margin: 0 });
  s.addText(it[1], { x: x + 0.16, y: 3.55, w: 1.58, h: 0.14, fontSize: 7.3, color: 'DDF6FF', align: 'center', margin: 0, fit: 'shrink' });
  if (i < 3) s.addShape(pptx.ShapeType.chevron, { x: x + 1.98, y: 3.31, w: 0.3, h: 0.3, fill: { color: C.cyan }, line: { color: C.cyan } });
});
bullets(s, ['Smart indexing recommends or creates indexes for frequently used query patterns.', 'Execution planning estimates the fastest way to access and combine tables.', 'Machine learning can detect slow queries and recurring performance bottlenecks.', 'Adaptive optimization can adjust when real data distribution differs from old estimates.'], 1.05, 4.65, 10.4, { color: C.white, size: 9.8, gap: 0.36 });
notes(s, ['Explain that databases do not simply run SQL line by line. They create an execution plan, and the plan can greatly affect speed.', 'Mention examples: Microsoft Intelligent Query Processing, Oracle automatic indexing, and Google Spanner query optimizer statistics.']);

// 14
s = slideBase(14, 'Benefits of AI in Database Management', 'AI improves speed, latency, resource usage, prediction, and operational decisions.', false);
s.addChart(pptx.ChartType.line, [
  { name: 'Manual tuning', labels: ['Start', 'Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [80, 72, 68, 61, 58] },
  { name: 'AI-assisted tuning', labels: ['Start', 'Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [80, 55, 42, 35, 30] },
], { x: 0.75, y: 1.75, w: 5.2, h: 3.1, showLegend: true, legendPos: 'b', catAxisLabelFontSize: 8, valAxisLabelFontSize: 8, valGridLine: { color: 'E2E8F0', transparency: 30 }, chartColors: [C.slate, C.blue] });
const benefits = [
  ['Faster query processing', 'Better plans reduce unnecessary scans and inefficient joins.'],
  ['Reduced latency', 'Queries can return faster because resources and indexes are used intelligently.'],
  ['Better resource management', 'Compute, memory, and storage decisions can respond to workload pressure.'],
  ['Predictive maintenance', 'AI can identify abnormal patterns before they become incidents.'],
  ['Automated decisions', 'Systems can recommend or apply tuning actions with policy controls.'],
  ['Company examples', 'Google, Oracle, Microsoft, and Amazon AWS all provide database automation or intelligent performance features.'],
];
benefits.forEach((b, i) => card(s, b[0], b[1], 6.35 + (i % 2) * 2.9, 1.6 + Math.floor(i / 2) * 1.25, 2.55, 0.94, [C.blue, C.green, C.violet, C.amber, C.cyan, C.red][i]));
notes(s, ['Explain the graph as a conceptual performance-delay trend: AI-assisted tuning can reduce performance problems faster than manual trial-and-error.', 'Mention company examples: Google Spanner optimizer, Oracle automatic indexing and Autonomous Database, Microsoft Intelligent Query Processing, and AWS database services with vector and managed database capabilities.']);

// 15
s = slideBase(15, 'Future Trends and Career Opportunities', 'The future of databases creates strong demand for cloud, AI, automation, and security skills.', true);
card(s, 'Future technology trends', 'Cloud-native databases, serverless database platforms, autonomous operations, vector search, real-time analytics, distributed SQL, privacy-preserving data systems, and AI-driven administration will continue to grow.', 0.8, 1.55, 5.5, 1.55, C.blue, true);
card(s, 'Careers for students', 'Database engineer, cloud database administrator, data engineer, AI data engineer, database reliability engineer, security-focused data architect, and analytics platform specialist.', 6.75, 1.55, 5.25, 1.55, C.green, true);
bullets(s, ['Future demand will increase because every organization needs reliable data platforms for apps, analytics, and AI.', 'AI and cloud database careers require SQL, data modeling, Python basics, Linux/cloud knowledge, security awareness, and performance tuning.', 'Industry trend: database roles are shifting from manual maintenance to architecture, automation, governance, and AI-ready data design.', 'Students can build portfolio projects such as a vector-search chatbot, cloud database deployment, or SQL optimization case study.'], 0.95, 3.55, 10.5, { color: C.white, size: 10.1, gap: 0.42 });
notes(s, ['Connect the presentation to career planning.', 'Tell students that fundamentals still matter: SQL, normalization, transactions, indexing, and data modeling remain valuable even as AI and cloud tools grow.']);

// 16
s = slideBase(16, 'Comparison of All Technologies', 'A detailed comparison helps decide which future database technology fits each problem.', false);
const compH = ['Technology', 'Speed', 'Security', 'Scalability', 'Automation', 'AI Support', 'Cost'];
const comp = [
  ['Autonomous DB', 'High after tuning', 'Strong managed security', 'Elastic cloud scale', 'Very high', 'Medium to high', 'Medium/high'],
  ['Blockchain DB', 'Lower due to consensus', 'Very strong auditability', 'Network dependent', 'Medium', 'Low/medium', 'High for complex networks'],
  ['Vector DB', 'Fast similarity search', 'Depends on platform', 'High with indexing', 'Medium', 'Very high', 'Varies by scale'],
  ['AI Query Opt.', 'Improves SQL speed', 'Indirect security benefit', 'Works across engines', 'High tuning automation', 'High', 'Often built into platforms'],
];
s.addShape(pptx.ShapeType.roundRect, { x: 0.4, y: 1.45, w: 12.55, h: 5.15, rectRadius: 0.06, fill: { color: C.white }, line: { color: C.line } });
compH.forEach((h, i) => s.addText(h, { x: 0.62 + i * 1.76, y: 1.78, w: i ? 1.48 : 1.55, h: 0.18, fontSize: 7.8, bold: true, color: C.blue, margin: 0, align: i ? 'center' : 'left', fit: 'shrink' }));
comp.forEach((r, ri) => {
  const y = 2.35 + ri * 0.9;
  s.addShape(pptx.ShapeType.line, { x: 0.58, y: y - 0.18, w: 11.9, h: 0, line: { color: 'E2E8F0', width: 0.7 } });
  r.forEach((cell, ci) => s.addText(cell, { x: 0.62 + ci * 1.76, y, w: ci ? 1.5 : 1.55, h: 0.38, fontSize: ci ? 7.2 : 8.3, bold: ci === 0, color: ci === 0 ? C.ink : C.slate, margin: 0.01, align: ci ? 'center' : 'left', fit: 'shrink', breakLine: false }));
});
para(s, 'Summary: autonomous databases focus on operations, blockchain focuses on trust, vector databases focus on AI search, and AI optimization focuses on SQL performance.', 0.55, 6.82, 11.8, 0.25, false, 9.8);
notes(s, ['Use this as the main comparison slide.', 'Explain that no single technology is best for everything. The best choice depends on the problem: operations, trust, AI retrieval, or performance optimization.']);

// 17
s = slideBase(17, 'Conclusion', 'Future database systems are intelligent, automated, secure, scalable, and deeply connected with AI.', true);
bullets(s, ['Database systems have evolved from simple structured storage into platforms that support global applications, big data, cloud computing, and AI.', 'Autonomous databases reduce manual administration by automating tuning, backups, patching, scaling, security, and recovery.', 'Blockchain databases provide decentralized trust, immutable history, and strong auditability for multi-party workflows.', 'Vector databases enable AI systems to search by meaning, power recommendation engines, support image search, and improve ChatGPT-style assistants.', 'AI-assisted query optimization improves database performance through smarter indexing, execution planning, workload learning, and predictive maintenance.', 'Future-ready database systems are important because industries need faster decisions, stronger security, reliable scalability, and intelligent data access.'], 0.95, 1.65, 9.6, { color: C.white, size: 10.3, gap: 0.58 });
s.addText('Final message: the database of the future is not only a storage system; it is an intelligent data platform for business, science, and AI.', { x: 0.95, y: 6.05, w: 10.4, h: 0.4, fontSize: 15, bold: true, color: C.cyan, margin: 0, fit: 'shrink' });
notes(s, ['Read the bullet points as the final summary.', 'Close by saying that computer science students should understand these trends because future software, analytics, and AI systems will depend on advanced database platforms.', 'Invite questions from the audience.']);

// 18
s = slideBase(18, 'References', 'Official and authentic sources used for definitions, examples, and technology descriptions.', false);
const refs = [
  'Oracle Autonomous Database documentation and Oracle Autonomous Database FAQ: self-managing, self-securing, self-repairing, automated patching, tuning, and scaling.',
  'IBM Think Blockchain: shared, immutable digital ledger; decentralized distributed database; consensus and tamper resistance.',
  'Microsoft Learn: Intelligent Query Processing in SQL databases and Azure SQL / SQL Server performance features.',
  'Google Cloud Spanner: query optimizer overview, cost-based optimization, statistics packages, and optimizer versions.',
  'AWS Database and Vector Database documentation: vector embeddings, vector search, RAG, and generative AI database choices.',
  'Pinecone Docs, Weaviate Docs, and Milvus Docs: vector search, semantic search, similarity search, and nearest-neighbor retrieval.',
  'Database journals and research themes: distributed databases, cloud-native data platforms, AI-assisted indexing, query optimization, and data security.',
];
bullets(s, refs, 0.85, 1.45, 11.2, { size: 9.7, gap: 0.64, h: 0.44 });
para(s, 'Source links are also written in the speaker notes for easy checking.', 0.9, 6.52, 7.5, 0.24, false, 10.2);
notes(s, [
  'Oracle Autonomous Database FAQ: https://www.oracle.com/database/technologies/datawarehouse-bigdata/adb-faqs.html',
  'Oracle Autonomous Database: https://www.oracle.com/autonomous-database/',
  'IBM Blockchain overview: https://www.ibm.com/think/topics/blockchain',
  'Microsoft Intelligent Query Processing: https://learn.microsoft.com/en-us/sql/relational-databases/performance/intelligent-query-processing?view=sql-server-ver17',
  'Google Spanner query optimizer overview: https://cloud.google.com/spanner/docs/query-optimizer/overview',
  'AWS vector databases for generative AI: https://docs.aws.amazon.com/vector-databases/',
  'AWS What is a Vector Database: https://aws.amazon.com/what-is/vector-databases/',
  'Pinecone Docs: https://docs.pinecone.io/',
  'Weaviate Vector Search: https://weaviate.io/developers/weaviate/concepts/search/vector-search',
  'Milvus Documentation: https://milvus.io/docs/id/single-vector-search.md',
]);

await fs.mkdir(OUT_DIR, { recursive: true });
await pptx.writeFile({ fileName: OUT });

const buf = await fs.readFile(OUT);
const zip = await JSZip.loadAsync(buf);
const slideNames = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
for (const name of slideNames) {
  let xml = await zip.file(name).async('string');
  if (!xml.includes('<p:transition')) {
    xml = xml.replace('<p:cSld', '<p:transition spd="med"><p:fade/></p:transition><p:cSld');
    zip.file(name, xml);
  }
}
await fs.writeFile(OUT, await zip.generateAsync({ type: 'nodebuffer' }));
console.log(OUT);
