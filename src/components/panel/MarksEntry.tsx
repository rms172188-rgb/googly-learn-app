import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { gradeFor } from "@/lib/academy";
import { Empty, Field, inputClass, Loading, SectionTitle } from "@/components/common";

type Exam = {
  id: string;
  name: string;
  subject: string | null;
  total_marks: number;
  class_name: string;
  batch: string | null;
};

export function MarksEntry() {
  const qc = useQueryClient();
  const [examId, setExamId] = useState("");
  const [values, setValues] = useState<Record<string, { marks: string; remarks: string }>>({});

  const { data: exams } = useQuery({
    queryKey: ["marks-exams"],
    queryFn: async () =>
      ((await supabase.from("exams").select("*").order("exam_date", { ascending: false })).data ??
        []) as Exam[],
  });

  const exam = (exams ?? []).find((e) => e.id === examId);

  const { data: students, isLoading } = useQuery({
    queryKey: ["marks-students", exam?.class_name, exam?.batch],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, full_name, roll")
        .eq("class_name", exam!.class_name)
        .order("roll");
      if (exam!.batch) query = query.eq("batch", exam!.batch);
      const { data } = await query;
      return (data ?? []) as { id: string; full_name: string; roll: string | null }[];
    },
    enabled: !!exam,
  });

  const { data: existing } = useQuery({
    queryKey: ["marks-existing", examId],
    queryFn: async () =>
      (await supabase.from("results").select("student_id, marks, remarks").eq("exam_id", examId)).data ??
      [],
    enabled: !!examId,
  });

  useEffect(() => {
    const next: Record<string, { marks: string; remarks: string }> = {};
    for (const r of existing ?? [])
      next[r.student_id] = { marks: String(r.marks ?? ""), remarks: r.remarks ?? "" };
    setValues(next);
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      if (!exam) throw new Error("Select an exam first.");
      const rows = Object.entries(values)
        .filter(([, v]) => v.marks !== "")
        .map(([student_id, v]) => ({
          exam_id: exam.id,
          student_id,
          marks: Number(v.marks),
          grade: gradeFor(Number(v.marks), exam.total_marks),
          remarks: v.remarks || null,
        }));
      if (rows.length === 0) throw new Error("Enter at least one mark.");
      const { error } = await supabase.from("results").upsert(rows, { onConflict: "exam_id,student_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marks saved.");
      void qc.invalidateQueries({ queryKey: ["marks-existing"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <SectionTitle title="Enter Marks" subtitle="Grades are calculated automatically." />
      <div className="card-surface p-4">
        <Field label="Exam">
          <select className={inputClass} value={examId} onChange={(e) => setExamId(e.target.value)}>
            <option value="">Select exam</option>
            {(exams ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {e.class_name} · {e.subject ?? "General"}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {!exam ? (
        <Empty text="Pick an exam to enter marks." />
      ) : isLoading ? (
        <Loading />
      ) : (students ?? []).length === 0 ? (
        <Empty text="No students found for this exam's class." />
      ) : (
        <>
          <div className="space-y-2">
            {students!.map((s) => (
              <div key={s.id} className="card-surface p-3">
                <p className="font-semibold">
                  {s.full_name} <span className="text-xs text-muted-foreground">Roll {s.roll || "-"}</span>
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    className={inputClass}
                    type="number"
                    inputMode="numeric"
                    placeholder={`Marks / ${exam.total_marks}`}
                    value={values[s.id]?.marks ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        [s.id]: { marks: e.target.value, remarks: v[s.id]?.remarks ?? "" },
                      }))
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="Remarks"
                    value={values[s.id]?.remarks ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        [s.id]: { marks: v[s.id]?.marks ?? "", remarks: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="tap-target sticky bottom-4 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-pop disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : "Save marks"}
          </button>
        </>
      )}
    </div>
  );
}
