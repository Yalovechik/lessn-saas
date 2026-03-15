import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Lesson = Tables<"lessons">;
export type LessonInsert = TablesInsert<"lessons">;
export type LessonUpdate = TablesUpdate<"lessons">;

export const lessonService = {
    /**
     * Get all lessons for a teacher
     */
    async getLessonsByTeacher(teacherId: string) {
        const { data, error } = await supabase
            .from("lessons")
            .select("*")
            .eq("teacher_id", teacherId)
            .order("date", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get lessons for a specific student
     */
    async getLessonsByStudent(studentId: string) {
        const { data, error } = await supabase
            .from("lessons")
            .select("*")
            .eq("student_id", studentId)
            .order("date", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get lessons for a specific group
     */
    async getLessonsByGroup(groupId: string) {
        const { data, error } = await supabase
            .from("lessons")
            .select("*")
            .eq("group_id", groupId)
            .order("date", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get a single lesson by ID
     */
    async getLesson(lessonId: string) {
        const { data, error } = await supabase
            .from("lessons")
            .select("*")
            .eq("id", lessonId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get lessons within a date range
     */
    async getLessonsByDateRange(teacherId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from("lessons")
            .select("*")
            .eq("teacher_id", teacherId)
            .gte("date", startDate)
            .lte("date", endDate)
            .order("date", { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Create a new lesson
     */
    async createLesson(lesson: LessonInsert) {
        const { data, error } = await supabase
            .from("lessons")
            .insert([lesson])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update an existing lesson
     */
    async updateLesson(lessonId: string, updates: LessonUpdate) {
        const { data, error } = await supabase
            .from("lessons")
            .update(updates)
            .eq("id", lessonId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a lesson
     */
    async deleteLesson(lessonId: string) {
        const { error } = await supabase
            .from("lessons")
            .delete()
            .eq("id", lessonId);

        if (error) throw error;
    },

    /**
     * Get lessons by status
     */
    async getLessonsByStatus(teacherId: string, status: string) {
        const { data, error } = await supabase
            .from("lessons")
            .select("*")
            .eq("teacher_id", teacherId)
            .eq("status", status)
            .order("date", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get upcoming lessons for a teacher
     */
    async getUpcomingLessons(teacherId: string, days: number = 7) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
            .from("lessons")
            .select("*")
            .eq("teacher_id", teacherId)
            .gte("date", now.toISOString().split("T")[0])
            .lte("date", futureDate.toISOString().split("T")[0])
            .order("date", { ascending: true });

        if (error) throw error;
        return data;
    },
};
