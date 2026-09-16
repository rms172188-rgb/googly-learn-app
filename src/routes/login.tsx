import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loginEmail } from "@/lib/auth";
import { useSettings } from "@/lib/academy";
import { Field, inputClass } from "@/components/common";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student Login — GOOGLY ACADEMY" },
      {
        name: "description",
        content: "Log in to your GOOGLY ACADEMY student account to watch class videos, see routine, results and fees.",
      },
      { property: "og:title", content: "Student Login — GOOGLY ACADEMY" },
      { property: "og:description", content: "Log in to your GOOGLY ACADEMY student account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [help, setHelp] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { email } = loginEmail(name, "student");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.user) {
      setBusy(false);
      setError("Wrong student name or password. Please check and try again.");
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const list = (roles ?? []).map((r) => r.role);
    setBusy(false);
    if (list.includes("super_admin")) return navigate({ to: "/admin/$section", params: { section: "dashboard" } });
    if (list.includes("teacher")) return navigate({ to: "/teacher/$section", params: { section: "dashboard" } });
    return navigate({ to: "/app/$section", params: { section: "home" } });
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="" className="mx-auto size-16 rounded-2xl object-cover" />
          ) : (
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <GraduationCap className="size-8" />
            </span>
          )}
          <h1 className="mt-3 text-2xl font-extrabold">{settings?.academy_name ?? "GOOGLY ACADEMY"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Student Login</p>
        </div>

        <form onSubmit={submit} className="card-surface mt-6 space-y-4 p-4">
          <Field label="Student Name" hint="Use the same full name you registered with.">
            <input
              className={inputClass}
              autoComplete="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
          <button
            type="button"
            onClick={() => setHelp((v) => !v)}
            className="w-full text-center text-sm font-semibold text-primary"
          >
            Forgot Password?
          </button>
          {help ? (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
              Contact the academy office{settings?.contact_phone ? ` (${settings.contact_phone})` : ""} and
              your teacher or admin will set a new password for you.
            </p>
          ) : null}
        </form>

        <p className="mt-4 text-center text-sm">
          New student?{" "}
          <Link to="/register" className="font-bold text-primary">
            Register now
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/staff-login" className="font-semibold text-muted-foreground">
            Teacher / Admin login
          </Link>
        </p>
      </div>
    </div>
  );
}
