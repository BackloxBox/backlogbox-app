import type { RequestHandler } from './$types';
import { posts } from '$lib/blog/posts';
import { getAllPublicUsernames } from '$lib/server/db/queries';

const SITE_URL = 'https://backlogbox.com';

interface SitemapEntry {
	readonly path: string;
	readonly lastmod: string;
	readonly priority: string;
	readonly changefreq: string;
}

export const GET: RequestHandler = async () => {
	const usernames = await getAllPublicUsernames();

	const today = new Date().toISOString().split('T')[0]!;

	const entries: SitemapEntry[] = [
		{ path: '/', lastmod: today, priority: '1.0', changefreq: 'weekly' },
		{ path: '/blog', lastmod: today, priority: '0.8', changefreq: 'weekly' },

		// Blog posts — auto-generated from posts.ts
		...posts.map((post) => ({
			path: `/blog/${post.slug}`,
			lastmod: post.updatedAt,
			priority: '0.7',
			changefreq: 'monthly' as const
		})),

		// Public user profiles
		...usernames.map((username) => ({
			path: `/@${username}`,
			lastmod: today,
			priority: '0.5',
			changefreq: 'weekly' as const
		}))
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
	.map(
		(entry) => `  <url>
    <loc>${SITE_URL}${entry.path}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
