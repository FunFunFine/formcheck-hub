
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, feedbackTable } from '../db/schema';
import { getAllPosts } from '../handlers/get_all_posts';

describe('getAllPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no posts exist', async () => {
    const result = await getAllPosts();
    expect(result).toEqual([]);
  });

  it('should return posts without feedback', async () => {
    // Create test athlete
    const athlete = await db.insert(usersTable)
      .values({
        username: 'testathlete',
        email: 'athlete@test.com',
        passwordHash: 'hashedpassword',
        role: 'athlete',
        coins: 0
      })
      .returning()
      .execute();

    // Create test post
    const post = await db.insert(postsTable)
      .values({
        athleteId: athlete[0].id,
        videoUrl: 'https://example.com/video.mp4',
        description: 'Test post description'
      })
      .returning()
      .execute();

    const result = await getAllPosts();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(post[0].id);
    expect(result[0].athleteId).toEqual(athlete[0].id);
    expect(result[0].videoUrl).toEqual('https://example.com/video.mp4');
    expect(result[0].description).toEqual('Test post description');
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].feedback).toEqual([]);
  });

  it('should return posts with feedback', async () => {
    // Create test users
    const athlete = await db.insert(usersTable)
      .values({
        username: 'testathlete',
        email: 'athlete@test.com',
        passwordHash: 'hashedpassword',
        role: 'athlete',
        coins: 50
      })
      .returning()
      .execute();

    const coach = await db.insert(usersTable)
      .values({
        username: 'testcoach',
        email: 'coach@test.com',
        passwordHash: 'hashedpassword',
        role: 'coach',
        coins: 0
      })
      .returning()
      .execute();

    // Create test post
    const post = await db.insert(postsTable)
      .values({
        athleteId: athlete[0].id,
        videoUrl: 'https://example.com/video.mp4',
        description: 'Test post with feedback'
      })
      .returning()
      .execute();

    // Create test feedback
    const feedback = await db.insert(feedbackTable)
      .values({
        postId: post[0].id,
        coachId: coach[0].id,
        comment: 'Great technique!',
        priceCoins: 10,
        status: 'pending'
      })
      .returning()
      .execute();

    const result = await getAllPosts();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(post[0].id);
    expect(result[0].feedback).toHaveLength(1);
    expect(result[0].feedback[0].id).toEqual(feedback[0].id);
    expect(result[0].feedback[0].postId).toEqual(post[0].id);
    expect(result[0].feedback[0].coachId).toEqual(coach[0].id);
    expect(result[0].feedback[0].comment).toEqual('Great technique!');
    expect(result[0].feedback[0].priceCoins).toEqual(10);
    expect(result[0].feedback[0].status).toEqual('pending');
    expect(result[0].feedback[0].createdAt).toBeInstanceOf(Date);
  });

  it('should return multiple posts with multiple feedback each', async () => {
    // Create test users
    const athlete = await db.insert(usersTable)
      .values({
        username: 'testathlete',
        email: 'athlete@test.com',
        passwordHash: 'hashedpassword',
        role: 'athlete',
        coins: 100
      })
      .returning()
      .execute();

    const coach1 = await db.insert(usersTable)
      .values({
        username: 'coach1',
        email: 'coach1@test.com',
        passwordHash: 'hashedpassword',
        role: 'coach',
        coins: 0
      })
      .returning()
      .execute();

    const coach2 = await db.insert(usersTable)
      .values({
        username: 'coach2',
        email: 'coach2@test.com',
        passwordHash: 'hashedpassword',
        role: 'coach',
        coins: 0
      })
      .returning()
      .execute();

    // Create test posts
    const post1 = await db.insert(postsTable)
      .values({
        athleteId: athlete[0].id,
        videoUrl: 'https://example.com/video1.mp4',
        description: 'First test post'
      })
      .returning()
      .execute();

    const post2 = await db.insert(postsTable)
      .values({
        athleteId: athlete[0].id,
        videoUrl: 'https://example.com/video2.mp4',
        description: 'Second test post'
      })
      .returning()
      .execute();

    // Create feedback for first post
    await db.insert(feedbackTable)
      .values([
        {
          postId: post1[0].id,
          coachId: coach1[0].id,
          comment: 'Good form!',
          priceCoins: 5,
          status: 'accepted'
        },
        {
          postId: post1[0].id,
          coachId: coach2[0].id,
          comment: 'Try adjusting your stance',
          priceCoins: 8,
          status: 'pending'
        }
      ])
      .execute();

    // Create feedback for second post
    await db.insert(feedbackTable)
      .values({
        postId: post2[0].id,
        coachId: coach1[0].id,
        comment: 'Excellent improvement!',
        priceCoins: 15,
        status: 'rejected'
      })
      .execute();

    const result = await getAllPosts();

    expect(result).toHaveLength(2);

    // Find posts by description since order might vary
    const firstPost = result.find(p => p.description === 'First test post');
    const secondPost = result.find(p => p.description === 'Second test post');

    expect(firstPost).toBeDefined();
    expect(firstPost!.feedback).toHaveLength(2);
    expect(firstPost!.feedback.some(f => f.comment === 'Good form!')).toBe(true);
    expect(firstPost!.feedback.some(f => f.comment === 'Try adjusting your stance')).toBe(true);

    expect(secondPost).toBeDefined();
    expect(secondPost!.feedback).toHaveLength(1);
    expect(secondPost!.feedback[0].comment).toEqual('Excellent improvement!');
    expect(secondPost!.feedback[0].status).toEqual('rejected');
  });
});
