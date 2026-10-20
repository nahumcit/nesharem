# nesharem

Sitio personal de Nahum: dibujo, fútbol, filosofía, teología, economía, anime, juegos, libros y blog. Hecho con Astro, pensado para editarse desde el navegador con Pages CMS y publicarse gratis en Cloudflare Pages.

## Stack

- Astro 7 (sitio estático, sin base de datos).
- Cuatro idiomas: español, inglés, japonés y chino (`/es/`, `/en/`, `/ja/`, `/zh/`).
- Blog en Markdown con temas, etiquetas, archivo por año/mes y autor.
- Listas de anime, juegos y libros en JSON.
- Galería con lightbox.
- Últimos trabajos de Ko-fi.
- Contador de visitas con Abacus, proxeado por una Pages Function.

## Desarrollo

Requiere Node 22.22 o superior (probado con Node 24).

```bash
npm install
npm run dev
```

Abre `http://localhost:4321`. La raíz redirige al idioma detectado.

Para compilar y revisar el resultado:

```bash
npm run check
npm run build
npm run preview
```

La salida queda en `dist/`.

## Añadir contenido

### Anime, juegos y libros

Los comandos buscan el título en AniList, Steam u Open Library, descargan la portada y agregan la entrada al JSON.

```bash
npm run add:anime -- "Cowboy Bebop" --status completed --score 9 --favorite
npm run add:game -- "Hades" --status playing --platform PC --hours 30
npm run add:book -- "Dune" --author "Frank Herbert" --status reading --score 9
```

Opciones útiles:

- `--title "..."`: título explícito si el posicional es ambiguo.
- `--cover "https://..."`: portada manual; también se descarga.
- `--year 1998`, `--episodes 26`, `--format TV`.
- `--notes "texto"`.
- `--favorite` para marcar favorito.
- `--status`: `watching`, `completed`, `planned`, `dropped` (anime); `playing`, `played`, `planned`, `paused`, `dropped` (juegos); `reading`, `read`, `planned`, `onhold`, `dropped` (libros).
- `--score`: número del 0 al 10.

Si la API no encuentra el título o no hay portada, agrega la entrada a mano en `src/data/anime.json`, `games.json` o `books.json` y guarda la imagen en `public/covers/anime`, `public/covers/games` o `public/covers/books`.

Las tres entradas actuales (Frieren, ELDEN RING, The Name of the Rose) son ejemplos: puedes borrarlas.

### Blog

Crea un `.md` en `src/content/posts/` o usa Pages CMS. Frontmatter:

```yaml
---
title: "Título"
slug: "mi-post"
date: 2026-10-20
author: Nahum
lang: es
translationKey: mi-post
topics: [personal]
tags: [diario]
excerpt: "Resumen corto para las tarjetas y el RSS."
draft: false
---
```

El cuerpo va debajo del frontmatter en Markdown. `updated` es opcional. Usa el mismo `translationKey` en las versiones de otros idiomas para que el selector de idioma enlace entre ellas.

### Galería

Sube las imágenes desde Pages CMS (quedan en `public/uploads` y se sirven como `/uploads/archivo.png`) y agrega la entrada en `src/data/gallery.json`:

```json
{
  "image": "/uploads/dibujo.png",
  "title": "Título",
  "date": "2026-10-20",
  "medium": "Tinta",
  "tags": ["sketch"]
}
```

### Ko-fi

```bash
npm run sync:kofi
npm run sync:kofi -- --dry
```

El script lee el widget de galería del perfil, descarga las imágenes en `public/kofi/` y reescribe `src/data/kofi.json`. Ko-fi solo muestra 4 trabajos en el perfil: para llegar a 6, sube `05.png` y `06.png` a `public/kofi/` y agrega sus entradas al JSON. También puedes editar títulos y fechas desde Pages CMS.

Ko-fi bloquea peticiones directas de Node con Cloudflare; el script cae a `curl` como respaldo. Si aun así falla, descarga las imágenes manualmente.

### Textos y perfil

- `src/data/profile.json`: nombre, edad, ubicación, avatar, bio, gustos, hobbies y links.
- `src/data/site.json`: título, URL, avatar, Ko-fi, descripción por idioma.
- `src/i18n/ui.ts`: textos de la interfaz en los cuatro idiomas.

## Publicar gratis

1. Crea un repositorio público en GitHub llamado `nesharem`.
2. En esta carpeta:

```bash
git init
git add .
git commit -m "Sitio inicial"
git branch -M main
git remote add origin https://github.com/nahumcit/nesharem.git
git push -u origin main
```

3. En Cloudflare, entra a **Workers & Pages → Create → Pages → Connect to Git**, elige el repo y configura:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Variable de entorno: `NODE_VERSION=22.22.0` (si el build usa una versión anterior)
4. El sitio quedará en `https://nesharem.pages.dev` (o el nombre de proyecto que elijas). Si cambia, actualiza `site` en `astro.config.mjs` y `url` en `src/data/site.json`.
5. La carpeta `functions/` se despliega automáticamente como Pages Function: no requiere configuración extra. El contador aparecerá como `—` en `npm run dev` porque las Functions solo corren en Cloudflare.

### Editar desde el navegador

1. Entra a [app.pagescms.org](https://app.pagescms.org) e inicia sesión con GitHub.
2. Instala la app de Pages CMS en el repositorio.
3. Selecciona el repo y la rama `main`. Pages CMS lee `.pages.yml` y muestra Blog, Anime, Juegos, Libros, Galería, Ko-fi, Perfil y Ajustes.
4. Cada cambio crea un commit; Cloudflare reconstruye el sitio solo.

## Estructura

```text
src/
  components/      Header, Footer, tarjetas, listas, galería
  content/posts/   Posts Markdown
  data/            anime, games, books, gallery, kofi, profile, site
  i18n/ui.ts       Traducciones de la interfaz
  layouts/Base.astro
  lib/             Helpers de fechas, slugs, posts
  pages/[lang]/    Páginas por idioma
  scripts/site.js  Tema, filtros, contador
  styles/global.css
public/
  covers/          Portadas descargadas
  kofi/            Trabajos de Ko-fi
  uploads/         Imágenes subidas desde Pages CMS
  fonts/           Pixelify Sans
functions/api/     Proxy del contador de visitas
tools/             Scripts para agregar contenido
```

## Notas

- No hay comentarios ni guestbook: requieren backend o un servicio externo.
- El tema claro/oscuro se guarda en `localStorage`.
- Los filtros de las listas funcionan sin JavaScript extra, con el script del sitio.
- Límites de Cloudflare Pages gratis: 500 builds al mes, 20.000 archivos y 25 MiB por archivo.
