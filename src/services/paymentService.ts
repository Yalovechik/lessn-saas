import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Payment = Tables<"payments">;
export type PaymentInsert = TablesInsert<"payments">;
export type PaymentUpdate = TablesUpdate<"payments">;

export const paymentService = {
    /**
     * Get all payments for a teacher
     */
    async getPaymentsByTeacher(teacherId: string) {
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("teacher_id", teacherId)
            .order("date", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get all payments for a specific student
     */
    async getPaymentsByStudent(studentId: string) {
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("student_id", studentId)
            .order("date", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get a single payment by ID
     */
    async getPayment(paymentId: string) {
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("id", paymentId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get payments within a date range
     */
    async getPaymentsByDateRange(teacherId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("teacher_id", teacherId)
            .gte("date", startDate)
            .lte("date", endDate)
            .order("date", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get total earnings for a teacher in a date range
     */
    async getTotalEarnings(teacherId: string, startDate?: string, endDate?: string) {
        let query = supabase
            .from("payments")
            .select("amount")
            .eq("teacher_id", teacherId);

        if (startDate) query = query.gte("date", startDate);
        if (endDate) query = query.lte("date", endDate);

        const { data, error } = await query;

        if (error) throw error;

        const total = data?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        return total;
    },

    /**
     * Get payments for a student with teacher filter
     */
    async getPaymentsByStudentAndTeacher(studentId: string, teacherId: string) {
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("student_id", studentId)
            .eq("teacher_id", teacherId)
            .order("date", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get recent payments (last N days)
     */
    async getRecentPayments(teacherId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .eq("teacher_id", teacherId)
            .gte("date", startDate.toISOString().split("T")[0])
            .order("date", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Create a payment (typically called from Edge Function)
     */
    async createPayment(payment: PaymentInsert) {
        const { data, error } = await supabase
            .from("payments")
            .insert([payment])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a payment (typically called from Edge Function)
     */
    async updatePayment(paymentId: string, updates: PaymentUpdate) {
        const { data, error } = await supabase
            .from("payments")
            .update(updates)
            .eq("id", paymentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a payment (typically called from Edge Function)
     */
    async deletePayment(paymentId: string) {
        const { error } = await supabase
            .from("payments")
            .delete()
            .eq("id", paymentId);

        if (error) throw error;
    },
};
