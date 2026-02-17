import { relations } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid
} from 'drizzle-orm/pg-core';

import { user } from './auth.schema';

// --- Enums ---

export const mediaTypeEnum = pgEnum('media_type', ['book', 'movie', 'series', 'game', 'podcast']);

export const mediaStatusEnum = pgEnum('media_status', [
	'wishlist',
	'backlog',
	'in_progress',
	'on_hold',
	'completed',
	'abandoned'
]);

// --- Shared media item table ---

export const mediaItem = pgTable(
	'media_item',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		type: mediaTypeEnum('type').notNull(),
		title: text('title').notNull(),
		coverUrl: text('cover_url'),
		releaseYear: integer('release_year'),
		status: mediaStatusEnum('status').notNull().default('backlog'),
		sortOrder: integer('sort_order').notNull().default(0),
		rating: integer('rating'),
		notes: text('notes'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		completedAt: timestamp('completed_at'),
		pinned: boolean('pinned').notNull().default(false)
	},
	(table) => [
		index('media_item_user_type_status_idx').on(table.userId, table.type, table.status),
		index('media_item_user_type_status_sort_idx').on(
			table.userId,
			table.type,
			table.status,
			table.sortOrder
		)
	]
);

// --- Type-specific metadata tables ---

export const bookMeta = pgTable('book_meta', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItem.id, { onDelete: 'cascade' }),
	author: text('author'),
	genre: text('genre'),
	description: text('description'),
	pageCount: integer('page_count'),
	isbn: text('isbn'),
	language: text('language'),
	publisher: text('publisher')
});

export const movieMeta = pgTable('movie_meta', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItem.id, { onDelete: 'cascade' }),
	director: text('director'),
	genre: text('genre'),
	description: text('description'),
	cast: text('cast'),
	runtime: integer('runtime'),
	tmdbId: integer('tmdb_id')
});

export const seriesMeta = pgTable('series_meta', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItem.id, { onDelete: 'cascade' }),
	genre: text('genre'),
	description: text('description'),
	creator: text('creator'),
	cast: text('cast'),
	network: text('network'),
	seriesStatus: text('series_status'),
	watchingOn: text('watching_on'),
	totalSeasons: integer('total_seasons'),
	currentSeason: integer('current_season'),
	tmdbId: integer('tmdb_id')
});

export const gameMeta = pgTable('game_meta', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItem.id, { onDelete: 'cascade' }),
	platform: text('platform'),
	genre: text('genre'),
	description: text('description'),
	developer: text('developer'),
	publisher: text('publisher'),
	playingOn: text('playing_on'),
	criticScore: integer('critic_score'),
	userScore: integer('user_score'),
	playtimeMinutes: integer('playtime_minutes'),
	igdbId: integer('igdb_id')
});

export const podcastMeta = pgTable('podcast_meta', {
	mediaItemId: uuid('media_item_id')
		.primaryKey()
		.references(() => mediaItem.id, { onDelete: 'cascade' }),
	host: text('host'),
	genre: text('genre'),
	description: text('description'),
	publisher: text('publisher'),
	listeningOn: text('listening_on'),
	frequency: text('frequency'),
	episodeLength: integer('episode_length'),
	totalEpisodes: integer('total_episodes'),
	currentEpisode: integer('current_episode'),
	applePodcastId: text('apple_podcast_id')
});

// --- Notes ---

export const mediaNote = pgTable(
	'media_note',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		mediaItemId: uuid('media_item_id')
			.notNull()
			.references(() => mediaItem.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [index('media_note_item_idx').on(table.mediaItemId)]
);

// --- Relations ---

export const mediaItemRelations = relations(mediaItem, ({ one, many }) => ({
	user: one(user, { fields: [mediaItem.userId], references: [user.id] }),
	bookMeta: one(bookMeta),
	movieMeta: one(movieMeta),
	seriesMeta: one(seriesMeta),
	gameMeta: one(gameMeta),
	podcastMeta: one(podcastMeta),
	notes: many(mediaNote)
}));

export const bookMetaRelations = relations(bookMeta, ({ one }) => ({
	mediaItem: one(mediaItem, { fields: [bookMeta.mediaItemId], references: [mediaItem.id] })
}));

export const movieMetaRelations = relations(movieMeta, ({ one }) => ({
	mediaItem: one(mediaItem, { fields: [movieMeta.mediaItemId], references: [mediaItem.id] })
}));

export const seriesMetaRelations = relations(seriesMeta, ({ one }) => ({
	mediaItem: one(mediaItem, { fields: [seriesMeta.mediaItemId], references: [mediaItem.id] })
}));

export const gameMetaRelations = relations(gameMeta, ({ one }) => ({
	mediaItem: one(mediaItem, { fields: [gameMeta.mediaItemId], references: [mediaItem.id] })
}));

export const podcastMetaRelations = relations(podcastMeta, ({ one }) => ({
	mediaItem: one(mediaItem, { fields: [podcastMeta.mediaItemId], references: [mediaItem.id] })
}));

export const mediaNoteRelations = relations(mediaNote, ({ one }) => ({
	mediaItem: one(mediaItem, { fields: [mediaNote.mediaItemId], references: [mediaItem.id] })
}));

// ---------------------------------------------------------------------------
// Custom lists
// ---------------------------------------------------------------------------

export const customListStatusEnum = pgEnum('custom_list_status', [
	'wishlist',
	'planned',
	'doing',
	'completed',
	'abandoned'
]);

export const customFieldTypeEnum = pgEnum('custom_field_type', ['text', 'number', 'url', 'date']);

export const customList = pgTable(
	'custom_list',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		icon: text('icon'),
		isPublic: boolean('is_public').notNull().default(false),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		unique('custom_list_user_slug_uniq').on(table.userId, table.slug),
		index('custom_list_user_idx').on(table.userId)
	]
);

export const customListField = pgTable(
	'custom_list_field',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		listId: uuid('list_id')
			.notNull()
			.references(() => customList.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		fieldType: customFieldTypeEnum('field_type').notNull().default('text'),
		sortOrder: integer('sort_order').notNull().default(0)
	},
	(table) => [index('custom_list_field_list_idx').on(table.listId)]
);

export const customListItem = pgTable(
	'custom_list_item',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		listId: uuid('list_id')
			.notNull()
			.references(() => customList.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		subtitle: text('subtitle'),
		imageUrl: text('image_url'),
		rating: integer('rating'),
		notes: text('notes'),
		status: customListStatusEnum('status').notNull().default('planned'),
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		completedAt: timestamp('completed_at')
	},
	(table) => [
		index('custom_list_item_list_status_sort_idx').on(table.listId, table.status, table.sortOrder)
	]
);

export const customListItemFieldValue = pgTable(
	'custom_list_item_field_value',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		itemId: uuid('item_id')
			.notNull()
			.references(() => customListItem.id, { onDelete: 'cascade' }),
		fieldId: uuid('field_id')
			.notNull()
			.references(() => customListField.id, { onDelete: 'cascade' }),
		value: text('value').notNull()
	},
	(table) => [index('custom_list_item_field_value_item_idx').on(table.itemId)]
);

// --- Custom list relations ---

export const customListRelations = relations(customList, ({ one, many }) => ({
	user: one(user, { fields: [customList.userId], references: [user.id] }),
	fields: many(customListField),
	items: many(customListItem)
}));

export const customListFieldRelations = relations(customListField, ({ one, many }) => ({
	list: one(customList, { fields: [customListField.listId], references: [customList.id] }),
	values: many(customListItemFieldValue)
}));

export const customListItemRelations = relations(customListItem, ({ one, many }) => ({
	list: one(customList, { fields: [customListItem.listId], references: [customList.id] }),
	fieldValues: many(customListItemFieldValue)
}));

export const customListItemFieldValueRelations = relations(customListItemFieldValue, ({ one }) => ({
	item: one(customListItem, {
		fields: [customListItemFieldValue.itemId],
		references: [customListItem.id]
	}),
	field: one(customListField, {
		fields: [customListItemFieldValue.fieldId],
		references: [customListField.id]
	})
}));

// Re-export auth schema
export * from './auth.schema';
