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
  fail('Uso: npm run add:book -- "Título del libro" [--status read] [--author "Autor"] [--score 9]');
}

const search = await fetchJson(
  `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=10&fields=title,author_name,first_publish_year,cover_i,key,isbn`
);

const results = search?.docs ?? [];
const hit = results.find((doc) => doc.cover_i) ?? results[0];

if (!hit) {
  fail(`No se encontró "${title}" en Open Library.`);
}

const chosenTitle = hit.title || title;
const list = await readData('books');

if (list.some((item) => item.title.toLowerCase() === chosenTitle.toLowerCase())) {
  fail(`"${chosenTitle}" ya está en src/data/books.json.`);
}

const author = args.author || hit.author_name?.[0];
const slug = slugify(chosenTitle);
const isbn = args.isbn || hit.isbn?.[0];
const coverUrl = args.cover || (hit.cover_i ? `https://covers.openlibrary.org/b/id/${hit.cover_i}-L.jpg` : null);
const cover = coverUrl
  ? await downloadImage(coverUrl, `covers/books/${slug}`).catch((error) => {
      console.warn(`No se pudo descargar la portada: ${error.message}`);
      return undefined;
    })
  : undefined;

const item = compact({
  title: chosenTitle,
  author,
  cover,
  status: args.status ?? 'planned',
  score: num(args.score),
  year: num(args.year) ?? hit.first_publish_year ?? undefined,
  isbn,
  favorite: bool(args.favorite) || undefined,
  url: hit.key ? `https://openlibrary.org${hit.key}` : undefined,
  notes: args.notes ?? '',
});

list.push(item);
const file = await writeData('books', list);
printItem(item, file);
