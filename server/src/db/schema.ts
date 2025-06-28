
import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['athlete', 'coach']);
export const feedbackStatusEnum = pgEnum('feedback_status', ['pending', 'accepted', 'rejected']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  coins: integer('coins').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Posts table
export const postsTable = pgTable('posts', {
  id: serial('id').primaryKey(),
  athleteId: integer('athlete_id').notNull().references(() => usersTable.id),
  videoUrl: text('video_url').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Feedback table
export const feedbackTable = pgTable('feedback', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => postsTable.id),
  coachId: integer('coach_id').notNull().references(() => usersTable.id),
  comment: text('comment').notNull(),
  priceCoins: integer('price_coins').notNull(),
  status: feedbackStatusEnum('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  posts: many(postsTable),
  feedback: many(feedbackTable),
}));

export const postsRelations = relations(postsTable, ({ one, many }) => ({
  athlete: one(usersTable, {
    fields: [postsTable.athleteId],
    references: [usersTable.id],
  }),
  feedback: many(feedbackTable),
}));

export const feedbackRelations = relations(feedbackTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [feedbackTable.postId],
    references: [postsTable.id],
  }),
  coach: one(usersTable, {
    fields: [feedbackTable.coachId],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Post = typeof postsTable.$inferSelect;
export type NewPost = typeof postsTable.$inferInsert;
export type Feedback = typeof feedbackTable.$inferSelect;
export type NewFeedback = typeof feedbackTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  users: usersTable, 
  posts: postsTable, 
  feedback: feedbackTable 
};
