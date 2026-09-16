import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Folder,
  Home,
  Megaphone,
  PencilRuler,
  UserCog,
  Users,
  Video,
} from "lucide-react";
import { RequireRole } from "@/components/Guard";
import { PanelShell, type NavItem } from "@/components/PanelShell";
import { PanelDashboard } from "@/components/panel/PanelDashboard";
import { ResourceManager } from "@/components/ResourceManager";
import { StudentsManager } from "@/components/panel/StudentsManager";
import { AttendanceEntry } from "@/components/panel/AttendanceEntry";
import { MarksEntry } from "@/components/panel/MarksEntry";
import { AccountSettings } from "@/components/panel/AccountSettings";
import { Empty } from "@/components/common";
import {
  EXAM_FIELDS,
  HOMEWORK_FIELDS,
  MATERIAL_FIELDS,
  NOTICE_FIELDS,
  ROUTINE_FIELDS,
  VIDEO_FIELDS,
} from "./admin.$section";

export const Route = createFileRoute("/teacher/$section")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Teacher Panel | GOOGLY ACADEMY" },
      { name: "description", content: "Take attendance, upload classes and publish results." },
      { property: "og:title", content: "Teacher Panel | GOOGLY ACADEMY" },
      { property: "og:description", content: "Teacher tools for GOOGLY ACADEMY classes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherPage,
});

const TEACHER_NAV: NavItem[] = [
  { section: "dashboard", label: "Dashboard", icon: Home },
  { section: "attendance", label: "Attendance", icon: ClipboardCheck },
  { section: "videos", label: "Class Videos", icon: Video },
  { section: "materials", label: "Materials", icon: Folder },
  { section: "homework", label: "Homework", icon: BookOpen },
  { section: "exams", label: "Exams", icon: PencilRuler },
  { section: "marks", label: "Enter Marks", icon: FileText },
  { section: "routine", label: "Routine", icon: CalendarDays },
  { section: "notices", label: "Notices", icon: Megaphone },
  { section: "students", label: "My Students", icon: Users },
  { section: "account", label: "My Account", icon: UserCog },
];

function TeacherPage() {
  const { section } = Route.useParams();
  return (
    <RequireRole roles={["teacher", "super_admin"]}>
      <PanelShell base="/teacher" title="Teacher Panel" section={section} items={TEACHER_NAV}>
        <TeacherSection section={section} />
      </PanelShell>
    </RequireRole>
  );
}

function TeacherSection({ section }: { section: string }) {
  switch (section) {
    case "dashboard":
      return <PanelDashboard base="/teacher" items={TEACHER_NAV} title="Teacher Dashboard" />;
    case "attendance":
      return <AttendanceEntry />;
    case "videos":
      return (
        <ResourceManager
          table="videos"
          title="Class Videos"
          fields={VIDEO_FIELDS}
          cardTitle={(r) => String(r["title"])}
          cardMeta={(r) => [r["class_name"] as string, r["batch"] as string, r["subject"] as string]}
        />
      );
    case "materials":
      return (
        <ResourceManager
          table="materials"
          title="Materials"
          fields={MATERIAL_FIELDS}
          cardTitle={(r) => String(r["title"])}
          cardMeta={(r) => [r["class_name"] as string, r["batch"] as string, r["subject"] as string]}
        />
      );
    case "homework":
      return (
        <ResourceManager
          table="homework"
          title="Homework"
          fields={HOMEWORK_FIELDS}
          cardTitle={(r) => String(r["title"])}
          cardMeta={(r) => [
            r["class_name"] as string,
            r["batch"] as string,
            r["due_date"] ? `Due ${r["due_date"]}` : null,
          ]}
        />
      );
    case "exams":
      return (
        <ResourceManager
          table="exams"
          title="Exams"
          fields={EXAM_FIELDS}
          orderBy="exam_date"
          cardTitle={(r) => String(r["name"])}
          cardMeta={(r) => [r["class_name"] as string, r["batch"] as string, `Total ${r["total_marks"]}`]}
        />
      );
    case "marks":
      return <MarksEntry />;
    case "routine":
      return (
        <ResourceManager
          table="routine"
          title="Class Routine"
          fields={ROUTINE_FIELDS}
          orderBy="sort_order"
          ascending
          cardTitle={(r) => `${r["day_name"]} · ${r["subject"]}`}
          cardMeta={(r) => [
            `${r["start_time"] ?? ""} - ${r["end_time"] ?? ""}`,
            r["class_name"] as string,
            r["batch"] as string,
          ]}
        />
      );
    case "notices":
      return (
        <ResourceManager
          table="notices"
          title="Notices"
          fields={NOTICE_FIELDS}
          orderBy="notice_date"
          cardTitle={(r) => String(r["title"])}
          cardMeta={(r) => [(r["class_name"] as string) || "All classes", r["important"] ? "Important" : null]}
        />
      );
    case "students":
      return <StudentsManager canManage={false} />;
    case "account":
      return <AccountSettings />;
    default:
      return <Empty text="Choose a section from the menu." />;
  }
}
