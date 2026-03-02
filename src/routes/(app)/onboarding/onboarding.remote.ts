import * as v from 'valibot';
import { query, command } from '$app/server';
import { requireUserId, requirePaid } from '$lib/server/auth-guard';
import { getOrFetch, discoverKey } from '$lib/server/search/cache';
import { fetchTrendingMovies, fetchTrendingSeries } from '$lib/server/search/tmdb';
import { fetchTrendingGames } from '$lib/server/search/igdb';
import { fetchTrendingBooks } from '$lib/server/search/openlibrary';
import { fetchTopPodcasts } from '$lib/server/search/apple-podcasts';
import { completeOnboarding, resetOnboarding, createMediaItem } from '$lib/server/db/queries';
import { log } from '$lib/server/logger';
import {
	MEDIA_TYPES,
	MEDIA_TYPE_SLUGS,
	slugToMediaType,
	mediaTypeToSlug,
	type MediaType,
	type MetaFieldsFor
} from '$lib/types';
import type { SearchResult } from '$lib/server/search';

// ---------------------------------------------------------------------------
// Trending fetchers (reuse from discover)
// ---------------------------------------------------------------------------

const trendingFetchers: Record<MediaType, () => Promise<SearchResult[]>> = {
	movie: fetchTrendingMovies,
	series: fetchTrendingSeries,
	game: fetchTrendingGames,
	book: fetchTrendingBooks,
	podcast: fetchTopPodcasts
};

const PROVIDERS: Record<MediaType, string> = {
	movie: 'tmdb',
	series: 'tmdb',
	game: 'igdb',
	book: 'openlibrary',
	podcast: 'apple'
};

// ---------------------------------------------------------------------------
// Fetch trending for onboarding (no user-filtering, limited to 12)
// ---------------------------------------------------------------------------

const interestsSchema = v.array(v.picklist([...MEDIA_TYPES]));

/** Fetch trending items for selected media types. Returns up to 12 per type. */
export const getOnboardingTrending = query(
	interestsSchema,
	async (interests): Promise<Record<string, SearchResult[]>> => {
		requireUserId();
		const result: Record<string, SearchResult[]> = {};

		await Promise.all(
			interests.map(async (type) => {
				const fetcher = trendingFetchers[type];
				const key = discoverKey('trending', type);
				const provider = PROVIDERS[type];
				try {
					const { results } = await getOrFetch(key, 'trending', provider, fetcher);
					result[type] = results.slice(0, 12);
				} catch (err) {
					log.error({ err, mediaType: type }, 'onboarding trending fetch failed');
					result[type] = [];
				}
			})
		);

		return result;
	}
);

// ---------------------------------------------------------------------------
// Complete onboarding (save interests + batch-add selected items)
// ---------------------------------------------------------------------------

const onboardingItemSchema = v.object({
	slug: v.picklist([...MEDIA_TYPE_SLUGS]),
	title: v.pipe(v.string(), v.nonEmpty()),
	coverUrl: v.optional(v.nullable(v.string())),
	releaseYear: v.optional(v.nullable(v.number())),
	meta: v.record(v.string(), v.unknown())
});

const completeOnboardingSchema = v.object({
	interests: v.array(v.picklist([...MEDIA_TYPES])),
	items: v.array(onboardingItemSchema)
});

/** Complete onboarding: persist interests, batch-create selected items */
export const finishOnboarding = command(completeOnboardingSchema, async (data) => {
	const userId = requireUserId();

	// Insert items sequentially to avoid transaction conflicts
	let addedCount = 0;
	for (const item of data.items) {
		const type = slugToMediaType(item.slug);
		if (!type) continue;

		try {
			await createMediaItem(
				{
					userId,
					type,
					title: item.title,
					coverUrl: item.coverUrl ?? null,
					releaseYear: item.releaseYear ?? null,
					status: 'backlog',
					sortOrder: addedCount
				},
				(item.meta ?? {}) as MetaFieldsFor<MediaType>,
				type
			);
			addedCount++;
		} catch (err) {
			// Log but don't fail the whole onboarding for a single item
			log.warn({ err, title: item.title, type }, 'onboarding item add failed');
		}
	}

	await completeOnboarding(userId, data.interests);
	log.info({ userId, interests: data.interests, itemCount: addedCount }, 'onboarding completed');

	return { addedCount };
});

// ---------------------------------------------------------------------------
// Skip onboarding
// ---------------------------------------------------------------------------

/** Skip onboarding entirely — marks as completed with no interests */
export const skipOnboarding = command(async () => {
	const userId = requireUserId();
	await completeOnboarding(userId, []);
	log.info({ userId }, 'onboarding skipped');
});

// ---------------------------------------------------------------------------
// Reset onboarding (from settings)
// ---------------------------------------------------------------------------

/** Reset onboarding so the user can redo it. Paid-only to prevent free-tier gaming. */
export const restartOnboarding = command(async () => {
	const userId = requirePaid();
	await resetOnboarding(userId);
	log.info({ userId }, 'onboarding reset');
});
