import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Empty, Field, inputClass, Loading, SectionTitle, Sheet } from "@/components/common";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "checkbox" | "url";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
};

type Row = Record<string, unknown> & { id: string };

export function ResourceManager({
  table,
  title,
  subtitle,
  fields,
  orderBy = "created_at",
  ascending = false,
  cardTitle,
  cardMeta,
  readOnly = false,
}: {
  table: string;
  title: string;
  subtitle?: string;
  fields: FieldDef[];
  orderBy?: string;
  ascending?: boolean;
  cardTitle: (row: Row) => string;
  cardMeta: (row: Row) => (string | null | undefined)[];
  readOnly?: boolean;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["resource", table],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from(table as never)
        .select("*")
        .order(orderBy, { ascending });
      if (error) throw error;
      return (rows ?? []) as unknown as Row[];
    },
  });

  const save = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const clean: Record<string, unknown> = {};
      for (const f of fields) {
        let value = payload[f.name];
        if (f.type === "number") value = value === "" || value == null ? null : Number(value);
        if (f.type === "checkbox") value = Boolean(value);
        if (value === "") value = null;
        clean[f.name] = value;
      }
      if (editing) {
        const { error } = await supabase
          .from(table as never)
          .update(clean as never)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as never).insert(clean as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Saved." : "Added.");
      setOpen(false);
      setEditing(null);
      setForm({});
      void qc.invalidateQueries({ queryKey: ["resource", table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted.");
      void qc.invalidateQueries({ queryKey: ["resource", table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startCreate() {
    setEditing(null);
    setForm({});
    setOpen(true);
  }
  function startEdit(row: Row) {
    setEditing(row);
    setForm({ ...row });
    setOpen(true);
  }

  if (isLoading) return <Loading />;
  const rows = data ?? [];

  return (
    <div className="space-y-3">
      <SectionTitle
        title={title}
        subtitle={subtitle}
        action={
          readOnly ? null : (
            <button
              onClick={startCreate}
              className="tap-target inline-flex items-center gap-1 rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground"
            >
              <Plus className="size-4" /> Add
            </button>
          )
        }
      />

      {rows.length === 0 ? (
        <Empty text="Use the Add button to create the first entry." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.id} className="card-surface p-3">
              <p className="font-bold leading-tight">{cardTitle(row)}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {cardMeta(row)
                  .filter(Boolean)
                  .map((m, i) => (
                    <Badge key={i} tone="muted">
                      {m}
                    </Badge>
                  ))}
              </div>
              {readOnly ? null : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => startEdit(row)}
                    className="tap-target flex-1 rounded-xl border border-input text-sm font-semibold"
                  >
                    <Pencil className="mr-1 inline size-4" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this entry?")) remove.mutate(row.id);
                    }}
                    className="tap-target flex-1 rounded-xl bg-destructive/10 text-sm font-semibold text-destructive"
                  >
                    <Trash2 className="mr-1 inline size-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${title}` : `Add ${title}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
          className="space-y-3"
        >
          {fields.map((f) => (
            <Field key={f.name} label={f.label}>
              {f.type === "textarea" ? (
                <textarea
                  className={inputClass}
                  rows={3}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={String(form[f.name] ?? "")}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              ) : f.type === "select" ? (
                <select
                  className={inputClass}
                  required={f.required}
                  value={String(form[f.name] ?? "")}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                >
                  <option value="">Select…</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  className="size-6 accent-[var(--color-primary)]"
                  checked={Boolean(form[f.name])}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.checked }))}
                />
              ) : (
                <input
                  className={inputClass}
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  inputMode={f.type === "number" ? "numeric" : undefined}
                  required={f.required}
                  placeholder={f.placeholder}
                  value={String(form[f.name] ?? "")}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              )}
            </Field>
          ))}
          <button
            type="submit"
            disabled={save.isPending}
            className="tap-target w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </form>
      </Sheet>
    </div>
  );
}
