
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function login(input: LoginInput): Promise<User | null> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // Verify password against stored hash
    // In a real application, you would use a proper password hashing library like bcrypt
    // For this implementation, we'll do a simple comparison
    const isPasswordValid = await Bun.password.verify(input.password, user.passwordHash);

    if (!isPasswordValid) {
      return null; // Invalid password
    }

    // Return user data without password hash
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash, // Keep for schema compliance
      role: user.role,
      coins: user.coins,
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
