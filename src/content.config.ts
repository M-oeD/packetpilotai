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
		// Social share image (Open Graph / Twitter). Must be 1200x630 to match
		// the declared card dimensions.
		image: z.string().optional(),
		// Optional FAQ entries rendered as a visible section on the post and
		// marked up as FAQPage JSON-LD. Answers must reflect the article body.
		faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
		// Editorial backbone — see src/data/streams.ts for stream definitions.
		// Both optional so legacy untagged posts continue to validate.
		stream: z.string().optional(),
		streamNum: z.number().int().positive().optional(),
	}),
});

export const collections = { blog };
