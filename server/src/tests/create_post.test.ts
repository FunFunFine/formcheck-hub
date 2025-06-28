
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, usersTable } from '../db/schema';
import { type CreatePostInput } from '../schema';
import { createPost } from '../handlers/create_post';
import { eq } from 'drizzle-orm';

describe('createPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a post', async () => {
    // First create a user (athlete) to reference
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testathlete',
        email: 'athlete@test.com',
        passwordHash: 'hashedpassword',
        role: 'athlete',
        coins: 100
      })
      .returning()
      .execute();

    const testInput: CreatePostInput = {
      athleteId: userResult[0].id,
      videoUrl: 'https://example.com/video.mp4',
      description: 'Test post description'
    };

    const result = await createPost(testInput);

    // Basic field validation
    expect(result.athleteId).toEqual(userResult[0].id);
    expect(result.videoUrl).toEqual('https://example.com/video.mp4');
    expect(result.description).toEqual('Test post description');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should save post to database', async () => {
    // First create a user (athlete) to reference
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testathlete2',
        email: 'athlete2@test.com',
        passwordHash: 'hashedpassword',
        role: 'athlete',
        coins: 50
      })
      .returning()
      .execute();

    const testInput: CreatePostInput = {
      athleteId: userResult[0].id,
      videoUrl: 'https://example.com/video2.mp4',
      description: 'Another test post'
    };

    const result = await createPost(testInput);

    // Query using proper drizzle syntax
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, result.id))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].athleteId).toEqual(userResult[0].id);
    expect(posts[0].videoUrl).toEqual('https://example.com/video2.mp4');
    expect(posts[0].description).toEqual('Another test post');
    expect(posts[0].createdAt).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent athlete', async () => {
    const testInput: CreatePostInput = {
      athleteId: 999, // Non-existent athlete ID
      videoUrl: 'https://example.com/video.mp4',
      description: 'Test post description'
    };

    await expect(createPost(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
