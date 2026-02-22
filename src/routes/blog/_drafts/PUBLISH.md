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
