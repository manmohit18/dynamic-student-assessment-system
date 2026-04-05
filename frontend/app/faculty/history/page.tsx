import { cookies } from "next/headers";
import Link from "next/link";

import { decodeSession } from "@/lib/auth";
import { getFacultyHistoricalOfferings } from "@/lib/db-queries";
import { FacultyHistoryWorkbench } from "@/components/faculty-history-workbench";
import { LoginPanel } from "@/components/login-panel";
import { PortalHeader } from "@/components/portal-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FacultyHistoryPage() {
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
              <CardTitle>Faculty history only</CardTitle>
              <CardDescription>This page is available only for faculty accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/" className="text-amber-200 underline">
                Open overview
              </Link>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const offerings = await getFacultyHistoricalOfferings(session.email);

  return (
    <>
      <PortalHeader name={session.email} role={session.role} />
      <FacultyHistoryWorkbench offerings={offerings} />
    </>
  );
}
