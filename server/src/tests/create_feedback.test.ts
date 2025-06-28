
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { feedbackTable, usersTable, postsTable } from '../db/schema';
import { type CreateFeedbackInput } from '../schema';
import { createFeedback } from '../handlers/create_feedback';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateFeedbackInput = {
  postId: 1,
  coachId: 1,
  comment: 'Great technique! Consider adjusting your form.',
  priceCoins: 10
};

describe('createFeedback', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create feedback', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values([
      {
        username: 'athlete1',
        email: 'athlete@test.com',
        passwordHash: 'hash123',
        role: 'athlete'
      },
      {
        username: 'coach1',
        email: 'coach@test.com',
        passwordHash: 'hash456',
        role: 'coach'
      }
    ]);

    await db.insert(postsTable).values({
      athleteId: 1,
      videoUrl: 'https://example.com/video.mp4',
      description: 'My training video'
    });

    const result = await createFeedback(testInput);

    // Basic field validation
    expect(result.postId).toEqual(1);
    expect(result.coachId).toEqual(1);
    expect(result.comment).toEqual('Great technique! Consider adjusting your form.');
    expect(result.priceCoins).toEqual(10);
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should save feedback to database', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values([
      {
        username: 'athlete1',
        email: 'athlete@test.com',
        passwordHash: 'hash123',
        role: 'athlete'
      },
      {
        username: 'coach1',
        email: 'coach@test.com',
        passwordHash: 'hash456',
        role: 'coach'
      }
    ]);

    await db.insert(postsTable).values({
      athleteId: 1,
      videoUrl: 'https://example.com/video.mp4',
      description: 'My training video'
    });

    const result = await createFeedback(testInput);

    // Query using proper drizzle syntax
    const feedback = await db.select()
      .from(feedbackTable)
      .where(eq(feedbackTable.id, result.id))
      .execute();

    expect(feedback).toHaveLength(1);
    expect(feedback[0].postId).toEqual(1);
    expect(feedback[0].coachId).toEqual(1);
    expect(feedback[0].comment).toEqual('Great technique! Consider adjusting your form.');
    expect(feedback[0].priceCoins).toEqual(10);
    expect(feedback[0].status).toEqual('pending');
    expect(feedback[0].createdAt).toBeInstanceOf(Date);
  });

  it('should throw error for invalid foreign key constraints', async () => {
    // Don't create prerequisite data - should cause foreign key violation
    
    expect(createFeedback(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
