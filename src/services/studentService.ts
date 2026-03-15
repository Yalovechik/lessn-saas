import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Student = Tables<"students">;
export type StudentInsert = TablesInsert<"students">;
export type StudentUpdate = TablesUpdate<"students">;

export const studentService = {
    /**
     * Get all students for a specific teacher
     */
    async getStudentsByTeacher(teacherId: string) {
        const { data, error } = await supabase
            .from("students")
            .select("*")
            .eq("teacher_id", teacherId)
            .order("name");

        if (error) throw error;
        return data;
    },

    /**
     * Get a single student by ID
     */
    async getStudent(studentId: string) {
        const { data, error } = await supabase
            .from("students")
            .select("*")
            .eq("id", studentId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new student
     */
    async createStudent(student: StudentInsert) {
        const { data, error } = await supabase
            .from("students")
            .insert([student])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update an existing student
     */
    async updateStudent(studentId: string, updates: StudentUpdate) {
        const { data, error } = await supabase
            .from("students")
            .update(updates)
            .eq("id", studentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a student
     */
    async deleteStudent(studentId: string) {
        const { error } = await supabase
            .from("students")
            .delete()
            .eq("id", studentId);

        if (error) throw error;
    },

    /**
     * Search students by name within a teacher's students
     */
    async searchStudents(teacherId: string, query: string) {
        const { data, error } = await supabase
            .from("students")
            .select("*")
            .eq("teacher_id", teacherId)
            .ilike("name", `%${query}%`)
            .order("name");

        if (error) throw error;
        return data;
    },

    /**
     * Get students by subject
     */
    async getStudentsBySubject(teacherId: string, subject: string) {
        const { data, error } = await supabase
            .from("students")
            .select("*")
            .eq("teacher_id", teacherId)
            .eq("subject", subject)
            .order("name");

        if (error) throw error;
        return data;
    },
};
