import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import site from '../data/site.json';
import { sortPosts } from '../lib/posts';

export async function GET(context) {
  const posts = sortPosts(await getCollection('posts', ({ data }) => !data.draft));

  return rss({
    title: 'nesharem',
    description: site.description.es,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      link: `/${post.data.lang}/blog/${post.data.slug}/`,
      categories: [...post.data.topics, ...post.data.tags],
    })),
    customData: '<language>es</language>',
  });
}
