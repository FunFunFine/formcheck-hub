
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, feedbackTable } from '../db/schema';
import { type AcceptFeedbackInput } from '../schema';
import { acceptFeedback } from '../handlers/accept_feedback';
import { eq } from 'drizzle-orm';

describe('acceptFeedback', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should accept feedback and transfer coins', async () => {
    // Create athlete with coins
    const athleteResult = await db.insert(usersTable)
      .values({
        username: 'athlete1',
        email: 'athlete@test.com',
        passwordHash: 'hash123',
        role: 'athlete',
        coins: 100
      })
      .returning()
      .execute();
    const athlete = athleteResult[0];

    // Create coach
    const coachResult = await db.insert(usersTable)
      .values({
        username: 'coach1',
        email: 'coach@test.com',
        passwordHash: 'hash123',
        role: 'coach',
        coins: 50
      })
      .returning()
      .execute();
    const coach = coachResult[0];

    // Create post
    const postResult = await db.insert(postsTable)
      .values({
        athleteId: athlete.id,
        videoUrl: 'https://example.com/video.mp4',
        description: 'Test post'
      })
      .returning()
      .execute();
    const post = postResult[0];

    // Create pending feedback
    const feedbackResult = await db.insert(feedbackTable)
      .values({
        postId: post.id,
        coachId: coach.id,
        comment: 'Great technique!',
        priceCoins: 30,
        status: 'pending'
      })
      .returning()
      .execute();
    const feedback = feedbackResult[0];

    const input: AcceptFeedbackInput = {
      feedbackId: feedback.id,
      athleteId: athlete.id
    };

    const result = await acceptFeedback(input);

    // Check feedback status updated
    expect(result.status).toEqual('accepted');
    expect(result.id).toEqual(feedback.id);

    // Verify feedback in database
    const updatedFeedback = await db.select()
      .from(feedbackTable)
      .where(eq(feedbackTable.id, feedback.id))
      .execute();
    expect(updatedFeedback[0].status).toEqual('accepted');

    // Verify coin transfer
    const updatedAthlete = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, athlete.id))
      .execute();
    expect(updatedAthlete[0].coins).toEqual(70); // 100 - 30

    const updatedCoach = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, coach.id))
      .execute();
    expect(updatedCoach[0].coins).toEqual(80); // 50 + 30
  });

  it('should throw error when athlete has insufficient coins', async () => {
    // Create athlete with insufficient coins
    const athleteResult = await db.insert(usersTable)
      .values({
        username: 'athlete1',
        email: 'athlete@test.com',
        passwordHash: 'hash123',
        role: 'athlete',
        coins: 10 // Less than feedback price
      })
      .returning()
      .execute();
    const athlete = athleteResult[0];

    // Create coach
    const coachResult = await db.insert(usersTable)
      .values({
        username: 'coach1',
        email: 'coach@test.com',
        passwordHash: 'hash123',
        role: 'coach',
        coins: 0
      })
      .returning()
      .execute();
    const coach = coachResult[0];

    // Create post
    const postResult = await db.insert(postsTable)
      .values({
        athleteId: athlete.id,
        videoUrl: 'https://example.com/video.mp4',
        description: 'Test post'
      })
      .returning()
      .execute();
    const post = postResult[0];

    // Create pending feedback with high price
    const feedbackResult = await db.insert(feedbackTable)
      .values({
        postId: post.id,
        coachId: coach.id,
        comment: 'Great technique!',
        priceCoins: 50, // More than athlete has
        status: 'pending'
      })
      .returning()
      .execute();
    const feedback = feedbackResult[0];

    const input: AcceptFeedbackInput = {
      feedbackId: feedback.id,
      athleteId: athlete.id
    };

    await expect(acceptFeedback(input)).rejects.toThrow(/insufficient coins/i);
  });

  it('should throw error when feedback is not pending', async () => {
    // Create athlete and coach
    const athleteResult = await db.insert(usersTable)
      .values({
        username: 'athlete1',
        email: 'athlete@test.com',
        passwordHash: 'hash123',
        role: 'athlete',
        coins: 100
      })
      .returning()
      .execute();
    const athlete = athleteResult[0];

    const coachResult = await db.insert(usersTable)
      .values({
        username: 'coach1',
        email: 'coach@test.com',
        passwordHash: 'hash123',
        role: 'coach',
        coins: 0
      })
      .returning()
      .execute();
    const coach = coachResult[0];

    // Create post
    const postResult = await db.insert(postsTable)
      .values({
        athleteId: athlete.id,
        videoUrl: 'https://example.com/video.mp4',
        description: 'Test post'
      })
      .returning()
      .execute();
    const post = postResult[0];

    // Create already accepted feedback
    const feedbackResult = await db.insert(feedbackTable)
      .values({
        postId: post.id,
        coachId: coach.id,
        comment: 'Great technique!',
        priceCoins: 30,
        status: 'accepted' // Already accepted
      })
      .returning()
      .execute();
    const feedback = feedbackResult[0];

    const input: AcceptFeedbackInput = {
      feedbackId: feedback.id,
      athleteId: athlete.id
    };

    await expect(acceptFeedback(input)).rejects.toThrow(/not pending/i);
  });

  it('should throw error when feedback not found', async () => {
    const input: AcceptFeedbackInput = {
      feedbackId: 999, // Non-existent feedback
      athleteId: 1
    };

    await expect(acceptFeedback(input)).rejects.toThrow(/feedback not found/i);
  });

  it('should throw error when athlete not found', async () => {
    // Create coach
    const coachResult = await db.insert(usersTable)
      .values({
        username: 'coach1',
        email: 'coach@test.com',
        passwordHash: 'hash123',
        role: 'coach',
        coins: 0
      })
      .returning()
      .execute();
    const coach = coachResult[0];

    // Create athlete for post creation
    const athleteResult = await db.insert(usersTable)
      .values({
        username: 'athlete1',
        email: 'athlete@test.com',
        passwordHash: 'hash123',
        role: 'athlete',
        coins: 100
      })
      .returning()
      .execute();
    const athlete = athleteResult[0];

    // Create post
    const postResult = await db.insert(postsTable)
      .values({
        athleteId: athlete.id,
        videoUrl: 'https://example.com/video.mp4',
        description: 'Test post'
      })
      .returning()
      .execute();
    const post = postResult[0];

    // Create feedback
    const feedbackResult = await db.insert(feedbackTable)
      .values({
        postId: post.id,
        coachId: coach.id,
        comment: 'Great technique!',
        priceCoins: 30,
        status: 'pending'
      })
      .returning()
      .execute();
    const feedback = feedbackResult[0];

    const input: AcceptFeedbackInput = {
      feedbackId: feedback.id,
      athleteId: 999 // Non-existent athlete
    };

    await expect(acceptFeedback(input)).rejects.toThrow(/athlete not found/i);
  });
});
