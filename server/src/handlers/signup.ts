
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type SignupInput, type User } from '../schema';

export const signup = async (input: SignupInput): Promise<User> => {
  try {
    // Hash the password (simple hash for demo - use bcrypt in production)
    const passwordHash = await Bun.password.hash(input.password);

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        email: input.email,
        passwordHash: passwordHash,
        role: input.role,
        coins: 0 // Default value
      })
      .returning()
      .execute();

    const user = result[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      coins: user.coins,
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error('User signup failed:', error);
    throw error;
  }
};
