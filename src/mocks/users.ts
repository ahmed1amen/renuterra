import data from "./data/users.json";
import type { User } from "./types";

export const USERS = data as User[];

export function findUser(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}
