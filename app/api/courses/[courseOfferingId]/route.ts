import { cookies } from "next/headers";

import { decodeSession } from "@/lib/auth";
import { getCourseDetail } from "@/lib/db-queries";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ courseOfferingId: string }> },
) {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get("course_portal_session")?.value);
  if (!session || session.role !== "student") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseOfferingId } = await ctx.params;
  const course = await getCourseDetail(session.email, Number(courseOfferingId));
  if (!course) {
    return Response.json({ error: "Course not found." }, { status: 404 });
  }

  return Response.json(course);
}
