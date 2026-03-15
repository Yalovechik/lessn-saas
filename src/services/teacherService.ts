import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Teacher = Tables<"teachers">;
export type TeacherInsert = TablesInsert<"teachers">;
export type TeacherUpdate = TablesUpdate<"teachers">;

export const teacherService = {
    /**
     * Get a teacher by ID
     */
    async getTeacher(teacherId: string) {
        const { data, error } = await supabase
            .from("teachers")
            .select("*")
            .eq("id", teacherId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get a teacher by user ID
     */
    async getTeacherByUserId(userId: string) {
        const { data, error } = await supabase
            .from("teachers")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get teachers by subject
     */
    async getTeachersBySubject(subject: string) {
        const { data, error } = await supabase
            .from("teachers")
            .select("*")
            .eq("subject", subject);

        if (error) throw error;
        return data;
    },

    /**
     * Create a new teacher
     */
    async createTeacher(teacher: TeacherInsert) {
        const { data, error } = await supabase
            .from("teachers")
            .insert([teacher])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a teacher
     */
    async updateTeacher(teacherId: string, updates: TeacherUpdate) {
        const { data, error } = await supabase
            .from("teachers")
            .update(updates)
            .eq("id", teacherId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a teacher
     */
    async deleteTeacher(teacherId: string) {
        const { error } = await supabase
            .from("teachers")
            .delete()
            .eq("id", teacherId);

        if (error) throw error;
    },

    /**
     * Get all teachers (admin-only operation)
     */
    async getAllTeachers() {
        const { data, error } = await supabase
            .from("teachers")
            .select("*")
            .order("name");

        if (error) throw error;
        return data;
    },

    /**
     * Get teacher aggregated data (students, groups, lessons count)
     */
    async getTeacherStats(teacherId: string) {
        // Get students count
        const { data: students, error: studentsError } = await supabase
            .from("students")
            .select("id", { count: "exact" })
            .eq("teacher_id", teacherId);

        // Get groups count
        const { data: groups, error: groupsError } = await supabase
            .from("groups")
            .select("id", { count: "exact" })
            .eq("teacher_id", teacherId);

        // Get lessons count
        const { data: lessons, error: lessonsError } = await supabase
            .from("lessons")
            .select("id", { count: "exact" })
            .eq("teacher_id", teacherId);

        if (studentsError || groupsError || lessonsError) {
            throw studentsError || groupsError || lessonsError;
        }

        return {
            studentCount: students?.length || 0,
            groupCount: groups?.length || 0,
            lessonCount: lessons?.length || 0,
        };
    },
};
