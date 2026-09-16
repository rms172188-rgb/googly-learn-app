import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createTeacher, deleteAccount, setUserPassword } from "@/lib/admin.functions";
import { useBatches, useClasses } from "@/lib/academy";
import { Badge, Empty, Field, inputClass, Loading, SectionTitle, Sheet } from "@/components/common";

type TeacherRow = {
  id: string;
  name: string;
  subject: string | null;
  bio: string | null;
  photo_url: string | null;
  user_id: string | null;
};

export function TeachersManager() {
  const qc = useQueryClient();
  const addTeacher = useServerFn(createTeacher);
  const resetPassword = useServerFn(setUserPassword);
  const removeUser = useServerFn(deleteAccount);
  const { data: classes } = useClasses();
  const { data: batches } = useBatches();

  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({ full_name: "", subject: "", phone: "", password: "" });
  const [pwFor, setPwFor] = useState<TeacherRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [assignFor, setAssignFor] = useState<TeacherRow | null>(null);
  const [assign, setAssign] = useState({ class_name: "", batch: "", subject: "" });

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["panel-teachers"],
    queryFn: async () =>
      ((await supabase.from("teachers").select("*").order("sort_order")).data ?? []) as TeacherRow[],
  });

  const { data: assignments } = useQuery({
    queryKey: ["panel-assignments"],
    queryFn: async () => (await supabase.from("teacher_assignments").select("*")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await addTeacher({ data: form });
      return res;
    },
    onSuccess: (res) => {
      toast.success(`Teacher added. Login name: ${res.username}`);
      setOpenNew(false);
      setForm({ full_name: "", subject: "", phone: "", password: "" });
      void qc.invalidateQueries({ queryKey: ["panel-teachers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addAssignment = useMutation({
    mutationFn: async () => {
      if (!assignFor?.user_id) throw new Error("This teacher has no login account.");
      const { error } = await supabase.from("teacher_assignments").insert({
        teacher_id: assignFor.user_id,
        class_name: assign.class_name,
        batch: assign.batch || null,
        subject: assign.subject || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Class assigned.");
      setAssignFor(null);
      setAssign({ class_name: "", batch: "", subject: "" });
      void qc.invalidateQueries({ queryKey: ["panel-assignments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      <SectionTitle
        title="Teachers"
        subtitle="Create logins and assign classes"
        action={
          <button
            onClick={() => setOpenNew(true)}
            className="tap-target inline-flex items-center gap-1 rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground"
          >
            <Plus className="size-4" /> Add
          </button>
        }
      />

      {(teachers ?? []).length === 0 ? (
        <Empty text="Add your first teacher." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {teachers!.map((t) => {
            const mine = (assignments ?? []).filter((a) => a.teacher_id === t.user_id);
            return (
              <div key={t.id} className="card-surface p-3">
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.subject || "—"}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {mine.length === 0 ? (
                    <Badge tone="warning">No class assigned</Badge>
                  ) : (
                    mine.map((a) => (
                      <Badge key={a.id} tone="muted">
                        {a.class_name}
                        {a.batch ? ` · ${a.batch}` : ""}
                      </Badge>
                    ))
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setAssignFor(t)}
                    className="tap-target rounded-xl border border-input text-xs font-semibold"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => {
                      setPwFor(t);
                      setNewPassword("");
                    }}
                    disabled={!t.user_id}
                    className="tap-target rounded-xl border border-input text-xs font-semibold disabled:opacity-50"
                  >
                    <KeyRound className="mx-auto size-4" />
                    Password
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove ${t.name}?`)) return;
                      try {
                        if (t.user_id) await removeUser({ data: { user_id: t.user_id } });
                        await supabase.from("teachers").delete().eq("id", t.id);
                        toast.success("Teacher removed.");
                        void qc.invalidateQueries({ queryKey: ["panel-teachers"] });
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                    className="tap-target rounded-xl bg-destructive/10 text-xs font-semibold text-destructive"
                  >
                    <Trash2 className="mx-auto size-4" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={openNew} onClose={() => setOpenNew(false)} title="Add teacher">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="space-y-3"
        >
          <Field label="Teacher name" hint="The teacher logs in with this name.">
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              required
              minLength={3}
            />
          </Field>
          <Field label="Subject">
            <input
              className={inputClass}
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="Password" hint="At least 6 characters.">
            <input
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
            />
          </Field>
          <button
            type="submit"
            disabled={create.isPending}
            className="tap-target w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60"
          >
            {create.isPending ? "Creating…" : "Create teacher"}
          </button>
        </form>
      </Sheet>

      <Sheet open={!!assignFor} onClose={() => setAssignFor(null)} title={`Assign — ${assignFor?.name ?? ""}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addAssignment.mutate();
          }}
          className="space-y-3"
        >
          <Field label="Class">
            <select
              className={inputClass}
              value={assign.class_name}
              onChange={(e) => setAssign((a) => ({ ...a, class_name: e.target.value }))}
              required
            >
              <option value="">Select class</option>
              {(classes ?? []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Batch (optional)">
            <select
              className={inputClass}
              value={assign.batch}
              onChange={(e) => setAssign((a) => ({ ...a, batch: e.target.value }))}
            >
              <option value="">All batches</option>
              {(batches ?? [])
                .filter((b) => !assign.class_name || b.class_name === assign.class_name)
                .map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Subject (optional)">
            <input
              className={inputClass}
              value={assign.subject}
              onChange={(e) => setAssign((a) => ({ ...a, subject: e.target.value }))}
            />
          </Field>
          <button
            type="submit"
            className="tap-target w-full rounded-xl bg-primary font-bold text-primary-foreground"
          >
            Assign class
          </button>
        </form>
      </Sheet>

      <Sheet open={!!pwFor} onClose={() => setPwFor(null)} title={`New password — ${pwFor?.name ?? ""}`}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!pwFor?.user_id) return;
            try {
              await resetPassword({ data: { user_id: pwFor.user_id, password: newPassword } });
              toast.success("Password changed.");
              setPwFor(null);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
          className="space-y-3"
        >
          <Field label="New password">
            <input
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </Field>
          <button
            type="submit"
            className="tap-target w-full rounded-xl bg-primary font-bold text-primary-foreground"
          >
            Set password
          </button>
        </form>
      </Sheet>
    </div>
  );
}
