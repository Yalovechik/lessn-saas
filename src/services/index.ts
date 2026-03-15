/**
 * Service layer agents for Supabase data access
 *
 * Each service module provides CRUD operations and domain-specific queries
 * for a specific data entity (students, lessons, groups, payments, teachers).
 *
 * Usage:
 * import { studentService, lessonService, groupService, paymentService, teacherService } from "@/services";
 *
 * const students = await studentService.getStudentsByTeacher(teacherId);
 * const lessons = await lessonService.getUpcomingLessons(teacherId);
 */

export { studentService, type Student, type StudentInsert, type StudentUpdate } from "./studentService";
export { lessonService, type Lesson, type LessonInsert, type LessonUpdate } from "./lessonService";
export {
    groupService,
    type Group,
    type GroupInsert,
    type GroupUpdate,
    type GroupMember,
    type GroupMemberInsert,
} from "./groupService";
export { paymentService, type Payment, type PaymentInsert, type PaymentUpdate } from "./paymentService";
export { teacherService, type Teacher, type TeacherInsert, type TeacherUpdate } from "./teacherService";
