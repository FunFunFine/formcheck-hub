
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, feedbackTable } from '../db/schema';
import { type GetPostsByAthleteInput } from '../schema';
import { getPostsByAthlete } from '../handlers/get_posts_by_athlete';

describe('getPostsByAthlete', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return posts with empty feedback for athlete with no feedback', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'athlete1',
          email: 'athlete1@test.com',
          passwordHash: 'hash123',
          role: 'athlete',
          coins: 100
        }
      ])
      .returning()
      .execute();

    const athleteId = users[0].id;

    // Create test posts
    await db.insert(postsTable)
      .values([
        {
          athleteId: athleteId,
          videoUrl: 'https://example.com/video1.mp4',
          description: 'First post'
        },
        {
          athleteId: athleteId,
          videoUrl: 'https://example.com/video2.mp4',
          description: 'Second post'
        }
      ])
      .execute();

    const input: GetPostsByAthleteInput = { athleteId };
    const result = await getPostsByAthlete(input);

    expect(result).toHaveLength(2);
    expect(result[0].athleteId).toEqual(athleteId);
    expect(result[0].videoUrl).toEqual('https://example.com/video1.mp4');
    expect(result[0].description).toEqual('First post');
    expect(result[0].feedback).toHaveLength(0);
    expect(result[0].createdAt).toBeInstanceOf(Date);

    expect(result[1].athleteId).toEqual(athleteId);
    expect(result[1].videoUrl).toEqual('https://example.com/video2.mp4');
    expect(result[1].description).toEqual('Second post');
    expect(result[1].feedback).toHaveLength(0);
    expect(result[1].createdAt).toBeInstanceOf(Date);
  });

  it('should return posts with feedback when feedback exists', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'athlete1',
          email: 'athlete1@test.com',
          passwordHash: 'hash123',
          role: 'athlete',
          coins: 100
        },
        {
          username: 'coach1',
          email: 'coach1@test.com',
          passwordHash: 'hash456',
          role: 'coach',
          coins: 50
        }
      ])
      .returning()
      .execute();

    const athleteId = users[0].id;
    const coachId = users[1].id;

    // Create test post
    const posts = await db.insert(postsTable)
      .values([
        {
          athleteId: athleteId,
          videoUrl: 'https://example.com/video1.mp4',
          description: 'Post with feedback'
        }
      ])
      .returning()
      .execute();

    const postId = posts[0].id;

    // Create test feedback
    await db.insert(feedbackTable)
      .values([
        {
          postId: postId,
          coachId: coachId,
          comment: 'Great technique!',
          priceCoins: 10,
          status: 'pending'
        },
        {
          postId: postId,
          coachId: coachId,
          comment: 'Keep working on form',
          priceCoins: 15,
          status: 'accepted'
        }
      ])
      .execute();

    const input: GetPostsByAthleteInput = { athleteId };
    const result = await getPostsByAthlete(input);

    expect(result).toHaveLength(1);
    expect(result[0].athleteId).toEqual(athleteId);
    expect(result[0].feedback).toHaveLength(2);
    
    const feedback = result[0].feedback;
    expect(feedback[0].comment).toEqual('Great technique!');
    expect(feedback[0].priceCoins).toEqual(10);
    expect(feedback[0].status).toEqual('pending');
    expect(feedback[0].coachId).toEqual(coachId);
    expect(feedback[0].createdAt).toBeInstanceOf(Date);

    expect(feedback[1].comment).toEqual('Keep working on form');
    expect(feedback[1].priceCoins).toEqual(15);
    expect(feedback[1].status).toEqual('accepted');
    expect(feedback[1].coachId).toEqual(coachId);
    expect(feedback[1].createdAt).toBeInstanceOf(Date);
  });

  it('should return empty array for athlete with no posts', async () => {
    // Create test athlete
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'athlete1',
          email: 'athlete1@test.com',
          passwordHash: 'hash123',
          role: 'athlete',
          coins: 100
        }
      ])
      .returning()
      .execute();

    const athleteId = users[0].id;

    const input: GetPostsByAthleteInput = { athleteId };
    const result = await getPostsByAthlete(input);

    expect(result).toHaveLength(0);
  });

  it('should return only posts for specified athlete', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'athlete1',
          email: 'athlete1@test.com',
          passwordHash: 'hash123',
          role: 'athlete',
          coins: 100
        },
        {
          username: 'athlete2',
          email: 'athlete2@test.com',
          passwordHash: 'hash456',
          role: 'athlete',
          coins: 50
        }
      ])
      .returning()
      .execute();

    const athlete1Id = users[0].id;
    const athlete2Id = users[1].id;

    // Create posts for both athletes
    await db.insert(postsTable)
      .values([
        {
          athleteId: athlete1Id,
          videoUrl: 'https://example.com/video1.mp4',
          description: 'Athlete 1 post'
        },
        {
          athleteId: athlete2Id,
          videoUrl: 'https://example.com/video2.mp4',
          description: 'Athlete 2 post'
        }
      ])
      .execute();

    const input: GetPostsByAthleteInput = { athleteId: athlete1Id };
    const result = await getPostsByAthlete(input);

    expect(result).toHaveLength(1);
    expect(result[0].athleteId).toEqual(athlete1Id);
    expect(result[0].description).toEqual('Athlete 1 post');
  });
});
