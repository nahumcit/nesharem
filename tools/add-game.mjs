import {
  bool,
  compact,
  downloadImage,
  fail,
  fetchJson,
  num,
  parseArgs,
  printItem,
  readData,
  slugify,
  titleFromArgs,
  writeData,
} from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const title = titleFromArgs(args);

if (!title) {
  fail('Uso: npm run add:game -- "Nombre del juego" [--status playing] [--platform PC] [--hours 40]');
}

const search = await fetchJson(
  `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`
);

const results = search?.items ?? [];
const hit =
  results.find((item) => item.name.toLowerCase() === title.toLowerCase()) ?? results[0];

if (!hit?.id) {
  fail(`No se encontró "${title}" en la tienda de Steam.`);
}

const appId = hit.id;
const details = await fetchJson(
  `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=US`
);

const data = details?.[String(appId)]?.data;
const chosenTitle = data?.name || hit.name || title;
const list = await readData('games');

if (list.some((item) => item.title.toLowerCase() === chosenTitle.toLowerCase())) {
  fail(`"${chosenTitle}" ya está en src/data/games.json.`);
}

const releaseDate = data?.release_date?.date ?? '';
const releaseYear = Number(releaseDate.match(/\b(19|20)\d{2}\b/)?.[0]) || undefined;
const year = num(args.year) ?? releaseYear;
const slug = slugify(chosenTitle);

const platformNames = { windows: 'PC', mac: 'macOS', linux: 'Linux' };
const platforms = Object.entries(data?.platforms ?? {})
  .filter(([, enabled]) => enabled)
  .map(([key]) => platformNames[key])
  .filter(Boolean);

let cover;

if (args.cover) {
  cover = await downloadImage(args.cover, `covers/games/${slug}`).catch((error) => {
    console.warn(`No se pudo descargar la portada: ${error.message}`);
    return undefined;
  });
} else {
  for (const url of [
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
  ]) {
    cover = await downloadImage(url, `covers/games/${slug}`).catch(() => undefined);
    if (cover) break;
  }
}

const item = compact({
  title: chosenTitle,
  cover,
  status: args.status ?? 'planned',
  score: num(args.score),
  year,
  platform: args.platform ?? platforms.join(', ') ?? undefined,
  hours: num(args.hours),
  favorite: bool(args.favorite) || undefined,
  steamAppId: appId,
  url: `https://store.steampowered.com/app/${appId}/`,
  notes: args.notes ?? '',
});

list.push(item);
const file = await writeData('games', list);
printItem(item, file);
