import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Megaphone,
  Menu,
  PlayCircle,
  Trophy,
  User,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/academy";
import { Sheet } from "@/components/common";
import { cn } from "@/lib/utils";

const moreItems = [
  { to: "/app/attendance", label: "Attendance", icon: CheckSquare },
  { to: "/app/results", label: "Results", icon: Trophy },
  { to: "/app/exams", label: "Exams", icon: ClipboardList },
  { to: "/app/homework", label: "Homework", icon: BookOpen },
  { to: "/app/materials", label: "Materials", icon: FileText },
  { to: "/app/fees", label: "Fees", icon: Wallet },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

const bottomItems = [
  { to: "/app/home", label: "Home", icon: Home },
  { to: "/app/videos", label: "Classes", icon: PlayCircle },
  { to: "/app/routine", label: "Routine", icon: CalendarDays },
  { to: "/app/notices", label: "Notice", icon: Megaphone },
] as const;

export function StudentShell({ section, children }: { section: string; children: ReactNode }) {
  const [more, setMore] = useState(false);
  const { profile, signOut } = useAuth();
  const { data: settings } = useSettings();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5">
          <Link to="/app/home" className="flex min-w-0 items-center gap-2">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt=""
                loading="lazy"
                className="size-9 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="size-5" />
              </span>
            )}
            <span className="truncate text-sm font-extrabold tracking-tight">
              {settings?.academy_name ?? "GOOGLY ACADEMY"}
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              to="/app/notices"
              aria-label="Notices"
              className="tap-target grid place-items-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <Bell className="size-5" />
            </Link>
            <Link
              to="/app/profile"
              aria-label="My profile"
              className="tap-target grid place-items-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <User className="size-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-3 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-bottom">
        <div className="mx-auto grid max-w-3xl grid-cols-5">
          {bottomItems.map((item) => {
            const active = section === item.to.split("/")[2];
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "tap-target flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setMore(true)}
            className="tap-target flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold text-muted-foreground"
          >
            <Menu className="size-5" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title={profile?.full_name ?? "More"}>
        <div className="grid grid-cols-2 gap-2">
          {moreItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMore(false)}
              className="tap-target flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-semibold hover:bg-muted"
            >
              <item.icon className="size-5 shrink-0 text-primary" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="tap-target col-span-2 flex items-center justify-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-bold text-destructive"
          >
            <LogOut className="size-5" /> Logout
          </button>
        </div>
      </Sheet>
    </div>
  );
}
