import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
	const HIDDEN = new Set(['first-post', 'second-post', 'third-post', 'markdown-style-guide', 'using-mdx']);
	const posts = (await getCollection('blog')).filter(({ id }) => !HIDDEN.has(id));
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.id}/`,
		})),
	});
}
