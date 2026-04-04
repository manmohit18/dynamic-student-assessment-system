"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpenText, Calculator, CalendarRange, LayoutDashboard, LogOut, ShieldCheck } from "@/components/icons";

type PortalHeaderProps = {
  name: string;
  role: "student" | "faculty" | "admin";
};

export function PortalHeader({ name, role }: PortalHeaderProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  const roleLabel = role === "student" ? "Student" : role === "faculty" ? "Faculty" : "Admin";

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/85 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500 text-white shadow-[0_12px_36px_rgba(180,83,9,0.16)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Course portal</p>
            <h1 className="text-lg font-semibold text-slate-900">{name}</h1>
          </div>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/" className="rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-stone-100">
            <LayoutDashboard className="mr-2 inline h-4 w-4" />
            Overview
          </Link>
          <Link href="/courses" className="rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-stone-100">
            <BookOpenText className="mr-2 inline h-4 w-4" />
            Courses
          </Link>
          <Link href="/history" className="rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-stone-100">
            <CalendarRange className="mr-2 inline h-4 w-4" />
            History
          </Link>
          <Link href="/gpa" className="rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-stone-100">
            <Calculator className="mr-2 inline h-4 w-4" />
            GPA
          </Link>
          {role !== "student" ? (
            <Link href="/faculty" className="rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-stone-100">
              Faculty
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          <Badge>{roleLabel}</Badge>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
