
-- ===== ROLES =====
CREATE TYPE public.app_role AS ENUM ('super_admin','teacher','student');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  roll text,
  class_name text,
  batch text,
  guardian_name text,
  guardian_phone text,
  address text,
  photo_url text,
  subject text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'teacher');
$$;

CREATE OR REPLACE FUNCTION public.my_class()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT class_name FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.my_batch()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT batch FROM public.profiles WHERE id = auth.uid();
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "admin insert profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "admin delete profile" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- new signups become students automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, phone, roll, class_name, batch, guardian_name, guardian_phone, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name','Student'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'roll',
    NEW.raw_user_meta_data->>'class_name',
    NEW.raw_user_meta_data->>'batch',
    NEW.raw_user_meta_data->>'guardian_name',
    NEW.raw_user_meta_data->>'guardian_phone',
    NEW.raw_user_meta_data->>'address'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== TEACHER ASSIGNMENTS =====
CREATE TABLE public.teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  batch text,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assignments TO authenticated;
GRANT ALL ON public.teacher_assignments TO service_role;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments read" ON public.teacher_assignments FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "assignments admin write" ON public.teacher_assignments FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.can_teach(_class text, _batch text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'super_admin') OR EXISTS (
    SELECT 1 FROM public.teacher_assignments t
    WHERE t.teacher_id = auth.uid() AND t.class_name = _class
      AND (t.batch IS NULL OR _batch IS NULL OR t.batch = _batch)
  );
$$;

-- ===== CLASSES & BATCHES =====
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  class_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, class_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes, public.batches TO authenticated;
GRANT SELECT ON public.classes, public.batches TO anon;
GRANT ALL ON public.classes, public.batches TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes public read" ON public.classes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "classes admin write" ON public.classes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "batches public read" ON public.batches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "batches admin write" ON public.batches FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== VIDEOS =====
CREATE TABLE public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  chapter text,
  class_name text NOT NULL,
  batch text,
  teacher_name text,
  video_url text NOT NULL,
  thumbnail_url text,
  class_date date DEFAULT current_date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos read" ON public.videos FOR SELECT TO authenticated
  USING (public.is_staff() OR class_name = public.my_class());
CREATE POLICY "videos write" ON public.videos FOR ALL TO authenticated
  USING (public.can_teach(class_name, batch)) WITH CHECK (public.can_teach(class_name, batch));

-- ===== MATERIALS =====
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  class_name text NOT NULL,
  batch text,
  file_url text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials read" ON public.materials FOR SELECT TO authenticated
  USING (public.is_staff() OR class_name = public.my_class());
CREATE POLICY "materials write" ON public.materials FOR ALL TO authenticated
  USING (public.can_teach(class_name, batch)) WITH CHECK (public.can_teach(class_name, batch));

-- ===== ROUTINE =====
CREATE TABLE public.routine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_name text NOT NULL,
  subject text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  teacher_name text,
  room text,
  class_name text NOT NULL,
  batch text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routine TO authenticated;
GRANT ALL ON public.routine TO service_role;
ALTER TABLE public.routine ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routine read" ON public.routine FOR SELECT TO authenticated
  USING (public.is_staff() OR class_name = public.my_class());
CREATE POLICY "routine write" ON public.routine FOR ALL TO authenticated
  USING (public.can_teach(class_name, batch)) WITH CHECK (public.can_teach(class_name, batch));

-- ===== ATTENDANCE =====
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attend_date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'present',
  class_name text,
  batch text,
  subject text,
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, attend_date, subject)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance own read" ON public.attendance FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff());
CREATE POLICY "attendance staff write" ON public.attendance FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ===== EXAMS & RESULTS =====
CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text,
  exam_date date,
  total_marks int NOT NULL DEFAULT 100,
  class_name text NOT NULL,
  batch text,
  syllabus text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exams read" ON public.exams FOR SELECT TO authenticated
  USING (public.is_staff() OR class_name = public.my_class());
CREATE POLICY "exams write" ON public.exams FOR ALL TO authenticated
  USING (public.can_teach(class_name, batch)) WITH CHECK (public.can_teach(class_name, batch));

CREATE TABLE public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  marks numeric NOT NULL DEFAULT 0,
  grade text,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.results TO authenticated;
GRANT ALL ON public.results TO service_role;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "results own read" ON public.results FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff());
CREATE POLICY "results staff write" ON public.results FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ===== HOMEWORK =====
CREATE TABLE public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text,
  due_date date,
  class_name text NOT NULL,
  batch text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homework read" ON public.homework FOR SELECT TO authenticated
  USING (public.is_staff() OR class_name = public.my_class());
CREATE POLICY "homework write" ON public.homework FOR ALL TO authenticated
  USING (public.can_teach(class_name, batch)) WITH CHECK (public.can_teach(class_name, batch));

-- ===== NOTICES =====
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  important boolean NOT NULL DEFAULT false,
  public_visible boolean NOT NULL DEFAULT true,
  class_name text,
  notice_date date DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT SELECT ON public.notices TO anon;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notices public read" ON public.notices FOR SELECT TO anon USING (public_visible = true);
CREATE POLICY "notices auth read" ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "notices staff write" ON public.notices FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ===== FEES =====
CREATE TABLE public.fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_label text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fees TO authenticated;
GRANT ALL ON public.fees TO service_role;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fees own read" ON public.fees FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_staff());
CREATE POLICY "fees admin write" ON public.fees FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== REVIEWS =====
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  comment text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (approved = true OR public.is_admin());
CREATE POLICY "reviews anyone insert" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (approved = false);
CREATE POLICY "reviews admin write" ON public.reviews FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "reviews admin delete" ON public.reviews FOR DELETE TO authenticated USING (public.is_admin());

-- ===== COURSES =====
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price text,
  duration text,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT ON public.courses TO anon;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses public read" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses admin write" ON public.courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== PUBLIC TEACHER CARDS =====
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text,
  bio text,
  photo_url text,
  user_id uuid,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT SELECT ON public.teachers TO anon;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers public read" ON public.teachers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "teachers admin write" ON public.teachers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ===== SITE SETTINGS =====
CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1,
  academy_name text NOT NULL DEFAULT 'GOOGLY ACADEMY',
  ceo_name text NOT NULL DEFAULT 'SOMRAT',
  logo_url text,
  favicon_url text,
  hero_title text NOT NULL DEFAULT 'Learn better with GOOGLY ACADEMY',
  hero_subtitle text NOT NULL DEFAULT 'Recorded classes, study materials, exams and results — all in one place.',
  hero_image_url text,
  about_text text NOT NULL DEFAULT 'GOOGLY ACADEMY is a modern coaching center focused on real results.',
  contact_phone text DEFAULT '',
  contact_email text DEFAULT '',
  address text DEFAULT '',
  facebook_url text DEFAULT '',
  youtube_url text DEFAULT '',
  whatsapp_url text DEFAULT '',
  primary_color text NOT NULL DEFAULT '#1d63ff',
  show_courses boolean NOT NULL DEFAULT true,
  show_teachers boolean NOT NULL DEFAULT true,
  show_reviews boolean NOT NULL DEFAULT true,
  show_notices boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT SELECT ON public.site_settings TO anon;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.site_settings (id) VALUES (1);

INSERT INTO public.classes (name) VALUES ('Class 6'),('Class 7'),('Class 8'),('Class 9'),('Class 10');
INSERT INTO public.batches (name, class_name)
SELECT b, c.name FROM public.classes c, (VALUES ('Batch A'),('Batch B')) AS t(b);

INSERT INTO public.courses (title, description, price, duration, sort_order) VALUES
 ('SSC Science Program','Physics, Chemistry, Biology and Higher Math with weekly exams.','1200 BDT / month','12 months',1),
 ('Class 9-10 Mathematics','Concept-first math classes with recorded videos and practice sheets.','800 BDT / month','12 months',2),
 ('English Foundation','Grammar, writing and speaking for Class 6-8 students.','700 BDT / month','6 months',3);

-- ===== INITIAL ADMIN (username: admin) =====
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$
DECLARE uid uuid := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@googly.academy') THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@googly.academy', crypt('somatic', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username','admin','full_name','SOMRAT'), now(), now());
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), uid, uid::text, 'email',
      jsonb_build_object('sub', uid::text, 'email','admin@googly.academy','email_verified',true), now(), now(), now());
    DELETE FROM public.user_roles WHERE user_id = uid;
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'super_admin');
  END IF;
END $$;
