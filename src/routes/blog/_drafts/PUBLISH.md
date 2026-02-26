# Publishing drafts

For each post:

1. Move folder to live route: `mv src/routes/blog/_drafts/<slug> src/routes/blog/`
2. Add entry to `src/lib/blog/posts.ts` (see below)
3. Deploy

Sitemap + OG images auto-generate from `posts.ts`.

## Entries

### Feb 24 — best-media-tracker-apps

```ts
{
    slug: 'best-media-tracker-apps',
    title: 'Best Media Tracker Apps in 2026: Track Books, Movies, Games & More',
    description: 'Looking for the best media tracker app? We compare the top tools for tracking books, movies, TV shows, games, and podcasts — from single-media apps to all-in-one solutions.',
    publishedAt: '2026-02-24',
    updatedAt: '2026-02-24',
    author: 'BacklogBox Team',
    readingTime: '10 min read',
    keywords: ['media tracker app', 'best media tracker', 'entertainment tracker', 'book tracker app', 'movie tracker app', 'game tracker app', 'backlog tracker']
}
```

### Feb 27 — personal-kanban-for-entertainment

```ts
{
    slug: 'personal-kanban-for-entertainment',
    title: 'Personal Kanban for Entertainment: Organize What You Watch, Read & Play',
    description: 'Learn how to apply the Kanban method to your entertainment backlog. Organize movies, books, games, and TV shows with visual boards that actually reduce decision fatigue.',
    publishedAt: '2026-02-27',
    updatedAt: '2026-02-27',
    author: 'BacklogBox Team',
    readingTime: '9 min read',
    keywords: ['personal kanban', 'kanban entertainment', 'kanban media tracking', 'kanban board personal', 'visual task board entertainment', 'media organization method']
}
```

### Mar 3 — tbr-pile-management-guide

```ts
{
    slug: 'tbr-pile-management-guide',
    title: 'TBR Pile Out of Control? A Practical Guide to Managing Your To-Be-Read List',
    description: 'Your TBR pile keeps growing and the guilt is real. Learn practical strategies to organize your to-be-read list, pick your next book faster, and actually enjoy reading again.',
    publishedAt: '2026-03-03',
    updatedAt: '2026-03-03',
    author: 'BacklogBox Team',
    readingTime: '8 min read',
    keywords: ['TBR pile', 'to be read pile', 'reading backlog', 'TBR list management', 'book backlog', 'too many books to read', 'reading tracker']
}
```

### Mar 6 — best-letterboxd-alternative

```ts
{
    slug: 'best-letterboxd-alternative',
    title: 'Best Letterboxd Alternatives in 2026: Movie & TV Trackers Compared',
    description: 'Love Letterboxd but need more? Compare the best Letterboxd alternatives for tracking movies, TV shows, and all your other media in one place.',
    publishedAt: '2026-03-06',
    updatedAt: '2026-03-06',
    author: 'BacklogBox Team',
    readingTime: '9 min read',
    keywords: ['letterboxd alternative', 'movie tracker app', 'film tracking app', 'movie watchlist app', 'letterboxd replacement', 'tv show tracker']
}
```

### Mar 10 — best-backloggd-alternative

```ts
{
    slug: 'best-backloggd-alternative',
    title: 'Best Backloggd Alternatives in 2026: Game Trackers for Your Pile of Shame',
    description: 'Backloggd not cutting it? Compare the best Backloggd alternatives for tracking your game backlog, from dedicated game trackers to all-in-one media apps.',
    publishedAt: '2026-03-10',
    updatedAt: '2026-03-10',
    author: 'BacklogBox Team',
    readingTime: '9 min read',
    keywords: ['backloggd alternative', 'game tracker app', 'game backlog app', 'game tracking app', 'backloggd replacement', 'pile of shame tracker']
}
```

### Mar 13 — best-trakt-alternative

```ts
{
    slug: 'best-trakt-alternative',
    title: 'Best Trakt Alternatives in 2026: TV & Movie Trackers That Do More',
    description: 'Trakt is powerful but complex. Compare the best Trakt alternatives for tracking TV shows, movies, and your entire media backlog with less setup.',
    publishedAt: '2026-03-13',
    updatedAt: '2026-03-13',
    author: 'BacklogBox Team',
    readingTime: '9 min read',
    keywords: ['trakt alternative', 'tv show tracker', 'watch tracker app', 'trakt replacement', 'movie tracking app', 'tv tracker app']
}
```

### Mar 17 — what-to-watch-read-play-next

```ts
{
    slug: 'what-to-watch-read-play-next',
    title: 'What to Watch, Read, or Play Next: A Decision Framework for Your Media Backlog',
    description: 'Spending more time choosing than consuming? Use this decision framework to pick what to watch, read, or play next — and actually enjoy it instead of doom-scrolling.',
    publishedAt: '2026-03-17',
    updatedAt: '2026-03-17',
    author: 'BacklogBox Team',
    readingTime: '8 min read',
    keywords: ['what to watch next', 'what to read next', 'what to play next', 'decision fatigue entertainment', 'media backlog decision', 'choose what to watch']
}
```

### Mar 20 — import-from-goodreads-letterboxd-backloggd

```ts
{
    slug: 'import-from-goodreads-letterboxd-backloggd',
    title: 'How to Import Your Data from Goodreads, Letterboxd, and Backloggd',
    description: 'Ready to consolidate your media tracking? Learn how to export your data from Goodreads, Letterboxd, Backloggd, and Trakt — and import it into an all-in-one media tracker.',
    publishedAt: '2026-03-20',
    updatedAt: '2026-03-20',
    author: 'BacklogBox Team',
    readingTime: '7 min read',
    keywords: ['export goodreads data', 'import letterboxd', 'switch from goodreads', 'migrate from letterboxd', 'backloggd export', 'media tracker import']
}
```

### Mar 24 — tv-show-backlog-guide

```ts
{
    slug: 'tv-show-backlog-guide',
    title: 'TV Show Backlog: How to Finally Tackle Your Streaming Watchlist',
    description: 'Your streaming watchlist keeps growing and you never know what to watch. Learn practical strategies to organize your TV show backlog and stop doom-scrolling for good.',
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-24',
    author: 'BacklogBox Team',
    readingTime: '9 min read',
    keywords: ['tv show backlog', 'streaming watchlist', 'too many shows to watch', 'what to watch on netflix', 'tv show tracker', 'streaming backlog']
}
```
