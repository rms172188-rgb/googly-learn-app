import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Empty, Field, inputClass, Loading, SectionTitle, Sheet } from "@/components/common";

type Fee = {
  id: string;
  student_id: string;
  month_label: string;
  amount: number;
  paid: boolean;
  note: string | null;
};

export function FeesManager() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", month_label: "", amount: "", note: "" });

  const { data: students } = useQuery({
    queryKey: ["fees-students"],
    queryFn: async () =>
      ((await supabase.from("profiles").select("id, full_name, class_name, roll").order("full_name"))
        .data ?? []) as { id: string; full_name: string; class_name: string | null; roll: string | null }[],
  });

  const { data: fees, isLoading } = useQuery({
    queryKey: ["fees-all"],
    queryFn: async () =>
      ((await supabase.from("fees").select("*").order("created_at", { ascending: false })).data ??
        []) as Fee[],
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fees").insert({
        student_id: form.student_id,
        month_label: form.month_label,
        amount: Number(form.amount),
        note: form.note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fee record added.");
      setOpen(false);
      setForm({ student_id: "", month_label: "", amount: "", note: "" });
      void qc.invalidateQueries({ queryKey: ["fees-all"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePaid = useMutation({
    mutationFn: async (fee: Fee) => {
      const { error } = await supabase
        .from("fees")
        .update({ paid: !fee.paid, paid_at: !fee.paid ? new Date().toISOString() : null })
        .eq("id", fee.id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["fees-all"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["fees-all"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const nameOf = (id: string) => (students ?? []).find((s) => s.id === id)?.full_name ?? "Student";

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      <SectionTitle
        title="Fees"
        subtitle="Record monthly fees and mark them paid"
        action={
          <button
            onClick={() => setOpen(true)}
            className="tap-target inline-flex items-center gap-1 rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground"
          >
            <Plus className="size-4" /> Add
          </button>
        }
      />

      {(fees ?? []).length === 0 ? (
        <Empty text="Add the first fee record." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {fees!.map((f) => (
            <div key={f.id} className="card-surface p-3">
              <p className="font-bold">{nameOf(f.student_id)}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Badge tone="muted">{f.month_label}</Badge>
                <Badge tone="muted">৳ {Number(f.amount).toLocaleString()}</Badge>
                <Badge tone={f.paid ? "success" : "destructive"}>{f.paid ? "Paid" : "Due"}</Badge>
              </div>
              {f.note ? <p className="mt-1 text-xs text-muted-foreground">{f.note}</p> : null}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => togglePaid.mutate(f)}
                  className="tap-target flex-1 rounded-xl border border-input text-sm font-semibold"
                >
                  Mark {f.paid ? "unpaid" : "paid"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this fee record?")) remove.mutate(f.id);
                  }}
                  className="tap-target flex-1 rounded-xl bg-destructive/10 text-sm font-semibold text-destructive"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Add fee record">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
          className="space-y-3"
        >
          <Field label="Student">
            <select
              className={inputClass}
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              required
            >
              <option value="">Select student</option>
              {(students ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} · {s.class_name ?? "—"} · Roll {s.roll ?? "-"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Month" hint="For example: January 2026">
            <input
              className={inputClass}
              value={form.month_label}
              onChange={(e) => setForm((f) => ({ ...f, month_label: e.target.value }))}
              required
            />
          </Field>
          <Field label="Amount">
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </Field>
          <Field label="Note">
            <input
              className={inputClass}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </Field>
          <button
            type="submit"
            className="tap-target w-full rounded-xl bg-primary font-bold text-primary-foreground"
          >
            Save
          </button>
        </form>
      </Sheet>
    </div>
  );
}
