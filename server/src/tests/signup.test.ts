
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignupInput } from '../schema';
import { signup } from '../handlers/signup';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: SignupInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: 'athlete'
};

describe('signup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user account', async () => {
    const result = await signup(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.email).toEqual('test@example.com');
    expect(result.role).toEqual('athlete');
    expect(result.coins).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.passwordHash).toBeDefined();
    expect(result.passwordHash).not.toEqual('password123'); // Should be hashed
  });

  it('should save user to database', async () => {
    const result = await signup(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    expect(savedUser.username).toEqual('testuser');
    expect(savedUser.email).toEqual('test@example.com');
    expect(savedUser.role).toEqual('athlete');
    expect(savedUser.coins).toEqual(0);
    expect(savedUser.createdAt).toBeInstanceOf(Date);
    expect(savedUser.passwordHash).toBeDefined();
  });

  it('should hash the password', async () => {
    const result = await signup(testInput);

    // Password should be hashed, not plain text
    expect(result.passwordHash).not.toEqual('password123');
    expect(result.passwordHash.length).toBeGreaterThan(10);

    // Verify password can be verified with Bun's password verification
    const isValid = await Bun.password.verify('password123', result.passwordHash);
    expect(isValid).toBe(true);
  });

  it('should create coach account', async () => {
    const coachInput: SignupInput = {
      ...testInput,
      username: 'testcoach',
      email: 'coach@example.com',
      role: 'coach'
    };

    const result = await signup(coachInput);

    expect(result.username).toEqual('testcoach');
    expect(result.email).toEqual('coach@example.com');
    expect(result.role).toEqual('coach');
    expect(result.coins).toEqual(0);
  });

  it('should fail with duplicate username', async () => {
    // Create first user
    await signup(testInput);

    // Try to create second user with same username
    const duplicateInput: SignupInput = {
      ...testInput,
      email: 'different@example.com'
    };

    await expect(signup(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should fail with duplicate email', async () => {
    // Create first user
    await signup(testInput);

    // Try to create second user with same email
    const duplicateInput: SignupInput = {
      ...testInput,
      username: 'differentuser'
    };

    await expect(signup(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});
