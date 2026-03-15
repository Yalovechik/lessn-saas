# Architecture Overview

High-level overview of the Lessn project structure and design patterns.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React App (React 18 + TypeScript)           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │          React Components & Pages                 │  │  │
│  │  │  ├── Students Page                                │  │  │
│  │  │  ├── Lessons Page                                 │  │  │
│  │  │  ├── Groups Page                                  │  │  │
│  │  │  └── Payments Page                                │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                          ↓                                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │           Custom React Hooks                      │  │  │
│  │  │  ├── useAppData (data management)                │  │  │
│  │  │  ├── useAuth (authentication)                    │  │  │
│  │  │  └── useToast, useMediaQuery, etc                │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                          ↓                                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │     React Query (TanStack Query)                  │  │  │
│  │  │  ├── Query caching & deduplication               │  │  │
│  │  │  ├── Automatic refetch on focus                  │  │  │
│  │  │  ├── Mutation state management                   │  │  │
│  │  │  └── Background updates                          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                          ↓                                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │          Service Layer (TypeScript Agents)        │  │  │
│  │  │  ├── studentService                              │  │  │
│  │  │  ├── lessonService                               │  │  │
│  │  │  ├── groupService                                │  │  │
│  │  │  ├── paymentService                              │  │  │
│  │  │  └── teacherService                              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase (Backend-as-a-Service)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Auth Service                                            │  │
│  │  ├── User signup/signin                                │  │
│  │  ├── Session management                                │  │
│  │  └── JWT tokens                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgREST API (Auto-generated REST with RLS)          │  │
│  │  ├── GET /rest/v1/teachers                            │  │
│  │  ├── POST /rest/v1/students                           │  │
│  │  ├── PATCH /rest/v1/lessons/:id                       │  │
│  │  └── DELETE /rest/v1/payments/:id                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (with Row-Level Security)         │  │
│  │  ├── teachers                                           │  │
│  │  ├── students                                           │  │
│  │  ├── lessons                                            │  │
│  │  ├── groups                                             │  │
│  │  ├── group_members                                      │  │
│  │  └── payments                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: Creating a Student

```
User fills form → Component calls useAppData().addStudent()
                    ↓
                React Query mutation starts
                    ↓
                studentService.createStudent({...})
                    ↓
                Supabase client sends POST /rest/v1/students
                    ↓
                Supabase validates RLS policy (user owns teacher record)
                    ↓
                PostgreSQL inserts new student record
                    ↓
                Supabase returns created student
                    ↓
                React Query onSuccess handler
                    ↓
                Invalidate 'students' query cache
                    ↓
                useAppData hook automatically refetches
                    ↓
                Component rerenders with new student
                    ↓
                Toast notification shows success
```

## Service Layer Pattern

Each service is an object with async functions that wrap Supabase calls:

```typescript
// Example: studentService
export const studentService = {
	// Query functions (read-only)
	async getStudentsByTeacher(teacherId: string) {
		const { data, error } = await supabase
			.from("students")
			.select("*")
			.eq("teacher_id", teacherId)
			.order("name");

		if (error) throw error;
		return data;
	},

	// Mutation functions (write)
	async createStudent(student: StudentInsert) {
		const { data, error } = await supabase
			.from("students")
			.insert([student])
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	// ... more functions
};
```

### Benefits

✅ **Type Safety** → Full TypeScript support
✅ **DRY** → Reuse queries across components
✅ **Testability** → Easy to mock services
✅ **Maintainability** → All data access in one place
✅ **Consistency** → Standard error handling
✅ **Encapsulation** → Hide Supabase details from components

## Authentication Flow

```
                            ┌─────────────────────┐
                            │  Supabase Auth      │
                            └─────────────────────┘
                                      ↑
                                      │
                                      │
    ┌──────────────────────────────────┴──────────────────────────────┐
    │                                                                  │
    ↓                                                                  ↓
┌─────────────┐                                                   ┌─────────────┐
│  Sign Up    │                                                   │  Sign In    │
│             │                                                   │             │
│ 1. User     │                                                   │ 1. User     │
│    submits  │                                                   │    enters   │
│    email &  │                                                   │    email &  │
│    password │                                                   │    password │
├─────────────┤                                                   ├─────────────┤
│ 2. Validation                                                   │ 2. Validation
└─────────────┘                                                   └─────────────┘
    ↓                                                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│  useAuth.tsx → supabase.auth.signUp/signInWithPassword()           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Supabase returns User object with JWT                             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────────┐
    │ Is this user's first sign-up? → Show Onboarding page   │
    └─────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────────┐
    │ User completes onboarding → createTeacher()            │
    │ Creates teacher record in database                      │
    └─────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────────┐
    │ teacherService.getTeacherByUserId() retrieves profile  │
    │ Sets teacher context in useAuth                         │
    └─────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────────────────────────────────────┐
    │ App navigation → Show Dashboard                         │
    └─────────────────────────────────────────────────────────┘
```

## State Management Strategy

### Local State

- Form inputs, UI toggles → `useState`

### Server State (React Query)

- Students, lessons, groups, payments → Cached and synced
- Automatic refetch on window focus
- Mutations invalidate cache → automatic refetch

### Global Auth State

- Current user, current teacher → `useAuth` context
- Persisted in Supabase session storage

### Example

```typescript
function StudentList() {
  // Server state (React Query)
  const { students, addStudent } = useAppData();

  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = async () => {
    // Call service mutation
    await addStudent.mutateAsync({
      name,
      subject: 'Math',
      teacher_id: teacher.id,
      price_per_lesson: 50,
    });

    // Local state cleanup
    setName('');
    setIsOpen(false);
    // React Query automatically refetches students
  };

  return (
    // Render students from server state
    // Support add action with optimistic updates
  );
}
```

## Future Paths for Scaling

### Phase 1 (Current) ✅

- Service layer for read/write operations
- React Query for state management
- Frontend form validation
- Basic RLS policies

### Phase 2 (When Needed)

**Supabase Edge Functions** for:

- Stripe payment integration
- Email notifications
- Cron jobs (payment reminders)
- Complex business logic

Example:

```typescript
// Call Edge Function from frontend
const response = await supabase.functions.invoke("process-payment", {
	body: { studentId, amount, date },
});
```

### Phase 3 (Only if Needed)

**Dedicated Node.js Backend** for:

- Another product/mobile app
- Complex analytics/reporting
- Real-time WebSocket features
- Legacy system integration

The service layer makes this transition easy — just change the backend implementation while keeping the same interface.

---

## Key Design Decisions

| Decision                 | Rationale                                        |
| ------------------------ | ------------------------------------------------ |
| **Service Layer**        | Centralize data access, easier to test/maintain  |
| **React Query**          | Built-in caching, deduplication, background sync |
| **Supabase RLS**         | Database-level security, can't be bypassed       |
| **TypeScript**           | Type safety catches bugs at compile time         |
| **Tailwind + shadcn/ui** | Consistent, accessible, composable components    |
| **Client-side Auth**     | Simpler initial setup, Supabase handles sessions |

---

## Development Workflow

1. **Add new feature** (e.g., bulk lesson import)
2. **Create service method** in appropriate service file
3. **Add React Query hook** in useAppData if needed
4. **Build component** using hooks
5. **Test with RLS** (create second test account)
6. **Deploy** to Vercel (automatic from git push)

---

## Files & Their Responsibilities

| File                                  | Responsibility                      |
| ------------------------------------- | ----------------------------------- |
| `src/services/*.ts`                   | Data access layer, Supabase queries |
| `src/hooks/useAppData.ts`             | React Query setup + mutations       |
| `src/hooks/useAuth.tsx`               | Auth context & session management   |
| `src/pages/*.tsx`                     | Page-level components, routing      |
| `src/components/**`                   | Reusable UI components              |
| `src/integrations/supabase/client.ts` | Supabase client instance            |
| `SETUP.md`                            | Setup & deployment guide            |

---

## Monitoring & Debugging

### React Query DevTools

```typescript
// In development, inspect query state
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add to App.tsx
<ReactQueryDevtools initialIsOpen={false} />
```

### Supabase Dashboard

- Monitor real-time database activity
- View query performance
- Check RLS policy logs
- Manage user sessions

### Browser DevTools

- Network tab → See Supabase API calls
- Storage → See JWT tokens, auth session
- Console → Service layer errors
