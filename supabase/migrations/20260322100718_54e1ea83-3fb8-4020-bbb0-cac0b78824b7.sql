
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    department TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Teachers table
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL DEFAULT '',
    availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'on_leave', 'busy')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can view themselves" ON public.teachers
  FOR SELECT USING (user_id = auth.uid());

-- Leave dates
CREATE TABLE public.teacher_leave_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    leave_date DATE NOT NULL,
    reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (teacher_id, leave_date)
);
ALTER TABLE public.teacher_leave_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage leave dates" ON public.teacher_leave_dates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can view own leave" ON public.teacher_leave_dates
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Teachers can manage own leave" ON public.teacher_leave_dates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Teachers can delete own leave" ON public.teacher_leave_dates
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid())
  );

-- Exam schedule
CREATE TABLE public.exam_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT NOT NULL DEFAULT '',
    required_invigilators INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage exam schedules" ON public.exam_schedules
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view exams" ON public.exam_schedules
  FOR SELECT TO authenticated USING (true);

-- Duty allocations
CREATE TABLE public.duty_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    exam_id UUID REFERENCES public.exam_schedules(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'on_leave', 'changed', 'swapped')),
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (teacher_id, exam_id)
);
ALTER TABLE public.duty_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage allocations" ON public.duty_allocations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can view own allocations" ON public.duty_allocations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.user_id = auth.uid())
  );

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'duty_assigned', 'duty_changed', 'swap_request', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Swap requests
CREATE TABLE public.swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    target_teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    allocation_id UUID REFERENCES public.duty_allocations(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage swap requests" ON public.swap_requests
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Teachers can view own swap requests" ON public.swap_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id IN (requester_teacher_id, target_teacher_id) AND t.user_id = auth.uid())
  );
CREATE POLICY "Teachers can create swap requests" ON public.swap_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = requester_teacher_id AND t.user_id = auth.uid())
  );

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exam_schedules_updated_at BEFORE UPDATE ON public.exam_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_duty_allocations_updated_at BEFORE UPDATE ON public.duty_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_swap_requests_updated_at BEFORE UPDATE ON public.swap_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;
