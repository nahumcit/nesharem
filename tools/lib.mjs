import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const root = path.resolve(import.meta.dirname, '..');
const dataDir = path.join(root, 'src', 'data');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

export function parseArgs(argv) {
  const result = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith('--')) {
      result._.push(arg);
      continue;
    }

    const body = arg.slice(2);
    const equals = body.indexOf('=');

    if (equals >= 0) {
      result[body.slice(0, equals)] = body.slice(equals + 1);
      continue;
    }

    const next = argv[index + 1];
    if (next === undefined || next.startsWith('--')) {
      result[body] = true;
    } else {
      result[body] = next;
      index += 1;
    }
  }

  return result;
}

export function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function num(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function bool(value) {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

export function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export async function readData(name) {
  return JSON.parse(await readFile(path.join(dataDir, `${name}.json`), 'utf8'));
}

export async function writeData(name, data) {
  const file = path.join(dataDir, `${name}.json`);
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return file;
}

export async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      accept: 'application/json,text/plain,*/*',
      'accept-language': 'en-US,en;q=0.9,es;q=0.8',
      'user-agent': UA,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} en ${url}`);
  }

  return response.json();
}

export async function downloadImage(url, destBase) {
  const response = await fetch(url, {
    headers: { accept: 'image/*,*/*;q=0.8', 'user-agent': UA },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} descargando ${url}`);
  }

  const type = response.headers.get('content-type') ?? '';

  if (!type.startsWith('image/')) {
    throw new Error(`La URL no devolvió una imagen (${type || 'sin content-type'})`);
  }

  const ext = type.includes('png')
    ? 'png'
    : type.includes('webp')
      ? 'webp'
      : type.includes('gif')
        ? 'gif'
        : 'jpg';

  const target = path.join(root, 'public', `${destBase}.${ext}`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));

  return `/${destBase.replace(/\\/g, '/')}.${ext}`;
}

export function imageExtension(url, type = '') {
  const clean = url.split('?')[0].toLowerCase();
  if (type.includes('png') || clean.endsWith('.png')) return 'png';
  if (type.includes('webp') || clean.endsWith('.webp')) return 'webp';
  if (type.includes('gif') || clean.endsWith('.gif')) return 'gif';
  return 'jpg';
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function titleFromArgs(args) {
  return String(args.title || args._.join(' ')).trim();
}

export function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

export function printItem(item, file) {
  console.log(`\nGuardado en ${path.relative(root, file)}:`);
  console.log(JSON.stringify(item, null, 2));
}
