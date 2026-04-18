import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({
		base: './src/content/blog',
		pattern: [
			'**/*.{md,mdx}',
			'!first-post.md',
			'!second-post.md',
			'!third-post.md',
			'!markdown-style-guide.md',
			'!using-mdx.mdx',
		],
	}),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			draft: z.boolean().optional(),
		}),
});

export const collections = { blog };
