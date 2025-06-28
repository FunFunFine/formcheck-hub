
import { db } from '../db';
import { postsTable, feedbackTable, usersTable } from '../db/schema';
import { type GetPostsByAthleteInput, type PostWithFeedback } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPostsByAthlete(input: GetPostsByAthleteInput): Promise<PostWithFeedback[]> {
  try {
    // First, get all posts by the athlete
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.athleteId, input.athleteId))
      .execute();

    // For each post, get its feedback
    const postsWithFeedback: PostWithFeedback[] = [];

    for (const post of posts) {
      const feedback = await db.select()
        .from(feedbackTable)
        .where(eq(feedbackTable.postId, post.id))
        .execute();

      postsWithFeedback.push({
        id: post.id,
        athleteId: post.athleteId,
        videoUrl: post.videoUrl,
        description: post.description,
        createdAt: post.createdAt,
        feedback: feedback
      });
    }

    return postsWithFeedback;
  } catch (error) {
    console.error('Failed to get posts by athlete:', error);
    throw error;
  }
}
