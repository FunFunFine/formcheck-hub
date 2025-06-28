
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type CreatePostInput, type Post } from '../schema';

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  try {
    // Insert post record
    const result = await db.insert(postsTable)
      .values({
        athleteId: input.athleteId,
        videoUrl: input.videoUrl,
        description: input.description
      })
      .returning()
      .execute();

    const post = result[0];
    return {
      id: post.id,
      athleteId: post.athleteId,
      videoUrl: post.videoUrl,
      description: post.description,
      createdAt: post.createdAt
    };
  } catch (error) {
    console.error('Post creation failed:', error);
    throw error;
  }
};
