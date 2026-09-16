import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Facebook,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PlayCircle,
  Star,
  Youtube,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings, formatDate } from "@/lib/academy";
import { Badge, Field, inputClass, Loading } from "@/components/common";
import heroImage from "@/assets/hero-students.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GOOGLY ACADEMY — Coaching Center for Class 6-10" },
      {
        name: "description",
        content:
          "GOOGLY ACADEMY offers recorded class videos, study materials, routines, exams and results for Class 6-10 students. Register today.",
      },
      { property: "og:title", content: "GOOGLY ACADEMY — Coaching Center for Class 6-10" },
      {
        property: "og:description",
        content:
          "Recorded class videos, study materials, routine, attendance, exams and results in one simple student app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: settings, isLoading } = useSettings();
  const academy = settings?.academy_name ?? "GOOGLY ACADEMY";

  const { data: courses } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => (await supabase.from("courses").select("*").order("sort_order")).data ?? [],
  });
  const { data: teachers } = useQuery({
    queryKey: ["public-teachers"],
    queryFn: async () =>
      (await supabase.from("teachers").select("*").order("sort_order")).data ?? [],
  });
  const { data: notices } = useQuery({
    queryKey: ["public-notices"],
    queryFn: async () =>
      (
        await supabase
          .from("notices")
          .select("*")
          .eq("public_visible", true)
          .order("created_at", { ascending: false })
          .limit(4)
      ).data ?? [],
  });
  const { data: reviews } = useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () =>
      (
        await supabase
          .from("reviews")
          .select("*")
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(6)
      ).data ?? [],
  });

  if (isLoading) return <Loading label="Loading academy" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="" className="size-9 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="size-5" />
              </span>
            )}
            <span className="truncate text-sm font-extrabold sm:text-base">{academy}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/login"
              className="tap-target inline-flex items-center rounded-xl border border-input px-3 text-sm font-semibold hover:bg-muted"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="tap-target inline-flex items-center rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="gradient-hero text-primary-foreground">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:py-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge tone="muted">Admission open</Badge>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              {settings?.hero_title ?? `Learn better with ${academy}`}
            </h1>
            <p className="mt-3 text-base opacity-95">{settings?.hero_subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/register"
                className="tap-target inline-flex items-center rounded-xl bg-card px-5 font-bold text-primary shadow-card"
              >
                REGISTER NOW
              </Link>
              <Link
                to="/login"
                className="tap-target inline-flex items-center rounded-xl border border-primary-foreground/50 px-5 font-semibold"
              >
                Student Login
              </Link>
            </div>
            <p className="mt-4 text-sm opacity-90">CEO: {settings?.ceo_name ?? "SOMRAT"}</p>
          </div>
          <img
            src={settings?.hero_image_url || heroImage}
            alt={`Students learning at ${academy}`}
            width={1280}
            height={960}
            className="w-full rounded-3xl object-cover shadow-pop"
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: PlayCircle, title: "Class Videos", text: "Miss a class? Watch the recording any time." },
            { icon: BookOpen, title: "Study Materials", text: "Notes, sheets and PDFs for every chapter." },
            { icon: CheckCircle2, title: "Exams & Results", text: "Regular exams with instant result updates." },
          ].map((f) => (
            <div key={f.title} className="card-surface p-4">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-2 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-5xl px-4 pb-8">
        <div className="card-surface p-5">
          <h2 className="text-xl font-extrabold">About {academy}</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {settings?.about_text}
          </p>
        </div>
      </section>

      {/* COURSES */}
      {settings?.show_courses && (courses?.length ?? 0) > 0 ? (
        <section className="mx-auto max-w-5xl px-4 pb-8">
          <h2 className="text-xl font-extrabold">Our Courses</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses!.map((c) => (
              <div key={c.id} className="card-surface p-4">
                <h3 className="font-bold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.price ? <Badge>{c.price}</Badge> : null}
                  {c.duration ? <Badge tone="muted">{c.duration}</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* TEACHERS */}
      {settings?.show_teachers && (teachers?.length ?? 0) > 0 ? (
        <section className="mx-auto max-w-5xl px-4 pb-8">
          <h2 className="text-xl font-extrabold">Our Teachers</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teachers!.map((t) => (
              <div key={t.id} className="card-surface flex items-center gap-3 p-4">
                {t.photo_url ? (
                  <img
                    src={t.photo_url}
                    alt={t.name}
                    loading="lazy"
                    className="size-14 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-lg font-bold text-accent-foreground">
                    {t.name.slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold">{t.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{t.subject}</p>
                  {t.bio ? <p className="mt-1 text-xs text-muted-foreground">{t.bio}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* NOTICES */}
      {settings?.show_notices && (notices?.length ?? 0) > 0 ? (
        <section className="mx-auto max-w-5xl px-4 pb-8">
          <h2 className="text-xl font-extrabold">Notice Board</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {notices!.map((n) => (
              <article key={n.id} className="card-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg">📢</span>
                  <h3 className="min-w-0 flex-1 font-bold">{n.title}</h3>
                  {n.important ? <Badge tone="destructive">Important</Badge> : null}
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(n.notice_date)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* REVIEWS */}
      {settings?.show_reviews ? (
        <section className="mx-auto max-w-5xl px-4 pb-8">
          <h2 className="text-xl font-extrabold">Student Reviews</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(reviews ?? []).map((r) => (
              <div key={r.id} className="card-surface p-4">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-2 text-sm">{r.comment}</p>
                <p className="mt-2 text-xs font-semibold text-muted-foreground">— {r.student_name}</p>
              </div>
            ))}
          </div>
          <ReviewForm />
        </section>
      ) : null}

      {/* CONTACT + FOOTER */}
      <footer className="border-t border-border bg-secondary">
        <div className="mx-auto grid max-w-5xl gap-4 px-4 py-8 sm:grid-cols-2">
          <div>
            <p className="text-base font-extrabold">{academy}</p>
            <p className="mt-1 text-sm text-muted-foreground">CEO: {settings?.ceo_name}</p>
            <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {settings?.contact_phone ? (
                <p className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0" /> {settings.contact_phone}
                </p>
              ) : null}
              {settings?.contact_email ? (
                <p className="flex items-center gap-2 break-all">
                  <Mail className="size-4 shrink-0" /> {settings.contact_email}
                </p>
              ) : null}
              {settings?.address ? (
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" /> {settings.address}
                </p>
              ) : null}
            </div>
            <div className="mt-3 flex gap-2">
              {settings?.facebook_url ? (
                <a
                  href={settings.facebook_url}
                  aria-label="Facebook"
                  className="tap-target grid place-items-center rounded-xl bg-card text-primary shadow-card"
                >
                  <Facebook className="size-5" />
                </a>
              ) : null}
              {settings?.youtube_url ? (
                <a
                  href={settings.youtube_url}
                  aria-label="YouTube"
                  className="tap-target grid place-items-center rounded-xl bg-card text-primary shadow-card"
                >
                  <Youtube className="size-5" />
                </a>
              ) : null}
              {settings?.whatsapp_url ? (
                <a
                  href={settings.whatsapp_url}
                  aria-label="WhatsApp"
                  className="tap-target grid place-items-center rounded-xl bg-card text-primary shadow-card"
                >
                  <MessageCircle className="size-5" />
                </a>
              ) : null}
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-bold">Quick links</p>
            <Link to="/register" className="block text-primary">
              Student Registration
            </Link>
            <Link to="/login" className="block text-primary">
              Student Login
            </Link>
            <Link to="/staff-login" className="block text-primary">
              Teacher / Admin Login
            </Link>
          </div>
        </div>
        <p className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {academy}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

function ReviewForm() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    const { error } = await supabase
      .from("reviews")
      .insert({ student_name: name, rating, comment, approved: false });
    setState(error ? "error" : "done");
    if (!error) {
      setName("");
      setComment("");
    }
  }

  if (state === "done")
    return (
      <div className="card-surface mt-4 p-4 text-sm font-semibold text-success">
        Thank you! Your review was sent for approval.
      </div>
    );

  return (
    <form onSubmit={submit} className="card-surface mt-4 space-y-3 p-4">
      <p className="font-bold">Leave a review</p>
      <Field label="Your name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Rating">
        <select
          className={inputClass}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r} star{r > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Your review">
        <textarea
          className={inputClass}
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
      </Field>
      {state === "error" ? (
        <p className="text-sm font-semibold text-destructive">Could not send. Please try again.</p>
      ) : null}
      <button
        type="submit"
        disabled={state === "saving"}
        className="tap-target w-full rounded-xl bg-primary px-4 font-bold text-primary-foreground disabled:opacity-60"
      >
        {state === "saving" ? "Sending…" : "Send review"}
      </button>
    </form>
  );
}
