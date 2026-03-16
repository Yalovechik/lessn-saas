import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LessnLayout } from "@/components/lessn/LessnLayout";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import StudentDetails from "@/pages/StudentDetails";
import Lessons from "@/pages/Lessons";
import Payments from "@/pages/Payments";
import Groups from "@/pages/Groups";
import Schedule from "@/pages/Schedule";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
    const { user, teacher, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 28 28"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect
                                width="28"
                                height="28"
                                rx="7"
                                fill="hsl(var(--mint-dark) / 0.15)"
                            />
                            <path
                                d="M7 21V9h3.5v11"
                                stroke="hsl(var(--mint-dark))"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M5 16l5 6 8-11"
                                stroke="hsl(var(--mint-dark))"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.7"
                            />
                        </svg>
                        <div className="flex items-center gap-0">
                            <span className="text-[26px] font-bold text-foreground tracking-tight leading-none">
                                LESS
                            </span>
                            <span className="text-[26px] font-bold text-mint-dark tracking-tight leading-none">
                                N
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Завантаження...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Routes>
                <Route path="*" element={<Auth />} />
            </Routes>
        );
    }

    if (!teacher) {
        return (
            <Routes>
                <Route path="*" element={<Onboarding />} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route element={<LessnLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/students/:id" element={<StudentDetails />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/lessons" element={<Lessons />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/payments" element={<Payments />} />
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Sonner />
            <BrowserRouter>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
