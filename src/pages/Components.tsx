import { Badge } from "@/components/ui/badge";

const componentCategories = [
  {
    category: "Layout",
    items: [
      { name: "AppLayout", description: "Main layout with sidebar and content area", status: "ready" },
      { name: "PageHeader", description: "Consistent page title and description block", status: "planned" },
      { name: "CardGrid", description: "Responsive grid for card-based content", status: "planned" },
    ],
  },
  {
    category: "Navigation",
    items: [
      { name: "Sidebar", description: "Persistent left-aligned navigation", status: "ready" },
      { name: "MobileNav", description: "Hamburger menu for mobile viewports", status: "ready" },
      { name: "Breadcrumbs", description: "Hierarchical page location indicator", status: "planned" },
    ],
  },
  {
    category: "Data Display",
    items: [
      { name: "DataTable", description: "Sortable, filterable table with pagination", status: "planned" },
      { name: "StatCard", description: "Metric card with icon and label", status: "ready" },
      { name: "EmptyState", description: "Placeholder for empty data views", status: "planned" },
    ],
  },
  {
    category: "Forms & Inputs",
    items: [
      { name: "FormField", description: "Label + input + error message wrapper", status: "planned" },
      { name: "SearchInput", description: "Search bar with icon and clear button", status: "planned" },
      { name: "SelectDropdown", description: "Styled select with options", status: "planned" },
    ],
  },
  {
    category: "Feedback",
    items: [
      { name: "Toast", description: "Notification messages (success, error, info)", status: "ready" },
      { name: "ConfirmDialog", description: "Destructive action confirmation modal", status: "planned" },
      { name: "ProgressBar", description: "Visual progress indicator", status: "planned" },
    ],
  },
];

const statusColor = (status: string) => {
  if (status === "ready") return "default";
  return "secondary";
};

const Components = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Component Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Map your existing UI elements to reusable components. Mark status as you build.
        </p>
      </div>

      {componentCategories.map((cat) => (
        <div key={cat.category}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">{cat.category}</h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {cat.items.map((item) => (
              <div key={item.name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Badge variant={statusColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Components;
