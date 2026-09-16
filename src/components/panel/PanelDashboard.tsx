import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Loading, SectionTitle, StatCard } from "@/components/common";
import { formatDate } from "@/lib/academy";
import type { NavItem } from "@/components/PanelShell";

async function countOf(table: string) {
  const { count } = await supabase.from(table as never).select("id", { count: "exact", head: true });
  return count ?? 0;
}

export function PanelDashboard({
  base,
  items,
  title,
}: {
  base: "/admin" | "/teacher";
  items: NavItem[];
  title: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["panel-dashboard", base],
    queryFn: async () => {
      const [students, videos, notices, exams] = await Promise.all([
        countOf("profiles"),
        countOf("videos"),
        countOf("notices"),
        countOf("exams"),
      ]);
      const today = new Date().toISOString().slice(0, 10);
      const { count: presentToday } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("attend_date", today)
        .eq("status", "present");
      return { students, videos, notices, exams, presentToday: presentToday ?? 0, today };
    },
  });

  if (isLoading || !data) return <Loading />;

  return (
    <div className="space-y-4">
      <SectionTitle title={title} subtitle={formatDate(data.today)} />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <StatCard label="Students" value={data.students} />
        <StatCard label="Present today" value={data.presentToday} tone="success" />
        <StatCard label="Class videos" value={data.videos} />
        <StatCard label="Exams" value={data.exams} />
        <StatCard label="Notices" value={data.notices} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items
          .filter((i) => i.section !== "dashboard")
          .map((i) => (
            <Link
              key={i.section}
              to={`${base}/$section`}
              params={{ section: i.section }}
              className="card-surface tap-target flex flex-col items-center justify-center gap-2 p-4 text-center"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                <i.icon className="size-5" />
              </span>
              <span className="text-xs font-bold leading-tight">{i.label}</span>
            </Link>
          ))}
      </div>
    </div>
  );
}
