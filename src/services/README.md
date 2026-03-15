# Service Layer - Supabase Agents

This directory contains TypeScript service agents that handle all data access to Supabase. Each service provides CRUD operations and domain-specific queries for a particular entity.

## Overview

### Services

1. **studentService** - Manage students
   - Query students by teacher, subject, or name
   - Create, update, delete students

2. **lessonService** - Manage lessons
   - Query lessons by teacher, student, group, date range, or status
   - Get upcoming lessons
   - Create, update, delete lessons

3. **groupService** - Manage groups and group membership
   - Query groups by teacher or subject
   - Manage group members (add/remove students)
   - Get group details with members

4. **paymentService** - Manage payments
   - Query payments by teacher, student, or date range
   - Calculate total earnings
   - Get recent payments
   - Create/update/delete payments (typically via Edge Functions)

5. **teacherService** - Manage teacher profiles
   - Query teacher by ID or user ID
   - Get teacher statistics (student count, group count, lesson count)
   - Create, update, delete teachers

## Usage Examples

```typescript
import {
	studentService,
	lessonService,
	groupService,
	paymentService,
	teacherService,
} from "@/services";

// Get all students for a teacher
const students = await studentService.getStudentsByTeacher(teacherId);

// Create a new student
const newStudent = await studentService.createStudent({
	name: "John Doe",
	subject: "Math",
	teacher_id: teacherId,
	price_per_lesson: 50,
});

// Get upcoming lessons
const upcoming = await lessonService.getUpcomingLessons(teacherId, 14);

// Get group with members
const groupData = await groupService.getGroupWithMembers(groupId);

// Add student to group
await groupService.addStudentToGroup(groupId, studentId);

// Get total earnings for a teacher
const earnings = await paymentService.getTotalEarnings(
	teacherId,
	startDate,
	endDate,
);

// Get teacher statistics
const stats = await teacherService.getTeacherStats(teacherId);
```

## Type Safety

All services export TypeScript types that match your Supabase schema:

```typescript
import type {
	Student,
	StudentInsert,
	StudentUpdate,
	Lesson,
	LessonInsert,
	LessonUpdate,
	// ... other types
} from "@/services";

const student: Student = await studentService.getStudent(studentId);
const newLesson: LessonInsert = {
	teacher_id: teacherId,
	date: new Date().toISOString().split("T")[0],
	duration: 60,
};
```

## Error Handling

All service methods throw errors from Supabase directly. Handle errors in your components or hooks:

```typescript
try {
	const students = await studentService.getStudentsByTeacher(teacherId);
} catch (error) {
	console.error("Failed to fetch students:", error);
	// Handle error in UI
}
```

## Payment Mutations

While `paymentService.createPayment()` is available, payment mutations (create/update/delete) should typically be handled by Supabase Edge Functions for security and Stripe integration.

Use read operations (`getPaymentsByTeacher`, `getTotalEarnings`, etc.) freely on the frontend, but call Edge Functions for mutations.

## Future: Edge Functions

When you add Supabase Edge Functions for payment processing, they will call these same service functions on the backend for consistency.
