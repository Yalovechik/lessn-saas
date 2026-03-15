import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
    studentService,
    lessonService,
    groupService,
    paymentService,
    type Student,
    type StudentInsert,
    type StudentUpdate,
    type Lesson,
    type LessonInsert,
    type LessonUpdate,
    type Group,
    type GroupInsert,
    type GroupUpdate,
    type Payment,
    type PaymentInsert,
    type PaymentUpdate,
} from '@/services';

export function useAppData() {
    const { teacher } = useAuth();
    const queryClient = useQueryClient();
    const teacherId = teacher?.id;

    // Students
    const { data: students = [] } = useQuery({
        queryKey: ['students', teacherId],
        queryFn: async () => {
            if (!teacherId) return [];
            return await studentService.getStudentsByTeacher(teacherId);
        },
        enabled: !!teacherId,
    });

    // Groups with members
    const { data: groups = [] } = useQuery({
        queryKey: ['groups', teacherId],
        queryFn: async () => {
            if (!teacherId) return [];
            const groupsData = await groupService.getGroupsByTeacher(teacherId);
            const groupsWithMembers = await Promise.all(
                groupsData.map(async (group) => {
                    const members = await groupService.getGroupMembers(group.id);
                    return {
                        ...group,
                        student_ids: members.map((m) => m.student_id),
                    };
                })
            );
            return groupsWithMembers;
        },
        enabled: !!teacherId,
    });

    // Lessons
    const { data: lessons = [] } = useQuery({
        queryKey: ['lessons', teacherId],
        queryFn: async () => {
            if (!teacherId) return [];
            return await lessonService.getLessonsByTeacher(teacherId);
        },
        enabled: !!teacherId,
    });

    // Payments
    const { data: payments = [] } = useQuery({
        queryKey: ['payments', teacherId],
        queryFn: async () => {
            if (!teacherId) return [];
            return await paymentService.getPaymentsByTeacher(teacherId);
        },
        enabled: !!teacherId,
    });

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['students', teacherId] });
        queryClient.invalidateQueries({ queryKey: ['groups', teacherId] });
        queryClient.invalidateQueries({ queryKey: ['lessons', teacherId] });
        queryClient.invalidateQueries({ queryKey: ['payments', teacherId] });
    };

    // Student mutations
    const addStudent = useMutation({
        mutationFn: async (student: StudentInsert) => {
            return await studentService.createStudent(student);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students', teacherId] }),
    });

    const updateStudent = useMutation({
        mutationFn: async ({ id, ...updates }: StudentUpdate & { id: string }) => {
            return await studentService.updateStudent(id, updates);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students', teacherId] }),
    });

    const deleteStudent = useMutation({
        mutationFn: async (id: string) => {
            await studentService.deleteStudent(id);
        },
        onSuccess: invalidateAll,
    });

    // Lesson mutations
    const addLesson = useMutation({
        mutationFn: async (lesson: LessonInsert) => {
            return await lessonService.createLesson(lesson);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons', teacherId] }),
    });

    const addLessons = useMutation({
        mutationFn: async (lessonsArr: LessonInsert[]) => {
            return await Promise.all(lessonsArr.map((lesson) => lessonService.createLesson(lesson)));
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons', teacherId] }),
    });

    const updateLesson = useMutation({
        mutationFn: async ({ id, ...updates }: LessonUpdate & { id: string }) => {
            return await lessonService.updateLesson(id, updates);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons', teacherId] }),
    });

    const deleteLesson = useMutation({
        mutationFn: async (id: string) => {
            await lessonService.deleteLesson(id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons', teacherId] }),
    });

    // Payment mutations
    const addPayment = useMutation({
        mutationFn: async (payment: PaymentInsert) => {
            return await paymentService.createPayment(payment);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments', teacherId] }),
    });

    const updatePayment = useMutation({
        mutationFn: async ({ id, ...updates }: PaymentUpdate & { id: string }) => {
            return await paymentService.updatePayment(id, updates);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments', teacherId] }),
    });

    const deletePayment = useMutation({
        mutationFn: async (id: string) => {
            await paymentService.deletePayment(id);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments', teacherId] }),
    });

    // Group mutations
    const addGroup = useMutation({
        mutationFn: async ({ studentIds, ...group }: GroupInsert & { studentIds: string[] }) => {
            const newGroup = await groupService.createGroup(group);
            if (studentIds.length > 0) {
                await Promise.all(
                    studentIds.map((studentId) => groupService.addStudentToGroup(newGroup.id, studentId))
                );
            }
            return newGroup;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups', teacherId] }),
    });

    const updateGroup = useMutation({
        mutationFn: async ({ id, studentIds, ...updates }: GroupUpdate & { id: string; studentIds?: string[] }) => {
            await groupService.updateGroup(id, updates);
            if (studentIds !== undefined) {
                // Remove all current members
                const currentMembers = await groupService.getGroupMembers(id);
                await Promise.all(
                    currentMembers.map((member) => groupService.removeStudentFromGroup(id, member.student_id))
                );
                // Add new members
                if (studentIds.length > 0) {
                    await Promise.all(
                        studentIds.map((studentId) => groupService.addStudentToGroup(id, studentId))
                    );
                }
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups', teacherId] }),
    });

    const deleteGroup = useMutation({
        mutationFn: async (id: string) => {
            await groupService.deleteGroup(id);
        },
        onSuccess: invalidateAll,
    });

    return {
        students,
        lessons,
        payments,
        groups,
        addStudent,
        updateStudent,
        deleteStudent,
        addLesson,
        addLessons,
        updateLesson,
        deleteLesson,
        addPayment,
        updatePayment,
        deletePayment,
        addGroup,
        updateGroup,
        deleteGroup,
    };
}
