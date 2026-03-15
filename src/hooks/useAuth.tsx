import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { teacherService, type Teacher } from "@/services";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    teacher: Teacher | null;
    loading: boolean;
    authEvent: string | null;
    signUp: (email: string, password: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    createTeacher: (name: string, subject: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const [authEvent, setAuthEvent] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchTeacher(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            setAuthEvent(event);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchTeacher(session.user.id);
            } else {
                setTeacher(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchTeacher = async (userId: string) => {
        try {
            const data = await teacherService.getTeacherByUserId(userId);
            setTeacher(data);
        } catch (error) {
            setTeacher(null);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setTeacher(null);
    };

    const createTeacher = async (name: string, subject: string) => {
        if (!user) throw new Error("Not authenticated");
        const newTeacher = await teacherService.createTeacher({
            user_id: user.id,
            name,
            subject,
        });
        setTeacher(newTeacher);
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) throw error;
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                teacher,
                loading,
                authEvent,
                signUp,
                signIn,
                signOut,
                createTeacher,
                resetPassword,
                updatePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}
