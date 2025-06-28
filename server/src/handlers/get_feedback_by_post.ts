
import { db } from '../db';
import { feedbackTable, usersTable } from '../db/schema';
import { type GetFeedbackByPostInput, type FeedbackWithUserInfo } from '../schema';
import { eq } from 'drizzle-orm';

export async function getFeedbackByPost(input: GetFeedbackByPostInput): Promise<FeedbackWithUserInfo[]> {
  try {
    // Join feedback with users to get coach information
    const results = await db.select()
      .from(feedbackTable)
      .innerJoin(usersTable, eq(feedbackTable.coachId, usersTable.id))
      .where(eq(feedbackTable.postId, input.postId))
      .execute();

    // Transform the joined results to match FeedbackWithUserInfo schema
    return results.map(result => ({
      id: result.feedback.id,
      postId: result.feedback.postId,
      coachId: result.feedback.coachId,
      comment: result.feedback.comment,
      priceCoins: result.feedback.priceCoins,
      status: result.feedback.status,
      createdAt: result.feedback.createdAt,
      coach: {
        username: result.users.username,
        email: result.users.email
      }
    }));
  } catch (error) {
    console.error('Get feedback by post failed:', error);
    throw error;
  }
}
