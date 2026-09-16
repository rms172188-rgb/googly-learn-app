import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/academy";
import { Field, inputClass, Loading, SectionTitle } from "@/components/common";

type Settings = Record<string, unknown>;

const TEXT_FIELDS: { name: string; label: string; hint?: string; area?: boolean }[] = [
  { name: "academy_name", label: "Academy name" },
  { name: "ceo_name", label: "CEO name" },
  { name: "logo_url", label: "Logo image link" },
  { name: "favicon_url", label: "Browser icon link" },
  { name: "hero_title", label: "Homepage headline" },
  { name: "hero_subtitle", label: "Homepage sub-headline", area: true },
  { name: "hero_image_url", label: "Homepage image link" },
  { name: "about_text", label: "About the academy", area: true },
  { name: "contact_phone", label: "Phone" },
  { name: "contact_email", label: "Email" },
  { name: "address", label: "Address", area: true },
  { name: "facebook_url", label: "Facebook link" },
  { name: "youtube_url", label: "YouTube link" },
  { name: "whatsapp_url", label: "WhatsApp link" },
];

const TOGGLES: { name: string; label: string }[] = [
  { name: "show_courses", label: "Show courses section" },
  { name: "show_teachers", label: "Show teachers section" },
  { name: "show_reviews", label: "Show student reviews" },
  { name: "show_notices", label: "Show notices on homepage" },
];

export function WebsiteSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useSettings();
  const [form, setForm] = useState<Settings>({});

  useEffect(() => {
    if (data) setForm({ ...(data as Settings) });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Settings = {};
      for (const f of TEXT_FIELDS) payload[f.name] = (form[f.name] as string) || null;
      for (const t of TOGGLES) payload[t.name] = Boolean(form[t.name]);
      payload["primary_color"] = (form["primary_color"] as string) || null;
      payload["updated_at"] = new Date().toISOString();
      const { error } = await supabase.from("site_settings").update(payload).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Website updated.");
      void qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      <SectionTitle title="Website" subtitle="Changes appear on the public site right away." />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-4"
      >
        <div className="card-surface grid gap-3 p-4 sm:grid-cols-2">
          {TEXT_FIELDS.map((f) => (
            <div key={f.name} className={f.area ? "sm:col-span-2" : undefined}>
              <Field label={f.label} hint={f.hint}>
                {f.area ? (
                  <textarea
                    className={inputClass}
                    rows={3}
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                  />
                ) : (
                  <input
                    className={inputClass}
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                  />
                )}
              </Field>
            </div>
          ))}
        </div>

        <div className="card-surface space-y-3 p-4">
          <p className="font-bold">Homepage sections</p>
          {TOGGLES.map((t) => (
            <label key={t.name} className="flex items-center justify-between gap-3 py-1">
              <span className="text-sm font-medium">{t.label}</span>
              <input
                type="checkbox"
                className="size-6 accent-[var(--color-primary)]"
                checked={Boolean(form[t.name])}
                onChange={(e) => setForm((s) => ({ ...s, [t.name]: e.target.checked }))}
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={save.isPending}
          className="tap-target w-full rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save website settings"}
        </button>
      </form>
    </div>
  );
}
