
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Hospital settings (single row)
CREATE TABLE public.hospital_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Meraki Care',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  gstin TEXT NOT NULL DEFAULT '',
  gst_percent NUMERIC(5,2) NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hospital_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.hospital_settings (name) VALUES ('Meraki Care');

-- Doctors
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Bills + invoice sequence
CREATE SEQUENCE public.bill_invoice_seq START 1;

CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL UNIQUE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_age INT NOT NULL,
  patient_gender TEXT,
  patient_address TEXT,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name TEXT,
  subtotal NUMERIC(12,2) NOT NULL,
  gst_percent NUMERIC(5,2) NOT NULL,
  gst_amount NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medicine','test')),
  name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL
);
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

-- Signup lock
CREATE TABLE public.signup_lock (
  id INT PRIMARY KEY DEFAULT 1,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT only_one_row CHECK (id = 1)
);
ALTER TABLE public.signup_lock ENABLE ROW LEVEL SECURITY;
INSERT INTO public.signup_lock (id, locked) VALUES (1, FALSE);

-- ===== RLS POLICIES =====

-- profiles
CREATE POLICY "users see own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert profiles" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- hospital_settings
CREATE POLICY "auth view hospital" ON public.hospital_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins update hospital" ON public.hospital_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- doctors
CREATE POLICY "auth view doctors" ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage doctors" ON public.doctors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- bills
CREATE POLICY "view own bills or admin" ON public.bills FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "create bills" ON public.bills FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- bill_items
CREATE POLICY "view items via bill" ON public.bill_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bills b WHERE b.id = bill_items.bill_id
    AND (b.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "insert items via own bill" ON public.bill_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.bills b WHERE b.id = bill_items.bill_id
    AND b.created_by = auth.uid()));

-- signup_lock
CREATE POLICY "anyone read signup lock" ON public.signup_lock FOR SELECT USING (true);
CREATE POLICY "admins update signup lock" ON public.signup_lock FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== TRIGGERS =====

-- On new auth user: create profile, assign role (first user => admin & lock signups)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    UPDATE public.signup_lock SET locked = TRUE WHERE id = 1;
  ELSE
    -- staff role assigned by admin via server fn at creation; default to staff if missing
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'staff'))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-generate invoice_no like MC-YYYY-0001
CREATE OR REPLACE FUNCTION public.set_invoice_no()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' THEN
    NEW.invoice_no := 'MC-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.bill_invoice_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bills_set_invoice_no
  BEFORE INSERT ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.set_invoice_no();
