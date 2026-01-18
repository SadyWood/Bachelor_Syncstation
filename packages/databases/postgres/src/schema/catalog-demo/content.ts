import { pgTable, uuid, varchar, integer, text, timestamp, index } from 'drizzle-orm/pg-core';

export const content = pgTable(
  'content',
  {
    id: uuid('id').primaryKey(),
    mediaTitle: varchar('media_title', { length: 255 }).notNull(), // e.g., "Breaking Bad"
    episodeTitle: varchar('episode_title', { length: 255 }), // e.g., "Pilot"
    season: integer('season'),
    episode: integer('episode'),
    durationSeconds: integer('duration_seconds').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    mediaTitleIdx: index('idx_content_media_title').on(table.mediaTitle),
    seasonEpisodeIdx: index('idx_content_season_episode').on(table.season, table.episode),
  })
);
