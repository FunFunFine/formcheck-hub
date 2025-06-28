
import { db } from '../db';
import { feedbackTable } from '../db/schema';
import { type CreateFeedbackInput, type Feedback } from '../schema';

export const createFeedback = async (input: CreateFeedbackInput): Promise<Feedback> => {
  try {
    // Insert feedback record
    const result = await db.insert(feedbackTable)
      .values({
        postId: input.postId,
        coachId: input.coachId,
        comment: input.comment,
        priceCoins: input.priceCoins
      })
      .returning()
      .execute();

    const feedback = result[0];
    return {
      id: feedback.id,
      postId: feedback.postId,
      coachId: feedback.coachId,
      comment: feedback.comment,
      priceCoins: feedback.priceCoins,
      status: feedback.status,
      createdAt: feedback.createdAt
    };
  } catch (error) {
    console.error('Feedback creation failed:', error);
    throw error;
  }
};
