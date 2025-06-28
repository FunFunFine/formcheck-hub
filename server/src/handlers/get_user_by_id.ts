
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type User } from '../schema';

export const getUserById = async (userId: number): Promise<User | null> => {
  try {
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (result.length === 0) {
      return null;
    }

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
    console.error('Get user by ID failed:', error);
    throw error;
  }
};
