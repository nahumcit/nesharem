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
  fail('Uso: npm run add:anime -- "Nombre del anime" [--status completed] [--score 9] [--favorite]');
}

const query = `
  query ($search: String) {
    Page(perPage: 5) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
        id
        siteUrl
        episodes
        format
        startDate { year }
        title { romaji english native }
        coverImage { extraLarge large }
      }
    }
  }
`;

const response = await fetchJson('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ query, variables: { search: title } }),
});

const media = response?.data?.Page?.media?.[0];

if (!media) {
  fail(`No se encontró "${title}" en AniList. Prueba con el título romaji o inglés.`);
}

const list = await readData('anime');
const chosenTitle = media.title.romaji || media.title.english || media.title.native || title;

if (list.some((item) => item.title.toLowerCase() === chosenTitle.toLowerCase())) {
  fail(`"${chosenTitle}" ya está en src/data/anime.json.`);
}

const slug = slugify(chosenTitle);
const coverUrl = args.cover || media.coverImage?.extraLarge || media.coverImage?.large;
const cover = coverUrl
  ? await downloadImage(coverUrl, `covers/anime/${slug}`).catch((error) => {
      console.warn(`No se pudo descargar la portada: ${error.message}`);
      return undefined;
    })
  : undefined;

const item = compact({
  title: chosenTitle,
  titleEn: media.title.english && media.title.english !== chosenTitle ? media.title.english : undefined,
  cover,
  status: args.status ?? 'planned',
  score: num(args.score),
  year: num(args.year) ?? media.startDate?.year ?? undefined,
  episodes: num(args.episodes) ?? media.episodes ?? undefined,
  format: args.format ?? media.format ?? undefined,
  favorite: bool(args.favorite) || undefined,
  url: media.siteUrl,
  notes: args.notes ?? '',
});

list.push(item);
const file = await writeData('anime', list);
printItem(item, file);
