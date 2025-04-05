"use server";

import { hash } from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const users = [
  {
    id: "1",
    name: "Admin",
    email: "admin@example.com",
    password: "$2b$10$8r0qPVaJeLAEjHpn0iKBXuIf/L3cjGX3hqJG6nGgVjKh8kTJfTIWO",
    image: null,
  },
];

export async function getUserByEmail(email: string) {
  return users.find((user) => user.email === email) || null;
}

export async function getUserById(id: string) {
  return users.find((user) => user.id === id) || null;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const existingUser = await getUserByEmail(data.email);

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await hash(data.password, 10);

  const newUser = {
    id: uuidv4(),
    name: data.name,
    email: data.email,
    password: hashedPassword,
    image: null,
  };

  users.push(newUser);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    image: newUser.image,
  };
}
