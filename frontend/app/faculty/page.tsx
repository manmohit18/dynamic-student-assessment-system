import { cookies } from "next/headers";
import Link from "next/link";

import { decodeSession } from "@/lib/auth";
import { getFacultyOfferings } from "@/lib/db-queries";
import { FacultyWorkspace } from "@/components/faculty-workspace";
import { PortalHeader } from "@/components/portal-header";
import { LoginPanel } from "@/components/login-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FacultyPage() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get("course_portal_session")?.value);

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4">
        <LoginPanel />
      </main>
    );
  }

  if (session.role !== "faculty") {
    return (
      <>
        <PortalHeader name={session.email} role={session.role} />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Faculty workspace only</CardTitle>
              <CardDescription>Use the student dashboard for marks and grade history.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/courses" className="text-amber-200 underline">
                Open student courses
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const offerings = await getFacultyOfferings(session.email);

  return (
    <>
      <PortalHeader name={session.email} role={session.role} />
      <FacultyWorkspace offerings={offerings} />
    </>
  );
}
