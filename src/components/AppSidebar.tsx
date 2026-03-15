import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Layers, CheckSquare, FileText, Settings, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/components", label: "Components", icon: Layers },
  { to: "/checklist", label: "Refactor Checklist", icon: CheckSquare },
  { to: "/styleguide", label: "Style Guide", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 h-14 px-4 border-b border-border">
        <GitBranch className="h-5 w-5 text-primary" />
        <span className="font-semibold text-foreground text-sm">Migration Hub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Tailwind Migration Tool</p>
        <p className="text-xs text-muted-foreground">v1.0.0</p>
      </div>
    </aside>
  );
};

export default AppSidebar;
