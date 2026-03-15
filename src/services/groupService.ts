import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Group = Tables<"groups">;
export type GroupInsert = TablesInsert<"groups">;
export type GroupUpdate = TablesUpdate<"groups">;

export type GroupMember = Tables<"group_members">;
export type GroupMemberInsert = TablesInsert<"group_members">;

export const groupService = {
    /**
     * Get all groups for a teacher
     */
    async getGroupsByTeacher(teacherId: string) {
        const { data, error } = await supabase
            .from("groups")
            .select("*")
            .eq("teacher_id", teacherId)
            .order("name");

        if (error) throw error;
        return data;
    },

    /**
     * Get a single group by ID
     */
    async getGroup(groupId: string) {
        const { data, error } = await supabase
            .from("groups")
            .select("*")
            .eq("id", groupId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get group with all members
     */
    async getGroupWithMembers(groupId: string) {
        const { data: groupData, error: groupError } = await supabase
            .from("groups")
            .select("*")
            .eq("id", groupId)
            .single();

        if (groupError) throw groupError;

        const { data: members, error: membersError } = await supabase
            .from("group_members")
            .select("*")
            .eq("group_id", groupId);

        if (membersError) throw membersError;

        return { ...groupData, members };
    },

    /**
     * Create a new group
     */
    async createGroup(group: GroupInsert) {
        const { data, error } = await supabase
            .from("groups")
            .insert([group])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update an existing group
     */
    async updateGroup(groupId: string, updates: GroupUpdate) {
        const { data, error } = await supabase
            .from("groups")
            .update(updates)
            .eq("id", groupId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a group
     */
    async deleteGroup(groupId: string) {
        const { error } = await supabase
            .from("groups")
            .delete()
            .eq("id", groupId);

        if (error) throw error;
    },

    /**
     * Get groups by subject
     */
    async getGroupsBySubject(teacherId: string, subject: string) {
        const { data, error } = await supabase
            .from("groups")
            .select("*")
            .eq("teacher_id", teacherId)
            .eq("subject", subject)
            .order("name");

        if (error) throw error;
        return data;
    },

    /**
     * Add a student to a group
     */
    async addStudentToGroup(groupId: string, studentId: string) {
        const { data, error } = await supabase
            .from("group_members")
            .insert([{ group_id: groupId, student_id: studentId }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Remove a student from a group
     */
    async removeStudentFromGroup(groupId: string, studentId: string) {
        const { error } = await supabase
            .from("group_members")
            .delete()
            .eq("group_id", groupId)
            .eq("student_id", studentId);

        if (error) throw error;
    },

    /**
     * Get all members of a group
     */
    async getGroupMembers(groupId: string) {
        const { data, error } = await supabase
            .from("group_members")
            .select("*")
            .eq("group_id", groupId)
            .order("student_id");

        if (error) throw error;
        return data;
    },

    /**
     * Get groups for a specific student
     */
    async getGroupsByStudent(studentId: string) {
        const { data, error } = await supabase
            .from("group_members")
            .select("group_id, groups(*)")
            .eq("student_id", studentId);

        if (error) throw error;
        return data;
    },
};
