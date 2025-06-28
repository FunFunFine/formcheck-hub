
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUserById } from '../handlers/get_user_by_id';

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hashedpassword123',
  role: 'athlete' as const,
  coins: 50
};

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when user exists', async () => {
    // Create test user
    const insertResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Test getting user by ID
    const result = await getUserById(createdUser.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdUser.id);
    expect(result!.username).toBe('testuser');
    expect(result!.email).toBe('test@example.com');
    expect(result!.passwordHash).toBe('hashedpassword123');
    expect(result!.role).toBe('athlete');
    expect(result!.coins).toBe(50);
    expect(result!.createdAt).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const result = await getUserById(999);

    expect(result).toBeNull();
  });

  it('should return correct user when multiple users exist', async () => {
    // Create multiple test users
    const user1 = await db.insert(usersTable)
      .values({
        ...testUser,
        username: 'user1',
        email: 'user1@example.com'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        ...testUser,
        username: 'user2',
        email: 'user2@example.com',
        role: 'coach' as const,
        coins: 100
      })
      .returning()
      .execute();

    // Test getting specific user
    const result = await getUserById(user2[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(user2[0].id);
    expect(result!.username).toBe('user2');
    expect(result!.email).toBe('user2@example.com');
    expect(result!.role).toBe('coach');
    expect(result!.coins).toBe(100);
  });
});
