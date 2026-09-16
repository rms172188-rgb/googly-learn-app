import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loginEmail, normalizeUsername } from "@/lib/auth";
import { useBatches, useClasses, useSettings } from "@/lib/academy";
import { Field, inputClass } from "@/components/common";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student Registration — GOOGLY ACADEMY" },
      {
        name: "description",
        content: "Register as a GOOGLY ACADEMY student in one minute and get access to class videos, materials, exams and results.",
      },
      { property: "og:title", content: "Student Registration — GOOGLY ACADEMY" },
      { property: "og:description", content: "Create your GOOGLY ACADEMY student account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegisterPage,
});

export default function noop() {}

function RegisterPage() {
  const { data: settings } = useSettings();
  const { data: classes } = useClasses();
  const { data: batches } = useBatches();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    roll: "",
    class_name: "",
    batch: "",
    guardian_name: "",
    guardian_phone: "",
    address: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const batchOptions = (batches ?? []).filter((b) => !form.class_name || b.class_name === form.class_name);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (normalizeUsername(form.full_name).length < 3)
      return setError("Please write your full name (at least 3 letters).");
    if (!/^[0-9+\-\s]{6,}$/.test(form.phone)) return setError("Please enter a valid phone number.");
    if (!form.class_name) return setError("Please select your class.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    setBusy(true);
    const { username, email } = loginEmail(form.full_name, "student");
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username,
          full_name: form.full_name.trim(),
          phone: form.phone,
          roll: form.roll,
          class_name: form.class_name,
          batch: form.batch,
          guardian_name: form.guardian_name,
          guardian_phone: form.guardian_phone,
          address: form.address,
        },
      },
    });
    setBusy(false);

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      setError(
        msg.includes("already") || msg.includes("registered") || msg.includes("database error")
          ? "This student name is already registered. Please use your full name (for example add your father's name) or log in instead."
          : signUpError.message,
      );
      return;
    }
    if (!data.session) {
      setError("Account created. Please log in with your name and password.");
      return;
    }
    void navigate({ to: "/app/$section", params: { section: "home" } });
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="size-7" />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold">Student Registration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {settings?.academy_name ?? "GOOGLY ACADEMY"}
          </p>
        </div>

        <form onSubmit={submit} className="card-surface mt-6 space-y-4 p-4">
          <Field label="Student Name" hint="You will log in with this name.">
            <input className={inputClass} value={form.full_name} onChange={set("full_name")} required />
          </Field>
          <Field label="Phone Number">
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={set("phone")}
              required
            />
          </Field>
          <Field label="Roll Number">
            <input className={inputClass} inputMode="numeric" value={form.roll} onChange={set("roll")} />
          </Field>
          <Field label="Class">
            <select className={inputClass} value={form.class_name} onChange={set("class_name")} required>
              <option value="">Select class</option>
              {(classes ?? []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Batch">
            <select className={inputClass} value={form.batch} onChange={set("batch")}>
              <option value="">Select batch</option>
              {batchOptions.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Guardian Name">
            <input className={inputClass} value={form.guardian_name} onChange={set("guardian_name")} />
          </Field>
          <Field label="Guardian Phone">
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              value={form.guardian_phone}
              onChange={set("guardian_phone")}
            />
          </Field>
          <Field label="Address">
            <textarea className={inputClass} rows={2} value={form.address} onChange={set("address")} />
          </Field>
          <Field label="Password" hint="At least 6 characters.">
            <input
              type="password"
              className={inputClass}
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              required
            />
          </Field>
          <Field label="Confirm Password">
            <input
              type="password"
              className={inputClass}
              autoComplete="new-password"
              value={form.confirm}
              onChange={set("confirm")}
              required
            />
          </Field>

          {error ? (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="tap-target w-full rounded-xl bg-primary text-base font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Creating account…" : "REGISTER NOW"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-primary">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
