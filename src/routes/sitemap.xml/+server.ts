import type { RequestHandler } from './$types';

export const prerender = true;

const SITE_URL = 'https://backlogbox.com';

const staticPages = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/login', priority: '0.3', changefreq: 'monthly' },
	{ path: '/register', priority: '0.5', changefreq: 'monthly' },
	{ path: '/blog', priority: '0.8', changefreq: 'weekly' },
	{ path: '/blog/how-to-organize-your-media-backlog', priority: '0.7', changefreq: 'monthly' },
	{
		path: '/blog/best-goodreads-letterboxd-alternatives-all-in-one-media-tracker',
		priority: '0.7',
		changefreq: 'monthly'
	},
	{
		path: '/blog/game-backlog-management-guide',
		priority: '0.7',
		changefreq: 'monthly'
	}
] as const;

export const GET: RequestHandler = () => {
	const now = new Date().toISOString().split('T')[0];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
	.map(
		(page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
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
