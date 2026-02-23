export interface BlogPost {
	readonly slug: string;
	readonly title: string;
	readonly description: string;
	readonly publishedAt: string;
	readonly updatedAt: string;
	readonly author: string;
	readonly readingTime: string;
	readonly keywords: readonly string[];
	readonly ogImage?: string;
}

export const posts: readonly BlogPost[] = [
	{
		slug: 'how-to-organize-your-media-backlog',
		title: 'How to Organize Your Media Backlog: Books, Movies, Games & More',
		description:
			'Drowning in unwatched shows and unread books? Learn proven methods to organize your media backlog with Kanban boards, priority systems, and tracking tools.',
		publishedAt: '2026-02-17',
		updatedAt: '2026-02-17',
		author: 'BacklogBox Team',
		readingTime: '8 min read',
		keywords: [
			'media backlog',
			'organize media',
			'backlog management',
			'media tracker',
			'kanban board personal'
		]
	},
	{
		slug: 'best-goodreads-letterboxd-alternatives-all-in-one-media-tracker',
		title: 'Best Goodreads & Letterboxd Alternative: Why You Need an All-in-One Media Tracker',
		description:
			'Tired of juggling Goodreads, Letterboxd, Backloggd, and Trakt? Compare single-media trackers vs. all-in-one solutions and find a better way to organize your backlog.',
		publishedAt: '2026-02-17',
		updatedAt: '2026-02-17',
		author: 'BacklogBox Team',
		readingTime: '7 min read',
		keywords: [
			'goodreads alternative',
			'letterboxd alternative',
			'backloggd alternative',
			'all-in-one media tracker',
			'media tracker app',
			'book movie game tracker'
		]
	},
	{
		slug: 'game-backlog-management-guide',
		title: 'Game Backlog Management: A Complete Guide to Tackling Your Pile of Shame',
		description:
			'Struggling with an overwhelming game backlog? Learn the Kanban method, priority frameworks, and practical strategies to finally tackle your pile of shame.',
		publishedAt: '2026-02-17',
		updatedAt: '2026-02-17',
		author: 'BacklogBox Team',
		readingTime: '9 min read',
		keywords: [
			'game backlog',
			'pile of shame',
			'game backlog management',
			'game tracker',
			'backlog tracker',
			'kanban game backlog'
		]
	},
	{
		slug: 'best-media-tracker-apps',
		title: 'Best Media Tracker Apps in 2026: Track Books, Movies, Games & More',
		description:
			'Looking for the best media tracker app? We compare the top tools for tracking books, movies, TV shows, games, and podcasts — from single-media apps to all-in-one solutions.',
		publishedAt: '2026-02-23',
		updatedAt: '2026-02-23',
		author: 'BacklogBox Team',
		readingTime: '10 min read',
		keywords: [
			'media tracker app',
			'best media tracker',
			'entertainment tracker',
			'book tracker app',
			'movie tracker app',
			'game tracker app',
			'backlog tracker'
		]
	}
] as const;

export function getPost(slug: string): BlogPost | undefined {
	return posts.find((p) => p.slug === slug);
}
