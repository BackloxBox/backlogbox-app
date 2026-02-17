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
			'Tired of juggling Goodreads, Letterboxd, Backloggd, and Trakt? Compare the best alternatives and discover why an all-in-one media tracker saves time.',
		publishedAt: '2026-02-17',
		updatedAt: '2026-02-17',
		author: 'BacklogBox Team',
		readingTime: '10 min read',
		keywords: [
			'goodreads alternative',
			'letterboxd alternative',
			'backloggd alternative',
			'media tracker app',
			'all-in-one media tracker'
		]
	},
	{
		slug: 'game-backlog-management-guide',
		title: 'Game Backlog Management: A Complete Guide to Tackling Your Pile of Shame',
		description:
			'Your Steam library has 300+ games and you keep buying more. Here is a practical guide to managing your game backlog with Kanban boards, priority frameworks, and tracking tools.',
		publishedAt: '2026-02-17',
		updatedAt: '2026-02-17',
		author: 'BacklogBox Team',
		readingTime: '9 min read',
		keywords: [
			'game backlog',
			'game backlog management',
			'pile of shame',
			'steam backlog',
			'game tracker'
		]
	}
] as const;

export function getPost(slug: string): BlogPost | undefined {
	return posts.find((p) => p.slug === slug);
}
