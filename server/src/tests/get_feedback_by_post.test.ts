
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, feedbackTable } from '../db/schema';
import { type GetFeedbackByPostInput } from '../schema';
import { getFeedbackByPost } from '../handlers/get_feedback_by_post';

// Test input
const testInput: GetFeedbackByPostInput = {
  postId: 1
};

describe('getFeedbackByPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no feedback exists for post', async () => {
    const result = await getFeedbackByPost(testInput);
    expect(result).toEqual([]);
  });

  it('should return feedback with coach information for a post', async () => {
    // Create test users
    const athletes = await db.insert(usersTable)
      .values([
        {
          username: 'athlete1',
          email: 'athlete1@test.com',
          passwordHash: 'hash1',
          role: 'athlete',
          coins: 100
        }
      ])
      .returning()
      .execute();

    const coaches = await db.insert(usersTable)
      .values([
        {
          username: 'coach1',
          email: 'coach1@test.com',
          passwordHash: 'hash2',
          role: 'coach',
          coins: 0
        }
      ])
      .returning()
      .execute();

    // Create test post
    const posts = await db.insert(postsTable)
      .values([
        {
          athleteId: athletes[0].id,
          videoUrl: 'https://example.com/video1.mp4',
          description: 'Test post'
        }
      ])
      .returning()
      .execute();

    // Create test feedback
    await db.insert(feedbackTable)
      .values([
        {
          postId: posts[0].id,
          coachId: coaches[0].id,
          comment: 'Great technique!',
          priceCoins: 10,
          status: 'pending'
        }
      ])
      .execute();

    const result = await getFeedbackByPost({ postId: posts[0].id });

    expect(result).toHaveLength(1);
    expect(result[0].comment).toBe('Great technique!');
    expect(result[0].priceCoins).toBe(10);
    expect(result[0].status).toBe('pending');
    expect(result[0].coach.username).toBe('coach1');
    expect(result[0].coach.email).toBe('coach1@test.com');
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });

  it('should return multiple feedback entries for a post', async () => {
    // Create test users
    const athletes = await db.insert(usersTable)
      .values([
        {
          username: 'athlete1',
          email: 'athlete1@test.com',
          passwordHash: 'hash1',
          role: 'athlete',
          coins: 100
        }
      ])
      .returning()
      .execute();

    const coaches = await db.insert(usersTable)
      .values([
        {
          username: 'coach1',
          email: 'coach1@test.com',
          passwordHash: 'hash2',
          role: 'coach',
          coins: 0
        },
        {
          username: 'coach2',
          email: 'coach2@test.com',
          passwordHash: 'hash3',
          role: 'coach',
          coins: 0
        }
      ])
      .returning()
      .execute();

    // Create test post
    const posts = await db.insert(postsTable)
      .values([
        {
          athleteId: athletes[0].id,
          videoUrl: 'https://example.com/video1.mp4',
          description: 'Test post'
        }
      ])
      .returning()
      .execute();

    // Create multiple feedback entries
    await db.insert(feedbackTable)
      .values([
        {
          postId: posts[0].id,
          coachId: coaches[0].id,
          comment: 'Great technique!',
          priceCoins: 10,
          status: 'pending'
        },
        {
          postId: posts[0].id,
          coachId: coaches[1].id,
          comment: 'Could improve timing',
          priceCoins: 15,
          status: 'accepted'
        }
      ])
      .execute();

    const result = await getFeedbackByPost({ postId: posts[0].id });

    expect(result).toHaveLength(2);
    
    // Check first feedback
    const feedback1 = result.find(f => f.coach.username === 'coach1');
    expect(feedback1).toBeDefined();
    expect(feedback1!.comment).toBe('Great technique!');
    expect(feedback1!.priceCoins).toBe(10);
    expect(feedback1!.status).toBe('pending');

    // Check second feedback
    const feedback2 = result.find(f => f.coach.username === 'coach2');
    expect(feedback2).toBeDefined();
    expect(feedback2!.comment).toBe('Could improve timing');
    expect(feedback2!.priceCoins).toBe(15);
    expect(feedback2!.status).toBe('accepted');
  });

  it('should only return feedback for the specified post', async () => {
    // Create test users
    const athletes = await db.insert(usersTable)
      .values([
        {
          username: 'athlete1',
          email: 'athlete1@test.com',
          passwordHash: 'hash1',
          role: 'athlete',
          coins: 100
        }
      ])
      .returning()
      .execute();

    const coaches = await db.insert(usersTable)
      .values([
        {
          username: 'coach1',
          email: 'coach1@test.com',
          passwordHash: 'hash2',
          role: 'coach',
          coins: 0
        }
      ])
      .returning()
      .execute();

    // Create multiple test posts
    const posts = await db.insert(postsTable)
      .values([
        {
          athleteId: athletes[0].id,
          videoUrl: 'https://example.com/video1.mp4',
          description: 'Test post 1'
        },
        {
          athleteId: athletes[0].id,
          videoUrl: 'https://example.com/video2.mp4',
          description: 'Test post 2'
        }
      ])
      .returning()
      .execute();

    // Create feedback for both posts
    await db.insert(feedbackTable)
      .values([
        {
          postId: posts[0].id,
          coachId: coaches[0].id,
          comment: 'Feedback for post 1',
          priceCoins: 10,
          status: 'pending'
        },
        {
          postId: posts[1].id,
          coachId: coaches[0].id,
          comment: 'Feedback for post 2',
          priceCoins: 15,
          status: 'accepted'
        }
      ])
      .execute();

    // Get feedback for first post only
    const result = await getFeedbackByPost({ postId: posts[0].id });

    expect(result).toHaveLength(1);
    expect(result[0].comment).toBe('Feedback for post 1');
    expect(result[0].postId).toBe(posts[0].id);
  });
});
