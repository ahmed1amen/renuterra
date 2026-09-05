import type { User } from "./types";

export const USERS: User[] = [
  { id: "usr_1", name: "Priya Natarajan", initials: "PN" },
  { id: "usr_2", name: "Marcus Oyelaran", initials: "MO" },
  { id: "usr_3", name: "Elena Sørensen", initials: "ES" },
];

export function findUser(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}
