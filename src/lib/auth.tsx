import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "super_admin" | "teacher" | "student";

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  phone: string | null;
  roll: string | null;
  class_name: string | null;
  batch: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  address: string | null;
  photo_url: string | null;
  subject: string | null;
  active: boolean;
};

/** Usernames are derived from the person's name so students can log in with a name + password. */
export function normalizeUsername(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, "")
    .replace(/\s+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

export const STUDENT_DOMAIN = "student.googly.academy";
export const TEACHER_DOMAIN = "teacher.googly.academy";
export const ADMIN_DOMAIN = "googly.academy";

export function loginEmail(name: string, kind: "student" | "teacher" | "admin") {
  const username = normalizeUsername(name);
  const domain =
    kind === "student" ? STUDENT_DOMAIN : kind === "teacher" ? TEACHER_DOMAIN : ADMIN_DOMAIN;
  return { username, email: `${username}@${domain}` };
}

type AuthValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(userId: string | undefined) {
    if (!userId) {
      setProfile(null);
      setRole(null);
      return;
    }
    const [{ data: prof }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((prof as Profile) ?? null);
    const list = (roles ?? []).map((r) => r.role as Role);
    setRole(
      list.includes("super_admin")
        ? "super_admin"
        : list.includes("teacher")
          ? "teacher"
          : list.includes("student")
            ? "student"
            : null,
    );
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      void load(next?.user?.id).finally(() => setLoading(false));
    });
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await load(data.session?.user?.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      role,
      refresh: () => load(session?.user?.id),
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setRole(null);
      },
    }),
    [loading, session, profile, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
