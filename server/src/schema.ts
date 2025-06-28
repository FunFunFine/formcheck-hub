
import { z } from 'zod';

// Enums
export const userRoleSchema = z.enum(['athlete', 'coach']);
export const feedbackStatusSchema = z.enum(['pending', 'accepted', 'rejected']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  role: userRoleSchema,
  coins: z.number().int(),
  createdAt: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Post schema
export const postSchema = z.object({
  id: z.number(),
  athleteId: z.number(),
  videoUrl: z.string().url(),
  description: z.string(),
  createdAt: z.coerce.date()
});

export type Post = z.infer<typeof postSchema>;

// Feedback schema
export const feedbackSchema = z.object({
  id: z.number(),
  postId: z.number(),
  coachId: z.number(),
  comment: z.string(),
  priceCoins: z.number().int().nonnegative(),
  status: feedbackStatusSchema,
  createdAt: z.coerce.date()
});

export type Feedback = z.infer<typeof feedbackSchema>;

// Input schemas for user operations
export const signupInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleSchema
});

export type SignupInput = z.infer<typeof signupInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Input schemas for post operations
export const createPostInputSchema = z.object({
  athleteId: z.number(),
  videoUrl: z.string().url(),
  description: z.string().min(1)
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;

export const getPostsByAthleteInputSchema = z.object({
  athleteId: z.number()
});

export type GetPostsByAthleteInput = z.infer<typeof getPostsByAthleteInputSchema>;

// Input schemas for feedback operations
export const createFeedbackInputSchema = z.object({
  postId: z.number(),
  coachId: z.number(),
  comment: z.string().min(1),
  priceCoins: z.number().int().nonnegative()
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackInputSchema>;

export const acceptFeedbackInputSchema = z.object({
  feedbackId: z.number(),
  athleteId: z.number()
});

export type AcceptFeedbackInput = z.infer<typeof acceptFeedbackInputSchema>;

export const getFeedbackByPostInputSchema = z.object({
  postId: z.number()
});

export type GetFeedbackByPostInput = z.infer<typeof getFeedbackByPostInputSchema>;

// Response schemas with relations
export const postWithFeedbackSchema = z.object({
  id: z.number(),
  athleteId: z.number(),
  videoUrl: z.string().url(),
  description: z.string(),
  createdAt: z.coerce.date(),
  feedback: z.array(feedbackSchema)
});

export type PostWithFeedback = z.infer<typeof postWithFeedbackSchema>;

export const feedbackWithUserInfoSchema = z.object({
  id: z.number(),
  postId: z.number(),
  coachId: z.number(),
  comment: z.string(),
  priceCoins: z.number().int(),
  status: feedbackStatusSchema,
  createdAt: z.coerce.date(),
  coach: z.object({
    username: z.string(),
    email: z.string()
  })
});

export type FeedbackWithUserInfo = z.infer<typeof feedbackWithUserInfoSchema>;
