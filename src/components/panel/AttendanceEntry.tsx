import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useBatches, useClasses } from "@/lib/academy";
import { Empty, Field, inputClass, Loading, SectionTitle } from "@/components/common";
import { cn } from "@/lib/utils";

type Student = { id: string; full_name: string; roll: string | null; batch: string | null };

export function AttendanceEntry() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: classes } = useClasses();
  const { data: batches } = useBatches();

  const [className, setClassName] = useState("");
  const [batch, setBatch] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, "present" | "absent">>({});

  const { data: students, isLoading } = useQuery({
    queryKey: ["attendance-students", className, batch],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, full_name, roll, batch")
        .eq("class_name", className)
        .order("roll");
      if (batch) query = query.eq("batch", batch);
      const { data } = await query;
      return (data ?? []) as Student[];
    },
    enabled: !!className,
  });

  const { data: existing } = useQuery({
    queryKey: ["attendance-existing", className, batch, date, subject],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("student_id, status")
        .eq("attend_date", date)
        .eq("class_name", className);
      return data ?? [];
    },
    enabled: !!className,
  });

  useEffect(() => {
    const next: Record<string, "present" | "absent"> = {};
    for (const row of existing ?? []) next[row.student_id] = row.status === "absent" ? "absent" : "present";
    setMarks(next);
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = (students ?? []).map((s) => ({
        student_id: s.id,
        attend_date: date,
        status: marks[s.id] ?? "present",
        class_name: className,
        batch: s.batch,
        subject: subject || null,
        marked_by: user?.id ?? null,
      }));
      if (rows.length === 0) throw new Error("No students in this class.");
      const { error } = await supabase
        .from("attendance")
        .upsert(rows, { onConflict: "student_id,attend_date,subject" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Attendance saved.");
      void qc.invalidateQueries({ queryKey: ["attendance-existing"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const batchOptions = (batches ?? []).filter((b) => !className || b.class_name === className);

  return (
    <div className="space-y-3">
      <SectionTitle title="Take Attendance" subtitle="Tap each student to switch present / absent." />
      <div className="card-surface grid gap-3 p-4 sm:grid-cols-2">
        <Field label="Class">
          <select className={inputClass} value={className} onChange={(e) => setClassName(e.target.value)}>
            <option value="">Select class</option>
            {(classes ?? []).map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Batch (optional)">
          <select className={inputClass} value={batch} onChange={(e) => setBatch(e.target.value)}>
            <option value="">All batches</option>
            {batchOptions.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subject (optional)">
          <input className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Date">
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>

      {!className ? (
        <Empty text="Select a class to load students." />
      ) : isLoading ? (
        <Loading />
      ) : (students ?? []).length === 0 ? (
        <Empty text="No students registered in this class yet." />
      ) : (
        <>
          <div className="space-y-2">
            {students!.map((s) => {
              const status = marks[s.id] ?? "present";
              return (
                <button
                  key={s.id}
                  onClick={() =>
                    setMarks((m) => ({ ...m, [s.id]: status === "present" ? "absent" : "present" }))
                  }
                  className="card-surface grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Roll {s.roll || "-"} · {s.batch || "-"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "tap-target grid shrink-0 place-items-center rounded-xl px-4 text-sm font-bold",
                      status === "present"
                        ? "bg-success/15 text-success"
                        : "bg-destructive/12 text-destructive",
                    )}
                  >
                    {status === "present" ? "Present" : "Absent"}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="tap-target sticky bottom-20 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-pop disabled:opacity-60 lg:bottom-4"
          >
            {save.isPending ? "Saving…" : "Save attendance"}
          </button>
        </>
      )}
    </div>
  );
}
