import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Pencil, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { deleteAccount, setUserPassword } from "@/lib/admin.functions";
import { useBatches, useClasses } from "@/lib/academy";
import { Badge, Empty, Field, inputClass, Loading, SectionTitle, Sheet } from "@/components/common";

type Student = {
  id: string;
  full_name: string;
  username: string;
  roll: string | null;
  class_name: string | null;
  batch: string | null;
  phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  address: string | null;
  active: boolean;
};

export function StudentsManager({ canManage }: { canManage: boolean }) {
  const qc = useQueryClient();
  const { data: classes } = useClasses();
  const { data: batches } = useBatches();
  const resetPassword = useServerFn(setUserPassword);
  const removeUser = useServerFn(deleteAccount);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Partial<Student>>({});
  const [pwFor, setPwFor] = useState<Student | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["panel-students"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const studentIds = new Set(
        (roles ?? []).filter((r) => r.role === "student").map((r) => r.user_id),
      );
      const { data: profiles } = await supabase.from("profiles").select("*").order("full_name");
      return ((profiles ?? []) as Student[]).filter((p) => studentIds.size === 0 || studentIds.has(p.id));
    },
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name ?? "",
          roll: form.roll ?? null,
          class_name: form.class_name ?? null,
          batch: form.batch ?? null,
          phone: form.phone ?? null,
          guardian_name: form.guardian_name ?? null,
          guardian_phone: form.guardian_phone ?? null,
          address: form.address ?? null,
          active: form.active ?? true,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Student updated.");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["panel-students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = (data ?? []).filter(
    (s) =>
      (!search ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.roll ?? "").includes(search)) &&
      (!classFilter || s.class_name === classFilter),
  );

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      <SectionTitle title="Students" subtitle={`${list.length} student(s)`} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search name or roll"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={inputClass} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All classes</option>
          {(classes ?? []).map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <Empty text="No students match this search." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {list.map((s) => (
            <div key={s.id} className="card-surface p-3">
              <p className="font-bold">{s.full_name}</p>
              <p className="text-xs text-muted-foreground">Login name: {s.username}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge tone="muted">Roll {s.roll || "-"}</Badge>
                <Badge tone="muted">{s.class_name || "No class"}</Badge>
                {s.batch ? <Badge tone="muted">{s.batch}</Badge> : null}
                {s.phone ? <Badge tone="muted">{s.phone}</Badge> : null}
              </div>
              {canManage ? (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setEditing(s);
                      setForm(s);
                    }}
                    className="tap-target rounded-xl border border-input text-xs font-semibold"
                  >
                    <Pencil className="mx-auto size-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setPwFor(s);
                      setNewPassword("");
                    }}
                    className="tap-target rounded-xl border border-input text-xs font-semibold"
                  >
                    <KeyRound className="mx-auto size-4" />
                    Password
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete ${s.full_name}? This cannot be undone.`)) return;
                      try {
                        await removeUser({ data: { user_id: s.id } });
                        toast.success("Student deleted.");
                        void qc.invalidateQueries({ queryKey: ["panel-students"] });
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                    className="tap-target rounded-xl bg-destructive/10 text-xs font-semibold text-destructive"
                  >
                    <Trash2 className="mx-auto size-4" />
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit student">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile.mutate();
          }}
          className="space-y-3"
        >
          <Field label="Full name">
            <input
              className={inputClass}
              value={form.full_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            />
          </Field>
          <Field label="Roll">
            <input
              className={inputClass}
              value={form.roll ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, roll: e.target.value }))}
            />
          </Field>
          <Field label="Class">
            <select
              className={inputClass}
              value={form.class_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))}
            >
              <option value="">No class</option>
              {(classes ?? []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Batch">
            <select
              className={inputClass}
              value={form.batch ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
            >
              <option value="">No batch</option>
              {(batches ?? [])
                .filter((b) => !form.class_name || b.class_name === form.class_name)
                .map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Phone">
            <input
              className={inputClass}
              inputMode="tel"
              value={form.phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="Guardian name">
            <input
              className={inputClass}
              value={form.guardian_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, guardian_name: e.target.value }))}
            />
          </Field>
          <Field label="Guardian phone">
            <input
              className={inputClass}
              inputMode="tel"
              value={form.guardian_phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, guardian_phone: e.target.value }))}
            />
          </Field>
          <Field label="Address">
            <textarea
              className={inputClass}
              rows={2}
              value={form.address ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </Field>
          <button
            type="submit"
            className="tap-target w-full rounded-xl bg-primary font-bold text-primary-foreground"
          >
            Save changes
          </button>
        </form>
      </Sheet>

      <Sheet open={!!pwFor} onClose={() => setPwFor(null)} title={`New password — ${pwFor?.full_name ?? ""}`}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!pwFor) return;
            try {
              await resetPassword({ data: { user_id: pwFor.id, password: newPassword } });
              toast.success("Password changed.");
              setPwFor(null);
            } catch (err) {
              toast.error((err as Error).message);
            }
          }}
          className="space-y-3"
        >
          <Field label="New password" hint="At least 6 characters. Share it with the student.">
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
