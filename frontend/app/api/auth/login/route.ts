import { cookies } from "next/headers";

import { encodeSession, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { query } from "@/lib/oracle";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!body.email || !body.password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();

  const studentRows = await query<Record<string, unknown>>(
    `SELECT email, password_hash, role FROM student WHERE email = :email FETCH FIRST 1 ROW ONLY`,
    { email },
  );
  const facultyRows = await query<Record<string, unknown>>(
    `SELECT email, password_hash, 'faculty' AS role FROM faculty WHERE email = :email FETCH FIRST 1 ROW ONLY`,
    { email },
  );

  const user = studentRows[0] ?? facultyRows[0];
  if (!user) {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const passwordHash = String(user.PASSWORD_HASH);
  const ok = await verifyPassword(body.password, passwordHash);
  if (!ok) {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const role = String(user.ROLE) as "student" | "faculty" | "admin";
  const session = encodeSession({ email, role });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json({ ok: true, role });
}
