import { useState, type ComponentType, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/academy";
import { cn } from "@/lib/utils";

export type NavItem = { section: string; label: string; icon: ComponentType<{ className?: string }> };

export function PanelShell({
  base,
  title,
  section,
  items,
  children,
}: {
  base: "/admin" | "/teacher";
  title: string;
  section: string;
  items: NavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const { data: settings } = useSettings();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    void navigate({ to: "/login", replace: true });
  }

  const nav = (
    <nav className="space-y-1">
      {items.map((item) => (
        <Link
          key={item.section}
          to={`${base}/$section`}
          params={{ section: item.section }}
          onClick={() => setOpen(false)}
          className={cn(
            "tap-target flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
            section === item.section
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted",
          )}
        >
          <item.icon className="size-5 shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
      <button
        onClick={handleSignOut}
        className="tap-target flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
      >
        <LogOut className="size-5 shrink-0" /> Logout
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-border bg-sidebar p-3 lg:block">
        <div className="mb-4 flex items-center gap-2 px-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">
              {settings?.academy_name ?? "GOOGLY ACADEMY"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
        {nav}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur lg:hidden">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="tap-target grid place-items-center rounded-xl hover:bg-muted"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">
                {settings?.academy_name ?? "GOOGLY ACADEMY"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{title}</p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-accent-foreground">
              {(profile?.full_name ?? "A").slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-3 py-4 lg:px-6 lg:py-6">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="relative z-10 h-full w-[84%] max-w-xs overflow-y-auto border-r border-border bg-sidebar p-3">
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <p className="truncate text-sm font-extrabold">{title}</p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="tap-target grid shrink-0 place-items-center rounded-xl hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}
    </div>
  );
}
