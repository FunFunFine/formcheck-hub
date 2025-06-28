
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create test user with hashed password
    const testPassword = 'testpassword123';
    const hashedPassword = await Bun.password.hash(testPassword);
    
    await db.insert(usersTable).values({
      username: 'testathlete',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      role: 'athlete',
      coins: 100
    });

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: testPassword
    };

    const result = await login(loginInput);

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('testathlete');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.role).toEqual('athlete');
    expect(result!.coins).toEqual(100);
    expect(result!.id).toBeDefined();
    expect(result!.createdAt).toBeInstanceOf(Date);
    expect(result!.passwordHash).toBeDefined();
  });

  it('should return null for invalid email', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash('testpassword123');
    await db.insert(usersTable).values({
      username: 'testathlete',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      role: 'athlete',
      coins: 100
    });

    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'testpassword123'
    };

    const result = await login(loginInput);

    expect(result).toBeNull();
  });

  it('should return null for invalid password', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash('correctpassword');
    await db.insert(usersTable).values({
      username: 'testathlete',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      role: 'athlete',
      coins: 100
    });

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const result = await login(loginInput);

    expect(result).toBeNull();
  });

  it('should authenticate coach user correctly', async () => {
    // Create test coach
    const testPassword = 'coachpassword456';
    const hashedPassword = await Bun.password.hash(testPassword);
    
    await db.insert(usersTable).values({
      username: 'testcoach',
      email: 'coach@example.com',
      passwordHash: hashedPassword,
      role: 'coach',
      coins: 50
    });

    const loginInput: LoginInput = {
      email: 'coach@example.com',
      password: testPassword
    };

    const result = await login(loginInput);

    expect(result).not.toBeNull();
    expect(result!.username).toEqual('testcoach');
    expect(result!.email).toEqual('coach@example.com');
    expect(result!.role).toEqual('coach');
    expect(result!.coins).toEqual(50);
  });

  it('should handle empty database', async () => {
    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'anypassword'
    };

    const result = await login(loginInput);

    expect(result).toBeNull();
  });
});
