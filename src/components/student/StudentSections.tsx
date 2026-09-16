import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Download,
  FileText,
  Filter,
  Megaphone,
  PlayCircle,
  Search,
  Trophy,
  User,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DAYS, embedUrl, formatDate, gradeFor, pct, thumbFor } from "@/lib/academy";
import { Badge, Empty, Field, inputClass, Loading, Progress, SectionTitle, Sheet, StatCard } from "@/components/common";

const menu = [
  { section: "videos", label: "Class Videos", emoji: "🎥", icon: PlayCircle },
  { section: "materials", label: "Study Materials", emoji: "📚", icon: FileText },
  { section: "routine", label: "Routine", emoji: "📅", icon: CalendarDays },
  { section: "attendance", label: "Attendance", emoji: "✅", icon: CheckSquare },
  { section: "exams", label: "Exams", emoji: "📝", icon: ClipboardList },
  { section: "results", label: "Results", emoji: "🏆", icon: Trophy },
  { section: "homework", label: "Homework", emoji: "📖", icon: BookOpen },
  { section: "notices", label: "Notices", emoji: "📢", icon: Megaphone },
  { section: "fees", label: "Fees", emoji: "💰", icon: Wallet },
  { section: "profile", label: "My Profile", emoji: "👤", icon: User },
] as const;

export function StudentSections({ section }: { section: string }) {
  switch (section) {
    case "videos":
      return <Videos />;
    case "materials":
      return <Materials />;
    case "routine":
      return <Routine />;
    case "attendance":
      return <Attendance />;
    case "exams":
      return <Exams />;
    case "results":
      return <Results />;
    case "homework":
      return <Homework />;
    case "notices":
      return <Notices />;
    case "fees":
      return <Fees />;
    case "profile":
      return <ProfileSection />;
    default:
      return <StudentHome />;
  }
}

function StudentHome() {
  const { profile } = useAuth();
  const { data: notice } = useQuery({
    queryKey: ["student-latest-notice"],
    queryFn: async () =>
      (
        await supabase
          .from("notices")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
      ).data?.[0] ?? null,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">Welcome, {profile?.full_name ?? "Student"} 👋</h1>
        <p className="text-sm text-muted-foreground">Everything for your classes in one place.</p>
      </div>

      <div className="gradient-hero rounded-2xl p-4 text-primary-foreground shadow-card">
        <p className="text-base font-bold">{profile?.full_name}</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="opacity-80">Roll</p>
            <p className="truncate font-bold">{profile?.roll || "-"}</p>
          </div>
          <div>
            <p className="opacity-80">Class</p>
            <p className="truncate font-bold">{profile?.class_name || "-"}</p>
          </div>
          <div>
            <p className="opacity-80">Batch</p>
            <p className="truncate font-bold">{profile?.batch || "-"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {menu.map((m) => (
          <Link
            key={m.section}
            to="/app/$section"
            params={{ section: m.section }}
            className="card-surface flex min-h-[88px] flex-col justify-between p-3 active:scale-[0.98] transition-transform"
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-sm font-bold leading-tight">{m.label}</span>
          </Link>
        ))}
      </div>

      {notice ? (
        <div className="card-surface p-4">
          <SectionTitle title="Latest notice" />
          <p className="mt-2 font-bold">{notice.title}</p>
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{notice.body}</p>
          <Link
            to="/app/$section"
            params={{ section: "notices" }}
            className="mt-2 inline-block text-sm font-bold text-primary"
          >
            Read more
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Videos() {
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [batch, setBatch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [playing, setPlaying] = useState<{ title: string; url: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["student-videos"],
    queryFn: async () =>
      (await supabase.from("videos").select("*").order("class_date", { ascending: false })).data ?? [],
  });

  const subjects = useMemo(() => [...new Set((data ?? []).map((v) => v.subject).filter(Boolean))], [data]);
  const chapters = useMemo(() => [...new Set((data ?? []).map((v) => v.chapter).filter(Boolean))], [data]);
  const batches = useMemo(() => [...new Set((data ?? []).map((v) => v.batch).filter(Boolean))], [data]);

  const list = (data ?? []).filter(
    (v) =>
      (!search || v.title.toLowerCase().includes(search.toLowerCase())) &&
      (!subject || v.subject === subject) &&
      (!chapter || v.chapter === chapter) &&
      (!batch || v.batch === batch),
  );

  if (isLoading) return <Loading label="Loading class videos" />;

  return (
    <div className="space-y-3">
      <SectionTitle title="Class Videos" subtitle={profile?.class_name ?? undefined} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search video"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="tap-target shrink-0 rounded-xl border border-input px-3 text-sm font-semibold"
        >
          <Filter className="mr-1 inline size-4" /> Filter
        </button>
      </div>

      {list.length === 0 ? (
        <Empty text="Your teacher has not uploaded videos for these filters." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((v) => {
            const thumb = thumbFor(v.video_url, v.thumbnail_url);
            return (
              <article key={v.id} className="card-surface overflow-hidden">
                <div className="aspect-video w-full bg-muted">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={v.title}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground">
                      <PlayCircle className="size-10" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <h3 className="font-bold leading-tight">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.subject || "General"}</p>
                  {v.chapter ? <p className="text-sm text-muted-foreground">{v.chapter}</p> : null}
                  {v.teacher_name ? (
                    <p className="text-sm text-muted-foreground">👨‍🏫 {v.teacher_name}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{formatDate(v.class_date)}</p>
                  <button
                    onClick={() => setPlaying({ title: v.title, url: v.video_url })}
                    className="tap-target mt-2 w-full rounded-xl bg-primary font-bold text-primary-foreground"
                  >
                    Watch Video
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Sheet open={showFilters} onClose={() => setShowFilters(false)} title="Filter videos">
        <div className="space-y-3">
          <Field label="Subject">
            <select className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s!}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Chapter">
            <select className={inputClass} value={chapter} onChange={(e) => setChapter(e.target.value)}>
              <option value="">All chapters</option>
              {chapters.map((s) => (
                <option key={s} value={s!}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Batch">
            <select className={inputClass} value={batch} onChange={(e) => setBatch(e.target.value)}>
              <option value="">All batches</option>
              {batches.map((s) => (
                <option key={s} value={s!}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <button
            onClick={() => setShowFilters(false)}
            className="tap-target w-full rounded-xl bg-primary font-bold text-primary-foreground"
          >
            Show {list.length} videos
          </button>
        </div>
      </Sheet>

      <Sheet open={!!playing} onClose={() => setPlaying(null)} title={playing?.title ?? ""}>
        {playing ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-foreground">
            <iframe
              src={embedUrl(playing.url)}
              title={playing.title}
              allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="size-full"
            />
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

function Materials() {
  const { data, isLoading } = useQuery({
    queryKey: ["student-materials"],
    queryFn: async () =>
      (await supabase.from("materials").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  if (isLoading) return <Loading />;
  return (
    <div className="space-y-3">
      <SectionTitle title="Study Materials" />
      {(data ?? []).length === 0 ? (
        <Empty text="Materials will appear here once uploaded." />
      ) : (
        data!.map((m) => (
          <div key={m.id} className="card-surface p-4">
            <p className="font-bold">📄 {m.title}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {m.subject ? <Badge>{m.subject}</Badge> : null}
              <Badge tone="muted">{m.class_name}</Badge>
              {m.batch ? <Badge tone="muted">{m.batch}</Badge> : null}
            </div>
            {m.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
            ) : null}
            <a
              href={m.file_url}
              target="_blank"
              rel="noreferrer"
              className="tap-target mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground"
            >
              <Download className="size-4" /> VIEW / DOWNLOAD
            </a>
          </div>
        ))
      )}
    </div>
  );
}

function Routine() {
  const { data, isLoading } = useQuery({
    queryKey: ["student-routine"],
    queryFn: async () => (await supabase.from("routine").select("*").order("sort_order")).data ?? [],
  });
  if (isLoading) return <Loading />;
  const rows = data ?? [];
  return (
    <div className="space-y-3">
      <SectionTitle title="Class Routine" />
      {rows.length === 0 ? (
        <Empty text="Your routine has not been published yet." />
      ) : (
        DAYS.filter((d) => rows.some((r) => r.day_name === d)).map((day) => (
          <div key={day} className="card-surface p-4">
            <p className="text-base font-extrabold">{day}</p>
            <div className="mt-1 h-0.5 w-full rounded bg-primary/20" />
            <div className="mt-3 space-y-3">
              {rows
                .filter((r) => r.day_name === day)
                .map((r) => (
                  <div key={r.id} className="rounded-xl bg-muted/60 p-3">
                    <p className="font-bold">📚 {r.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      ⏰ {r.start_time} - {r.end_time}
                    </p>
                    {r.teacher_name ? (
                      <p className="text-sm text-muted-foreground">👨‍🏫 {r.teacher_name}</p>
                    ) : null}
                    {r.room ? <p className="text-sm text-muted-foreground">🏫 {r.room}</p> : null}
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Attendance() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["student-attendance", user?.id],
    queryFn: async () =>
      (
        await supabase
          .from("attendance")
          .select("*")
          .eq("student_id", user!.id)
          .order("attend_date", { ascending: false })
      ).data ?? [],
    enabled: !!user,
  });
  if (isLoading) return <Loading />;
  const rows = data ?? [];
  const present = rows.filter((r) => r.status === "present").length;
  const percentage = pct(present, rows.length);
  return (
    <div className="space-y-3">
      <SectionTitle title="Attendance" />
      <div className="card-surface p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-extrabold">{rows.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Present</p>
            <p className="text-xl font-extrabold text-success">{present}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Absent</p>
            <p className="text-xl font-extrabold text-destructive">{rows.length - present}</p>
          </div>
        </div>
        <p className="mt-4 text-center text-3xl font-extrabold text-primary">{percentage}%</p>
        <div className="mt-2">
          <Progress value={percentage} />
        </div>
      </div>
      {rows.length === 0 ? (
        <Empty text="Attendance will show after your first class." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="card-surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{formatDate(r.attend_date)}</p>
                <p className="truncate text-sm text-muted-foreground">{r.subject || "Class"}</p>
              </div>
              <Badge tone={r.status === "present" ? "success" : "destructive"}>
                {r.status === "present" ? "Present" : "Absent"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Exams() {
  const { data, isLoading } = useQuery({
    queryKey: ["student-exams"],
    queryFn: async () =>
      (await supabase.from("exams").select("*").order("exam_date", { ascending: false })).data ?? [],
  });
  if (isLoading) return <Loading />;
  return (
    <div className="space-y-3">
      <SectionTitle title="Exams" />
      {(data ?? []).length === 0 ? (
        <Empty text="No exam has been scheduled yet." />
      ) : (
        data!.map((e) => (
          <div key={e.id} className="card-surface p-4">
            <p className="font-bold">📝 {e.name}</p>
            <p className="text-sm text-muted-foreground">{e.subject}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="muted">{formatDate(e.exam_date)}</Badge>
              <Badge>Total {e.total_marks}</Badge>
            </div>
            {e.syllabus ? <p className="mt-2 text-sm text-muted-foreground">{e.syllabus}</p> : null}
          </div>
        ))
      )}
    </div>
  );
}

function Results() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["student-results", user?.id],
    queryFn: async () =>
      (
        await supabase
          .from("results")
          .select("*, exams(name, subject, total_marks, exam_date)")
          .eq("student_id", user!.id)
      ).data ?? [],
    enabled: !!user,
  });
  if (isLoading) return <Loading />;
  const rows = (data ?? []) as Array<{
    id: string;
    marks: number;
    grade: string | null;
    remarks: string | null;
    exams: { name: string; subject: string | null; total_marks: number; exam_date: string | null } | null;
  }>;
  const totalMarks = rows.reduce((sum, r) => sum + Number(r.marks), 0);
  const totalPossible = rows.reduce((sum, r) => sum + (r.exams?.total_marks ?? 0), 0);
  const percentage = pct(totalMarks, totalPossible);

  return (
    <div className="space-y-3">
      <SectionTitle title="My Results" />
      {rows.length === 0 ? (
        <Empty text="Results appear here after your exams are marked." />
      ) : (
        <>
          {rows.map((r) => (
            <div key={r.id} className="card-surface p-4">
              <p className="font-bold">{r.exams?.name}</p>
              <p className="text-sm text-muted-foreground">{r.exams?.subject}</p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Marks</p>
                  <p className="font-extrabold">{r.marks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-extrabold">{r.exams?.total_marks}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                  <p className="font-extrabold text-primary">
                    {r.grade || gradeFor(Number(r.marks), r.exams?.total_marks ?? 0)}
                  </p>
                </div>
              </div>
              {r.remarks ? (
                <p className="mt-2 text-sm text-muted-foreground">Remarks: {r.remarks}</p>
              ) : null}
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Total marks" value={`${totalMarks}/${totalPossible}`} />
            <StatCard label="Percentage" value={`${percentage}%`} tone="success" />
            <StatCard label="Overall grade" value={gradeFor(totalMarks, totalPossible)} />
          </div>
        </>
      )}
    </div>
  );
}

function Homework() {
  const { data, isLoading } = useQuery({
    queryKey: ["student-homework"],
    queryFn: async () =>
      (await supabase.from("homework").select("*").order("due_date", { ascending: true })).data ?? [],
  });
  if (isLoading) return <Loading />;
  return (
    <div className="space-y-3">
      <SectionTitle title="Homework" />
      {(data ?? []).length === 0 ? (
        <Empty text="No homework right now — enjoy!" />
      ) : (
        data!.map((h) => (
          <div key={h.id} className="card-surface p-4">
            <p className="font-bold">📖 {h.title}</p>
            <p className="text-sm text-muted-foreground">{h.subject}</p>
            {h.description ? <p className="mt-2 text-sm">{h.description}</p> : null}
            <div className="mt-2">
              <Badge tone="warning">Due {formatDate(h.due_date)}</Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Notices() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["student-notices"],
    queryFn: async () =>
      (await supabase.from("notices").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  if (isLoading) return <Loading />;
  return (
    <div className="space-y-3">
      <SectionTitle title="Notices" />
      {(data ?? []).length === 0 ? (
        <Empty text="No notice published yet." />
      ) : (
        data!.map((n) => (
          <article key={n.id} className="card-surface p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 flex-1 font-bold">📢 {n.title}</h3>
              {n.important ? <Badge tone="destructive">Important</Badge> : null}
            </div>
            <p className={openId === n.id ? "mt-2 whitespace-pre-line text-sm" : "mt-2 line-clamp-2 text-sm"}>
              {n.body}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{formatDate(n.notice_date)}</p>
            <button
              onClick={() => setOpenId(openId === n.id ? null : n.id)}
              className="mt-1 text-sm font-bold text-primary"
            >
              {openId === n.id ? "Show less" : "Read More"}
            </button>
          </article>
        ))
      )}
    </div>
  );
}

function Fees() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["student-fees", user?.id],
    queryFn: async () =>
      (
        await supabase
          .from("fees")
          .select("*")
          .eq("student_id", user!.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
    enabled: !!user,
  });
  if (isLoading) return <Loading />;
  const rows = data ?? [];
  const due = rows.filter((r) => !r.paid).reduce((s, r) => s + Number(r.amount), 0);
  const paid = rows.filter((r) => r.paid).reduce((s, r) => s + Number(r.amount), 0);
  return (
    <div className="space-y-3">
      <SectionTitle title="My Fees" />
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Paid" value={paid} tone="success" />
        <StatCard label="Due" value={due} tone="destructive" />
      </div>
      {rows.length === 0 ? (
        <Empty text="No fee record yet." />
      ) : (
        rows.map((f) => (
          <div key={f.id} className="card-surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-bold">💰 {f.month_label}</p>
              <p className="text-sm text-muted-foreground">Amount: {f.amount}</p>
              {f.note ? <p className="truncate text-xs text-muted-foreground">{f.note}</p> : null}
            </div>
            <Badge tone={f.paid ? "success" : "destructive"}>{f.paid ? "Paid" : "Due"}</Badge>
          </div>
        ))
      )}
    </div>
  );
}

function ProfileSection() {
  const { profile, refresh } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated.");
      setPassword("");
      void refresh();
    }
  }

  const rows: Array<[string, string]> = [
    ["Name", profile?.full_name ?? "-"],
    ["Roll", profile?.roll || "-"],
    ["Class", profile?.class_name || "-"],
    ["Batch", profile?.batch || "-"],
    ["Phone", profile?.phone || "-"],
    ["Guardian", profile?.guardian_name || "-"],
    ["Guardian phone", profile?.guardian_phone || "-"],
    ["Address", profile?.address || "-"],
  ];

  return (
    <div className="space-y-3">
      <SectionTitle title="My Profile" />
      <div className="card-surface divide-y divide-border">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-2 p-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="break-words font-semibold">{value}</span>
          </div>
        ))}
      </div>
      <form onSubmit={changePassword} className="card-surface space-y-3 p-4">
        <p className="font-bold">Change password</p>
        <Field label="New password">
          <input
            type="password"
            className={inputClass}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
