import { Outlet, useLocation } from "react-router-dom";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { LessnSidebar } from "./LessnSidebar";
import { LessnMobileNav } from "./LessnMobileNav";

export function LessnLayout() {
    const isMobile = useMediaQuery("(max-width: 720px)");
    const { pathname } = useLocation();

    return (
        <div>
            {isMobile ? <LessnMobileNav /> : <LessnSidebar />}
            <main
                className={
                    isMobile
                        ? "px-4 pt-5 pb-20"
                        : "ml-60 px-10 pt-8 pb-10 min-h-screen"
                }
            >
                <div key={pathname} className="page-enter">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
