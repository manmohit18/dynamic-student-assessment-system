import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "course_portal_session";

export type SessionUser = {
  email: string;
  role: "student" | "faculty" | "admin";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function encodeSession(user: SessionUser) {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}

export function decodeSession(value?: string | null): SessionUser | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionUser;
    if (
      parsed &&
      typeof parsed.email === "string" &&
      (parsed.role === "student" || parsed.role === "faculty" || parsed.role === "admin")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
