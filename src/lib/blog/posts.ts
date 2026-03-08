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

/** Ordered newest-first so iteration without sorting produces correct display order. */
export const posts: readonly BlogPost[] = [
	{
		slug: 'best-letterboxd-alternative',
		title: 'Best Letterboxd Alternatives in 2026: Movie & TV Trackers Compared',
		description:
			'Love Letterboxd but need more? Compare the best Letterboxd alternatives for tracking movies, TV shows, and all your other media in one place.',
		publishedAt: '2026-03-06',
		updatedAt: '2026-03-06',
		author: 'BacklogBox Team',
		readingTime: '9 min read',
		keywords: [
			'letterboxd alternative',
			'letterboxd alternative 2026',
			'movie tracker app',
			'film tracking app',
			'movie watchlist app',
			'letterboxd replacement',
			'tv show tracker',
			'letterboxd alternative for tv shows',
			'letterboxd alternative for books'
		]
	},
	{
		slug: 'tbr-pile-management-guide',
		title: 'TBR Pile Out of Control? A Practical Guide to Managing Your To-Be-Read List',
		description:
			'Your TBR pile keeps growing and the guilt is real. Practical strategies to organize your to-be-read list and pick your next book faster.',
		publishedAt: '2026-03-03',
		updatedAt: '2026-03-03',
		author: 'BacklogBox Team',
		readingTime: '8 min read',
		keywords: [
			'TBR pile',
			'to be read pile',
			'reading backlog',
			'TBR list management',
			'book backlog',
			'too many books to read',
			'reading tracker',
			'goodreads alternative 2026'
		]
	},
	{
		slug: 'personal-kanban-for-entertainment',
		title: 'Personal Kanban for Entertainment: Organize What You Watch, Read & Play',
		description:
			'Apply the Kanban method to your entertainment backlog. Organize movies, books, games, and TV shows with visual boards that reduce decision fatigue.',
		publishedAt: '2026-02-27',
		updatedAt: '2026-02-27',
		author: 'BacklogBox Team',
		readingTime: '9 min read',
		keywords: [
			'personal kanban',
			'kanban entertainment',
			'kanban media tracking',
			'kanban board personal',
			'visual task board entertainment',
			'media organization method',
			'all in one media tracker'
		]
	},
	{
		slug: 'best-media-tracker-apps',
		title: 'Best Media Tracker Apps in 2026: Track Books, Movies, Games & More',
		description:
			'Compare the best media tracker apps for books, movies, TV shows, games, and podcasts — from single-media apps to all-in-one solutions.',
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
			'backlog tracker',
			'all in one media tracker',
			'trakt alternative',
			'backloggd alternative'
		]
	},
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
			'kanban board personal',
			'what to watch next',
			'all in one media tracker'
		]
	},
	{
		slug: 'best-goodreads-letterboxd-alternatives-all-in-one-media-tracker',
		title: 'Best Goodreads & Letterboxd Alternative: Why You Need an All-in-One Media Tracker',
		description:
			'Tired of juggling Goodreads, Letterboxd, Backloggd, and Trakt? Compare single-media trackers vs. all-in-one solutions for your backlog.',
		publishedAt: '2026-02-14',
		updatedAt: '2026-02-14',
		author: 'BacklogBox Team',
		readingTime: '7 min read',
		keywords: [
			'goodreads alternative',
			'goodreads alternative 2026',
			'letterboxd alternative',
			'backloggd alternative',
			'trakt alternative',
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
		publishedAt: '2026-02-10',
		updatedAt: '2026-02-10',
		author: 'BacklogBox Team',
		readingTime: '9 min read',
		keywords: [
			'game backlog',
			'pile of shame',
			'game backlog management',
			'game backlog tracker app',
			'game tracker',
			'backlog tracker',
			'kanban game backlog',
			'backloggd alternative'
		]
	}
] as const;

export function getPost(slug: string): BlogPost | undefined {
	return posts.find((p) => p.slug === slug);
}
