import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Folder,
  GraduationCap,
  Home,
  Layers,
  LayoutGrid,
  Megaphone,
  MessageSquareQuote,
  PencilRuler,
  Settings,
  Star,
  UserCog,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { RequireRole } from "@/components/Guard";
import { PanelShell, type NavItem } from "@/components/PanelShell";
import { PanelDashboard } from "@/components/panel/PanelDashboard";
import { ResourceManager, type FieldDef } from "@/components/ResourceManager";
import { StudentsManager } from "@/components/panel/StudentsManager";
import { TeachersManager } from "@/components/panel/TeachersManager";
import { AttendanceEntry } from "@/components/panel/AttendanceEntry";
import { MarksEntry } from "@/components/panel/MarksEntry";
import { FeesManager } from "@/components/panel/FeesManager";
import { WebsiteSettings } from "@/components/panel/WebsiteSettings";
import { AccountSettings } from "@/components/panel/AccountSettings";
import { DAYS } from "@/lib/academy";
import { Empty } from "@/components/common";

export const Route = createFileRoute("/admin/$section")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Panel | GOOGLY ACADEMY" },
      { name: "description", content: "Manage students, classes, results and the academy website." },
      { property: "og:title", content: "Admin Panel | GOOGLY ACADEMY" },
      { property: "og:description", content: "Full management panel for GOOGLY ACADEMY." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

export const ADMIN_NAV: NavItem[] = [
  { section: "dashboard", label: "Dashboard", icon: Home },
  { section: "students", label: "Students", icon: Users },
  { section: "teachers", label: "Teachers", icon: GraduationCap },
  { section: "classes", label: "Classes", icon: Layers },
  { section: "batches", label: "Batches", icon: LayoutGrid },
  { section: "videos", label: "Class Videos", icon: Video },
  { section: "materials", label: "Materials", icon: Folder },
  { section: "routine", label: "Routine", icon: CalendarDays },
  { section: "attendance", label: "Attendance", icon: ClipboardCheck },
  { section: "exams", label: "Exams", icon: PencilRuler },
  { section: "marks", label: "Enter Marks", icon: FileText },
  { section: "homework", label: "Homework", icon: BookOpen },
  { section: "notices", label: "Notices", icon: Megaphone },
  { section: "fees", label: "Fees", icon: Wallet },
  { section: "reviews", label: "Reviews", icon: Star },
  { section: "courses", label: "Courses", icon: MessageSquareQuote },
  { section: "website", label: "Website", icon: Settings },
  { section: "account", label: "My Account", icon: UserCog },
];

const dayOptions = DAYS.map((d) => ({ value: d, label: d }));

export const VIDEO_FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true },
  { name: "subject", label: "Subject" },
  { name: "chapter", label: "Chapter" },
  { name: "class_name", label: "Class", required: true },
  { name: "batch", label: "Batch" },
  { name: "teacher_name", label: "Teacher" },
  { name: "video_url", label: "Video link (YouTube)", required: true },
  { name: "thumbnail_url", label: "Thumbnail link" },
  { name: "class_date", label: "Class date", type: "date" },
];

export const MATERIAL_FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true },
  { name: "subject", label: "Subject" },
  { name: "class_name", label: "Class", required: true },
  { name: "batch", label: "Batch" },
  { name: "file_url", label: "File link (PDF/Drive)", required: true },
  { name: "description", label: "Description", type: "textarea" },
];

export const ROUTINE_FIELDS: FieldDef[] = [
  { name: "day_name", label: "Day", type: "select", options: dayOptions, required: true },
  { name: "subject", label: "Subject", required: true },
  { name: "start_time", label: "Start time", placeholder: "09:00 AM" },
  { name: "end_time", label: "End time", placeholder: "10:00 AM" },
  { name: "teacher_name", label: "Teacher" },
  { name: "room", label: "Room" },
  { name: "class_name", label: "Class", required: true },
  { name: "batch", label: "Batch" },
  { name: "sort_order", label: "Order", type: "number" },
];

export const EXAM_FIELDS: FieldDef[] = [
  { name: "name", label: "Exam name", required: true },
  { name: "subject", label: "Subject" },
  { name: "exam_date", label: "Date", type: "date" },
  { name: "total_marks", label: "Total marks", type: "number", required: true },
  { name: "class_name", label: "Class", required: true },
  { name: "batch", label: "Batch" },
  { name: "syllabus", label: "Syllabus", type: "textarea" },
];

export const HOMEWORK_FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true },
  { name: "subject", label: "Subject" },
  { name: "due_date", label: "Due date", type: "date" },
  { name: "class_name", label: "Class", required: true },
  { name: "batch", label: "Batch" },
  { name: "description", label: "Details", type: "textarea" },
];

export const NOTICE_FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true },
  { name: "body", label: "Notice text", type: "textarea", required: true },
  { name: "notice_date", label: "Date", type: "date" },
  { name: "class_name", label: "Class (blank = everyone)" },
  { name: "important", label: "Mark as important", type: "checkbox" },
  { name: "public_visible", label: "Show on public website", type: "checkbox" },
];

function AdminPage() {
  const { section } = Route.useParams();
  return (
    <RequireRole roles={["super_admin"]}>
      <PanelShell base="/admin" title="Admin Panel" section={section} items={ADMIN_NAV}>
        <AdminSection section={section} />
      </PanelShell>
    </RequireRole>
  );
}

function AdminSection({ section }: { section: string }) {
  switch (section) {
    case "dashboard":
      return <PanelDashboard base="/admin" items={ADMIN_NAV} title="Admin Dashboard" />;
    case "students":
      return <StudentsManager canManage />;
    case "teachers":
      return <TeachersManager />;
    case "classes":
      return (
        <ResourceManager
          table="classes"
          title="Classes"
          fields={[{ name: "name", label: "Class name", required: true }]}
          orderBy="name"
          ascending
          cardTitle={(r) => String(r["name"])}
          cardMeta={() => []}
        />
      );
    case "batches":
      return (
        <ResourceManager
          table="batches"
          title="Batches"
          fields={[
            { name: "name", label: "Batch name", required: true },
            { name: "class_name", label: "Class", required: true },
          ]}
          orderBy="class_name"
          ascending
          cardTitle={(r) => String(r["name"])}
          cardMeta={(r) => [String(r["class_name"] ?? "")]}
        />
      );
    case "videos":
      return (
        <ResourceManager
          table="videos"
          title="Class Videos"
          fields={VIDEO_FIELDS}
          cardTitle={(r) => String(r["title"])}
          cardMeta={(r) => [
            r["class_name"] as string,
            r["batch"] as string,
            r["subject"] as string,
            r["chapter"] as string,
          ]}
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
            r["teacher_name"] as string,
          ]}
        />
      );
    case "attendance":
      return <AttendanceEntry />;
    case "exams":
      return (
        <ResourceManager
          table="exams"
          title="Exams"
          fields={EXAM_FIELDS}
          orderBy="exam_date"
          cardTitle={(r) => String(r["name"])}
          cardMeta={(r) => [
            r["class_name"] as string,
            r["batch"] as string,
            r["subject"] as string,
            `Total ${r["total_marks"]}`,
          ]}
        />
      );
    case "marks":
      return <MarksEntry />;
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
    case "notices":
      return (
        <ResourceManager
          table="notices"
          title="Notices"
          fields={NOTICE_FIELDS}
          orderBy="notice_date"
          cardTitle={(r) => String(r["title"])}
          cardMeta={(r) => [
            (r["class_name"] as string) || "All classes",
            r["important"] ? "Important" : null,
            r["public_visible"] ? "On website" : null,
          ]}
        />
      );
    case "fees":
      return <FeesManager />;
    case "reviews":
      return (
        <ResourceManager
          table="reviews"
          title="Student Reviews"
          subtitle="Approve a review to show it on the website"
          fields={[
            { name: "student_name", label: "Name", required: true },
            { name: "rating", label: "Rating (1-5)", type: "number", required: true },
            { name: "comment", label: "Comment", type: "textarea", required: true },
            { name: "approved", label: "Approved for website", type: "checkbox" },
          ]}
          cardTitle={(r) => `${r["student_name"]} · ${r["rating"]}★`}
          cardMeta={(r) => [r["approved"] ? "Approved" : "Waiting", r["comment"] as string]}
        />
      );
    case "courses":
      return (
        <ResourceManager
          table="courses"
          title="Courses"
          fields={[
            { name: "title", label: "Course title", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "price", label: "Fee" },
            { name: "duration", label: "Duration" },
            { name: "sort_order", label: "Order", type: "number" },
          ]}
          orderBy="sort_order"
          ascending
          cardTitle={(r) => String(r["title"])}
          cardMeta={(r) => [r["price"] as string, r["duration"] as string]}
        />
      );
    case "website":
      return <WebsiteSettings />;
    case "account":
      return <AccountSettings />;
    default:
      return <Empty text="Choose a section from the menu." />;
  }
}
