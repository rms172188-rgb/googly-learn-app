import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loginEmail } from "@/lib/auth";
import { useSettings } from "@/lib/academy";
import { Field, inputClass } from "@/components/common";

export const Route = createFileRoute("/staff-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Teacher & Admin Login — GOOGLY ACADEMY" },
      {
        name: "description",
        content: "Secure login for GOOGLY ACADEMY teachers and administrators to manage classes, marks and students.",
      },
      { property: "og:title", content: "Teacher & Admin Login — GOOGLY ACADEMY" },
      { property: "og:description", content: "Secure staff login for GOOGLY ACADEMY." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffLogin,
});

function StaffLogin() {
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    // Staff accounts may be admin or teacher; try both address forms.
    const candidates = [loginEmail(username, "admin").email, loginEmail(username, "teacher").email];
    let userId: string | null = null;
    for (const email of candidates) {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!signInError && data.user) {
        userId = data.user.id;
        break;
      }
    }
    if (!userId) {
      setBusy(false);
      setError("Wrong username or password.");
      return;
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const list = (roles ?? []).map((r) => r.role);
    setBusy(false);
    if (list.includes("super_admin"))
      return navigate({ to: "/admin/$section", params: { section: "dashboard" } });
    if (list.includes("teacher"))
      return navigate({ to: "/teacher/$section", params: { section: "dashboard" } });
    return navigate({ to: "/app/$section", params: { section: "home" } });
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-8" />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold">{settings?.academy_name ?? "GOOGLY ACADEMY"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Teacher / Admin Login</p>
        </div>

        <form onSubmit={submit} className="card-surface mt-6 space-y-4 p-4">
          <Field label="Username">
            <input
              className={inputClass}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="tap-target w-full rounded-xl bg-primary text-base font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Logging in…" : "LOGIN"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="font-semibold text-primary">
            Student login
          </Link>
        </p>
      </div>
    </div>
  );
}
