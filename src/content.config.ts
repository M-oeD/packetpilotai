import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		draft: z.boolean().optional(),
		heroAscii: z.string().optional(),
		// Editorial backbone — see src/data/streams.ts for stream definitions.
		// Both optional so legacy untagged posts continue to validate.
		stream: z.string().optional(),
		streamNum: z.number().int().positive().optional(),
	}),
});

export const collections = { blog };
