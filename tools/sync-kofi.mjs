import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  bool,
  downloadImage,
  imageExtension,
  parseArgs,
  readData,
  root,
  today,
  writeData,
} from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const profileUrl = args.url || 'https://ko-fi.com/nahumcm';

async function loadHtml() {
  const response = await fetch(profileUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'en-US,en;q=0.9',
      'user-agent': UA,
    },
  }).catch(() => null);

  if (response?.ok) {
    return response.text();
  }

  const curl = process.platform === 'win32' ? 'curl.exe' : 'curl';

  try {
    return execFileSync(curl, ['-fsSL', '-A', UA, profileUrl], {
      encoding: 'utf8',
      maxBuffer: 25 * 1024 * 1024,
    });
  } catch (error) {
    console.error('Ko-fi bloqueó la petición (challenge de Cloudflare).');
    console.error('Abre https://ko-fi.com/nahumcm/gallery, descarga las imágenes y edita src/data/kofi.json.');
    process.exit(1);
  }
}

const html = await loadHtml();
const start = html.indexOf('kfds-c-gallery-widget');

if (start < 0) {
  console.error('No se encontró el widget de galería. Ko-fi cambió el HTML o bloqueó la petición.');
  process.exit(1);
}

const end = html.indexOf('id="topSupportersContainerDiv"', start);
const chunk = html.slice(start, end > start ? end : start + 15000);
const tags = [...chunk.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);

function attribute(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`));
  return match?.[1];
}

const found = tags
  .map((tag) => ({ src: attribute(tag, 'src'), alt: attribute(tag, 'alt') ?? '' }))
  .filter(({ src }) => src && src.includes('/useruploads/') && !src.includes('/cdn/empty_post'));

if (found.length === 0) {
  console.error('No se encontraron imágenes en el widget de galería.');
  process.exit(1);
}

const existing = await readData('kofi');
const items = [];
await mkdir(path.join(root, 'public', 'kofi'), { recursive: true });

for (const [index, image] of found.entries()) {
  const previous = existing[index];
  const alt = image.alt && !/click to view/i.test(image.alt) ? image.alt : '';
  const title =
    previous?.title && (!alt || alt.toLowerCase() === previous.title.toLowerCase())
      ? previous.title
      : alt || previous?.title || `Trabajo ${index + 1}`;
  const ext = imageExtension(image.src);
  const destBase = `kofi/${String(index + 1).padStart(2, '0')}`;

  if (bool(args.dry)) {
    console.log(`${title} -> ${image.src}`);
    continue;
  }

  const local = await downloadImage(image.src, destBase).catch((error) => {
    console.warn(`No se pudo descargar ${image.src}: ${error.message}`);
    return `/kofi/${String(index + 1).padStart(2, '0')}.${ext}`;
  });

  items.push({
    image: local,
    title,
    url: `${profileUrl.replace(/\/$/, '')}/gallery`,
    date: previous?.date || today(),
  });
}

if (bool(args.dry)) {
  process.exit(0);
}

const file = await writeData('kofi', items);
console.log(`\n${items.length} trabajo(s) sincronizado(s) en ${path.relative(root, file)}.`);

if (items.length < 6) {
  console.log('Ko-fi solo muestra 4 trabajos en el perfil. Agrega los que faltan a src/data/kofi.json');
  console.log('con su imagen en public/kofi/ (por ejemplo 05.png y 06.png).');
}
