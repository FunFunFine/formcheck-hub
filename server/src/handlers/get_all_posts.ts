
import { db } from '../db';
import { postsTable, feedbackTable, usersTable } from '../db/schema';
import { type PostWithFeedback } from '../schema';
import { eq } from 'drizzle-orm';

export async function getAllPosts(): Promise<PostWithFeedback[]> {
  try {
    // Get all posts with their feedback and coach information
    const postsWithFeedback = await db.select({
      // Post fields
      id: postsTable.id,
      athleteId: postsTable.athleteId,
      videoUrl: postsTable.videoUrl,
      description: postsTable.description,
      createdAt: postsTable.createdAt,
      // Feedback fields
      feedbackId: feedbackTable.id,
      feedbackPostId: feedbackTable.postId,
      feedbackCoachId: feedbackTable.coachId,
      feedbackComment: feedbackTable.comment,
      feedbackPriceCoins: feedbackTable.priceCoins,
      feedbackStatus: feedbackTable.status,
      feedbackCreatedAt: feedbackTable.createdAt,
    })
    .from(postsTable)
    .leftJoin(feedbackTable, eq(postsTable.id, feedbackTable.postId))
    .execute();

    // Group feedback by post ID
    const postsMap = new Map<number, PostWithFeedback>();

    for (const row of postsWithFeedback) {
      const postId = row.id;
      
      if (!postsMap.has(postId)) {
        postsMap.set(postId, {
          id: row.id,
          athleteId: row.athleteId,
          videoUrl: row.videoUrl,
          description: row.description,
          createdAt: row.createdAt,
          feedback: []
        });
      }

      // Add feedback if it exists
      if (row.feedbackId) {
        const post = postsMap.get(postId)!;
        post.feedback.push({
          id: row.feedbackId,
          postId: row.feedbackPostId!,
          coachId: row.feedbackCoachId!,
          comment: row.feedbackComment!,
          priceCoins: row.feedbackPriceCoins!,
          status: row.feedbackStatus!,
          createdAt: row.feedbackCreatedAt!
        });
      }
    }

    return Array.from(postsMap.values());
  } catch (error) {
    console.error('Failed to get all posts:', error);
    throw error;
  }
}
