import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: z.string().default('Nahum'),
    lang: z.enum(['es', 'en', 'ja', 'zh']),
    translationKey: z.string().optional(),
    topics: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    excerpt: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
