# Lessn Setup Guide

Complete guide to setting up and running the Lessn project with Supabase backend and TypeScript service layer.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Development](#development)
5. [Project Architecture](#project-architecture)
6. [Service Layer](#service-layer)
7. [Deployment](#deployment)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier available at [supabase.com](https://supabase.com))

### Installation

```bash
cd lessn-lovable/tailwind-tune-up-a6a81bce-main
npm install
```

### Configure Environment

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or use existing one
3. Get your credentials from **Settings** → **API**:
   - Project URL
   - Anon/Public Key

4. Create `.env.local` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

### Start Development Server

```bash
npm run dev
```

Visit `http://localhost:8081` in your browser.

---

## Database Setup

### Create Tables

Run this SQL in your Supabase SQL Editor (**SQL Editor** → **New Query**):

```sql
-- Teachers table
CREATE TABLE teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Students table
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  price_per_lesson NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Groups table
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  price_per_student NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Group members table (join table for students in groups)
CREATE TABLE group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(group_id, student_id)
);

-- Lessons table
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TEXT,
  duration INTEGER DEFAULT 60,
  is_group BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Teachers: Users can only see/edit their own profile
CREATE POLICY "Teachers can view their own profile" ON teachers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can insert their own profile" ON teachers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can update their own profile" ON teachers FOR UPDATE USING (auth.uid() = user_id);

-- Students: Teachers can only manage their own students
CREATE POLICY "Teachers can view their own students" ON students FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can insert students" ON students FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can update students" ON students FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can delete students" ON students FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

-- Groups: Teachers can only manage their own groups
CREATE POLICY "Teachers can view their own groups" ON groups FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can insert groups" ON groups FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can update groups" ON groups FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can delete groups" ON groups FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

-- Group Members: Teachers can manage members of their groups
CREATE POLICY "Teachers can view group members" ON group_members FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id IN (SELECT teacher_id FROM groups WHERE id = group_id)));
CREATE POLICY "Teachers can manage group members" ON group_members FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM teachers WHERE id IN (SELECT teacher_id FROM groups WHERE id = group_id)));
CREATE POLICY "Teachers can delete group members" ON group_members FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id IN (SELECT teacher_id FROM groups WHERE id = group_id)));

-- Lessons: Teachers can manage their own lessons
CREATE POLICY "Teachers can view their own lessons" ON lessons FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can insert lessons" ON lessons FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can update lessons" ON lessons FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can delete lessons" ON lessons FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));

-- Payments: Teachers can manage their own payments
CREATE POLICY "Teachers can view their own payments" ON payments FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can insert payments" ON payments FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can update payments" ON payments FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
CREATE POLICY "Teachers can delete payments" ON payments FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM teachers WHERE id = teacher_id));
```

---

## Environment Configuration

### Development (.env.local)

Create `.env.local` at project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_public_key
```

### Get Your Keys

1. Go to Supabase Dashboard
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon/Public Key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

⚠️ **Note**: These keys are safe to expose in the frontend (they're public). Never expose your **service_role_key** or **database password**.

---

## Development

### Running the Dev Server

```bash
npm run dev
```

Server runs on `http://localhost:8081` with hot reload enabled.

### Building for Production

```bash
npm run build
```

Output goes to `dist/` directory.

### Running Tests

```bash
npm run test         # Run once
npm run test:watch   # Watch mode
```

### Linting

```bash
npm run lint
```

---

## Project Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Build Tool**: Vite
- **Routing**: React Router v6

### Directory Structure

```
src/
├── components/        # React components (UI, features)
├── hooks/            # Custom React hooks
│   ├── useAuth.tsx       # Authentication context
│   └── useAppData.ts     # Main data hook (students, lessons, etc.)
├── pages/            # Page components
├── services/         # TypeScript service layer (agents)
│   ├── studentService.ts
│   ├── lessonService.ts
│   ├── groupService.ts
│   ├── paymentService.ts
│   ├── teacherService.ts
│   └── index.ts         # Barrel export
├── integrations/     # External integrations
│   └── supabase/
│       ├── client.ts     # Supabase client instance
│       └── types.ts      # Auto-generated types
├── types/            # TypeScript type definitions
└── App.tsx           # Root component
```

### Data Flow

```
React Components
    ↓
React Hooks (useAppData)
    ↓
React Query (caching, sync)
    ↓
Service Layer (studentService, etc.)
    ↓
Supabase Client
    ↓
Supabase Database (PostgreSQL)
```

---

## Service Layer

The **service layer** is the backbone of your data access. It provides typed, reusable functions for all database operations.

### Available Services

#### 1. Student Service (`studentService`)

```typescript
import { studentService } from "@/services";

// Read
const students = await studentService.getStudentsByTeacher(teacherId);
const student = await studentService.getStudent(studentId);
const results = await studentService.searchStudents(teacherId, "John");

// Write
const newStudent = await studentService.createStudent({
	name: "John Doe",
	subject: "Math",
	teacher_id: teacherId,
	price_per_lesson: 50,
});

const updated = await studentService.updateStudent(studentId, {
	name: "Jane Doe",
});
await studentService.deleteStudent(studentId);
```

#### 2. Lesson Service (`lessonService`)

```typescript
import { lessonService } from "@/services";

// Read
const lessons = await lessonService.getLessonsByTeacher(teacherId);
const upcoming = await lessonService.getUpcomingLessons(teacherId, 14);
const byDate = await lessonService.getLessonsByDateRange(
	teacherId,
	"2026-03-01",
	"2026-03-31",
);

// Write
const newLesson = await lessonService.createLesson({
	teacher_id: teacherId,
	student_id: studentId,
	date: "2026-03-20",
	time: "10:00",
	duration: 60,
});
```

#### 3. Group Service (`groupService`)

```typescript
import { groupService } from "@/services";

// Read
const groups = await groupService.getGroupsByTeacher(teacherId);
const group = await groupService.getGroupWithMembers(groupId);
const members = await groupService.getGroupMembers(groupId);

// Write
const newGroup = await groupService.createGroup({
	name: "Math Class A",
	subject: "Math",
	teacher_id: teacherId,
	price_per_student: 25,
});

await groupService.addStudentToGroup(groupId, studentId);
await groupService.removeStudentFromGroup(groupId, studentId);
```

#### 4. Payment Service (`paymentService`)

```typescript
import { paymentService } from "@/services";

// Read
const payments = await paymentService.getPaymentsByTeacher(teacherId);
const earnings = await paymentService.getTotalEarnings(
	teacherId,
	startDate,
	endDate,
);
const monthly = await paymentService.getRecentPayments(teacherId, 30);

// Write (typically via Edge Function)
await paymentService.createPayment({
	teacher_id: teacherId,
	student_id: studentId,
	amount: 50,
	date: "2026-03-15",
});
```

#### 5. Teacher Service (`teacherService`)

```typescript
import { teacherService } from "@/services";

// Read
const teacher = await teacherService.getTeacher(teacherId);
const current = await teacherService.getTeacherByUserId(userId);
const stats = await teacherService.getTeacherStats(teacherId);

// Write
const newTeacher = await teacherService.createTeacher({
	user_id: userId,
	name: "Teacher Name",
	subject: "Math",
});
```

### Using Services in Components

```typescript
import { useAppData } from '@/hooks/useAppData';

export function StudentList() {
  const { students, addStudent, deleteStudent } = useAppData();

  // students are automatically cached and synced by React Query
  return (
    <div>
      {students.map(s => (
        <div key={s.id}>
          {s.name}
          <button onClick={() => deleteStudent.mutate(s.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Type Safety

All services export TypeScript types matching your Supabase schema:

```typescript
import type { Student, Lesson, Payment, Group, Teacher } from "@/services";

const student: Student = await studentService.getStudent(id);
const lesson: Lesson = await lessonService.getLesson(id);
```

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Vercel auto-detects Vite config
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Deploy!

### Deploy to Other Platforms

Build command:

```bash
npm run build
```

Output directory: `dist/`

### Environment Variables

Add these to your hosting platform (Vercel, Netlify, etc.):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_public_key
```

---

## Database Schema Reference

### Tables

| Table             | Purpose                      | Key Fields                                                         |
| ----------------- | ---------------------------- | ------------------------------------------------------------------ |
| **teachers**      | Teacher profiles             | id, user_id, name, subject                                         |
| **students**      | Student records              | id, teacher_id, name, subject, price_per_lesson, notes             |
| **groups**        | Group classes                | id, teacher_id, name, subject, price_per_student                   |
| **group_members** | Student-to-group association | id, group_id, student_id                                           |
| **lessons**       | Individual or group lessons  | id, teacher_id, student_id, group_id, date, time, duration, status |
| **payments**      | Payment records              | id, teacher_id, student_id, amount, date, note                     |

### Relationships

```
teachers (1) ──→ (many) students
teachers (1) ──→ (many) groups
groups (1) ──→ (many) group_members
students (1) ──→ (many) group_members
teachers (1) ──→ (many) lessons
students (1) ──→ (many) lessons (nullable)
groups (1) ──→ (many) lessons (nullable)
teachers (1) ──→ (many) payments
students (1) ──→ (many) payments
```

---

## Troubleshooting

### 404 Errors on Table Queries

**Problem**: `Failed to load resource: the server responded with a status of 404`

**Solutions**:

1. Check tables exist in Supabase SQL Editor
2. Verify RLS policies are created
3. Confirm `user_id` matches authenticated user
4. Check `.env` has correct Supabase URL and key

### Authentication Not Working

**Problem**: Can't sign up or sign in

**Solutions**:

1. Enable Email/Password auth in Supabase: **Authentication** → **Providers**
2. Verify SMTP configured for email confirmations
3. Check email in spam folder

### Slow Queries

**Solution**: Add database indexes for frequently-queried fields:

```sql
CREATE INDEX idx_students_teacher_id ON students(teacher_id);
CREATE INDEX idx_lessons_teacher_id ON lessons(teacher_id);
CREATE INDEX idx_lessons_date ON lessons(date);
CREATE INDEX idx_payments_teacher_id ON payments(teacher_id);
```

---

## Next Steps

- [ ] Create Supabase account and project
- [ ] Run SQL to create tables and RLS policies
- [ ] Configure `.env.local` with Supabase credentials
- [ ] Run `npm install && npm run dev`
- [ ] Test sign-up and onboarding flow
- [ ] Explore service layer in `src/services/`
- [ ] Start building features!

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
