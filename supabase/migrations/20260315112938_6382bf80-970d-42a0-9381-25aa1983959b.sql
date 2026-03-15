
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Teachers/profiles table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own teacher profile" ON public.teachers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own teacher profile" ON public.teachers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own teacher profile" ON public.teachers FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  price_per_lesson NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own students" ON public.students FOR SELECT USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can create students" ON public.students FOR INSERT WITH CHECK (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can update their students" ON public.students FOR UPDATE USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can delete their students" ON public.students FOR DELETE USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  price_per_student NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own groups" ON public.groups FOR SELECT USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can create groups" ON public.groups FOR INSERT WITH CHECK (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can update their groups" ON public.groups FOR UPDATE USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can delete their groups" ON public.groups FOR DELETE USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Group members junction table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(group_id, student_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view group members" ON public.group_members FOR SELECT USING (group_id IN (SELECT id FROM public.groups WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())));
CREATE POLICY "Teachers can add group members" ON public.group_members FOR INSERT WITH CHECK (group_id IN (SELECT id FROM public.groups WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())));
CREATE POLICY "Teachers can remove group members" ON public.group_members FOR DELETE USING (group_id IN (SELECT id FROM public.groups WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())));

-- Lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  is_group BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL,
  time TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 60,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own lessons" ON public.lessons FOR SELECT USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can create lessons" ON public.lessons FOR INSERT WITH CHECK (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can update their lessons" ON public.lessons FOR UPDATE USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can delete their lessons" ON public.lessons FOR DELETE USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own payments" ON public.payments FOR SELECT USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can create payments" ON public.payments FOR INSERT WITH CHECK (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can update their payments" ON public.payments FOR UPDATE USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers can delete their payments" ON public.payments FOR DELETE USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_students_teacher_id ON public.students(teacher_id);
CREATE INDEX idx_groups_teacher_id ON public.groups(teacher_id);
CREATE INDEX idx_lessons_teacher_id ON public.lessons(teacher_id);
CREATE INDEX idx_lessons_date ON public.lessons(date);
CREATE INDEX idx_lessons_student_id ON public.lessons(student_id);
CREATE INDEX idx_lessons_group_id ON public.lessons(group_id);
CREATE INDEX idx_payments_teacher_id ON public.payments(teacher_id);
CREATE INDEX idx_payments_student_id ON public.payments(student_id);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_student_id ON public.group_members(student_id);
