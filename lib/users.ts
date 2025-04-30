"use server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByEmail(email: string) {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return results.length > 0 ? results[0] : null;
}

export async function getUserById(id: string) {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return results.length > 0 ? results[0] : null;
}

export async function createUser(data: {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}) {
  const existingUser = await getUserByEmail(data.email);

  if (existingUser) {
    throw new Error("User already exists");
  }

  const newUser = await db
    .insert(users)
    .values({
      id: data.id,
      name: data.name,
      email: data.email,
      image: data.image || null,
    })
    .returning();

  return newUser[0];
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    image: string | null;
  }>
) {
  const updatedUser = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return updatedUser[0];
}
