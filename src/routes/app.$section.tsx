import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/components/Guard";
import { StudentShell } from "@/components/StudentShell";
import { StudentSections } from "@/components/student/StudentSections";

export const Route = createFileRoute("/app/$section")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student Portal — GOOGLY ACADEMY" },
      {
        name: "description",
        content: "GOOGLY ACADEMY student portal: class videos, routine, attendance, exams, results, homework and fees.",
      },
      { property: "og:title", content: "Student Portal — GOOGLY ACADEMY" },
      { property: "og:description", content: "Your classes, routine, results and fees in one app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentPortal,
});

function StudentPortal() {
  const { section } = Route.useParams();
  return (
    <RequireRole roles={["student"]}>
      <StudentShell section={section}>
        <StudentSections section={section} />
      </StudentShell>
    </RequireRole>
  );
}
