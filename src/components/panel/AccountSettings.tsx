import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Field, inputClass, SectionTitle } from "@/components/common";

export function AccountSettings() {
  const { profile, role, user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 6) {
      toast.error("Use at least 6 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: next,
      ...(current ? { current_password: current } : {}),
    } as Parameters<typeof supabase.auth.updateUser>[0]);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password changed.");
    setCurrent("");
    setNext("");
  }

  return (
    <div className="space-y-3">
      <SectionTitle title="My account" subtitle="Your login details" />
      <div className="card-surface space-y-2 p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Name: </span>
          <span className="font-semibold">{profile?.full_name ?? "—"}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Login name: </span>
          <span className="font-semibold">{profile?.username ?? user?.email ?? "—"}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Role: </span>
          <span className="font-semibold capitalize">{(role ?? "").replace("_", " ")}</span>
        </p>
      </div>

      <form onSubmit={submit} className="card-surface space-y-3 p-4">
        <p className="font-bold">Change password</p>
        <Field label="Current password">
          <input
            className={inputClass}
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="New password" hint="At least 6 characters.">
          <input
            className={inputClass}
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
        </Field>
        <button
          type="submit"
          disabled={busy}
          className="tap-target w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
