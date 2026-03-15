export interface Student {
  id: string;
  name: string;
  subject: string;
  price_per_lesson: number;
  notes?: string;
  teacher_id: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  student_id: string | null;
  group_id: string | null;
  is_group: boolean;
  date: string;
  time: string;
  duration: number;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  teacher_id: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  subject: string;
  price_per_student: number;
  teacher_id: string;
  created_at: string;
  student_ids?: string[]; // computed from group_members
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  date: string;
  note: string;
  teacher_id: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  name: string;
  subject: string;
}

export interface AppData {
  students: Student[];
  lessons: Lesson[];
  payments: Payment[];
  groups: Group[];
  teacher: Teacher | null;
}
