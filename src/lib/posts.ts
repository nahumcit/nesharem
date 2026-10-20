import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Post = CollectionEntry<'posts'>;

export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getPosts(lang: Lang, limit?: number): Promise<Post[]> {
  const posts = sortPosts(
    await getCollection('posts', ({ data }) => !data.draft && data.lang === lang)
  );
  return typeof limit === 'number' ? posts.slice(0, limit) : posts;
}

export function topicsOf(posts: Post[]): string[] {
  return [...new Set(posts.flatMap((post) => post.data.topics))].sort();
}

export function authorsOf(posts: Post[]): string[] {
  return [...new Set(posts.map((post) => post.data.author))].sort();
}

export function archiveOf(posts: Post[]): { year: number; months: number[] }[] {
  const map = new Map<number, Set<number>>();

  posts.forEach((post) => {
    const year = post.data.date.getUTCFullYear();
    const month = post.data.date.getUTCMonth() + 1;
    if (!map.has(year)) map.set(year, new Set());
    map.get(year)!.add(month);
  });

  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({ year, months: [...months].sort((a, b) => b - a) }));
}
