import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import site from '../../data/site.json';
import { languages } from '../../i18n/ui';
import { sortPosts } from '../../lib/posts';

export function getStaticPaths() {
  return languages.map((lang) => ({ params: { lang } }));
}

export async function GET(context) {
  const lang = context.params.lang;
  const posts = sortPosts(
    await getCollection('posts', ({ data }) => !data.draft && data.lang === lang)
  );

  return rss({
    title: `nesharem · ${lang.toUpperCase()}`,
    description: site.description[lang],
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      link: `/${lang}/blog/${post.data.slug}/`,
      categories: [...post.data.topics, ...post.data.tags],
    })),
    customData: `<language>${lang}</language>`,
  });
}
