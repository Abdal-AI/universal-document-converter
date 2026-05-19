import pptxgen from 'pptxgenjs';
import JSZip from 'jszip';
import fs from 'node:fs/promises';
import path from 'node:path';

const previewDir = 'D:/old laptop/4TH SEMESTER/DATA BASE THEORY/presentaion/previews';
const out = 'D:/old laptop/4TH SEMESTER/DATA BASE THEORY/presentaion/Future Trends in Database Systems - Group 2 image deck.pptx';

const pptx = new pptxgen();
pptx.defineLayout({ name: 'IMAGE_WIDE', width: 13.333, height: 7.5 });
pptx.layout = 'IMAGE_WIDE';
pptx.author = 'Group 2';
pptx.company = 'University Seminar';
pptx.subject = 'Future Trends in Database Systems';
pptx.title = 'Future Trends in Database Systems - Group 2';
pptx.lang = 'en-US';

const files = (await fs.readdir(previewDir))
  .filter((name) => /^slide-\d+\.png$/i.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (!files.length) {
  throw new Error(`No slide PNG files found in ${previewDir}`);
}

for (const file of files) {
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  slide.addImage({
    path: path.join(previewDir, file),
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
  });
}

await pptx.writeFile({ fileName: out });

const zip = await JSZip.loadAsync(await fs.readFile(out));
const slideNames = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
for (const name of slideNames) {
  let xml = await zip.file(name).async('string');
  if (!xml.includes('<p:transition')) {
    xml = xml.replace('<p:cSld', '<p:transition spd="med"><p:fade/></p:transition><p:cSld');
    zip.file(name, xml);
  }
}
await fs.writeFile(out, await zip.generateAsync({ type: 'nodebuffer' }));

console.log(JSON.stringify({ out, slides: files.length }, null, 2));
