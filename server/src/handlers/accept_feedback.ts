
import { db } from '../db';
import { usersTable, feedbackTable } from '../db/schema';
import { type AcceptFeedbackInput, type Feedback } from '../schema';
import { eq } from 'drizzle-orm';

export async function acceptFeedback(input: AcceptFeedbackInput): Promise<Feedback> {
  try {
    // Start a transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // First, get the feedback details to check if it exists and is pending
      const feedbackResult = await tx.select()
        .from(feedbackTable)
        .where(eq(feedbackTable.id, input.feedbackId))
        .execute();

      if (feedbackResult.length === 0) {
        throw new Error('Feedback not found');
      }

      const feedback = feedbackResult[0];

      if (feedback.status !== 'pending') {
        throw new Error('Feedback is not pending');
      }

      // Get the athlete to verify they own the post and have sufficient coins
      const athleteResult = await tx.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.athleteId))
        .execute();

      if (athleteResult.length === 0) {
        throw new Error('Athlete not found');
      }

      const athlete = athleteResult[0];

      // Check if athlete has sufficient coins
      if (athlete.coins < feedback.priceCoins) {
        throw new Error('Insufficient coins');
      }

      // Get the coach's current coins
      const coachResult = await tx.select()
        .from(usersTable)
        .where(eq(usersTable.id, feedback.coachId))
        .execute();

      if (coachResult.length === 0) {
        throw new Error('Coach not found');
      }

      const coach = coachResult[0];

      // Update feedback status to 'accepted'
      const updatedFeedbackResult = await tx.update(feedbackTable)
        .set({ status: 'accepted' })
        .where(eq(feedbackTable.id, input.feedbackId))
        .returning()
        .execute();

      // Deduct coins from athlete
      await tx.update(usersTable)
        .set({ coins: athlete.coins - feedback.priceCoins })
        .where(eq(usersTable.id, input.athleteId))
        .execute();

      // Add coins to coach
      await tx.update(usersTable)
        .set({ coins: coach.coins + feedback.priceCoins })
        .where(eq(usersTable.id, feedback.coachId))
        .execute();

      return updatedFeedbackResult[0];
    });

    return result;
  } catch (error) {
    console.error('Accept feedback failed:', error);
    throw error;
  }
}
