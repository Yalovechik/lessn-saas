import { Layers, CheckSquare, FileCode, AlertTriangle } from "lucide-react";

const stats = [
  { label: "Components Identified", value: "0", icon: Layers, note: "Run audit to detect" },
  { label: "Refactor Tasks", value: "0", icon: CheckSquare, note: "Add from checklist" },
  { label: "Files to Convert", value: "0", icon: FileCode, note: "Connect repo to scan" },
  { label: "Blockers", value: "0", icon: AlertTriangle, note: "None detected" },
];

const steps = [
  {
    step: 1,
    title: "Connect Your Repository",
    description: "Link your existing GitHub repository to this Lovable project via Settings → GitHub. This enables bidirectional sync so changes flow both ways.",
    status: "pending" as const,
  },
  {
    step: 2,
    title: "Audit Existing Frontend",
    description: "Review your pages, layouts, forms, navigation, modals, and tables. Catalog all shared UI elements and identify custom CSS or inline styles to convert.",
    status: "pending" as const,
  },
  {
    step: 3,
    title: "Map Component Structure",
    description: "Use the Components page to plan your reusable primitives: buttons, cards, inputs, badges, tables, and layout wrappers. Map existing elements to new components.",
    status: "pending" as const,
  },
  {
    step: 4,
    title: "Convert Styles to Tailwind",
    description: "Systematically replace custom CSS, inline styles, and scattered class patterns with Tailwind utility classes. Use the Style Guide as your reference.",
    status: "pending" as const,
  },
  {
    step: 5,
    title: "Test & Validate",
    description: "Verify all user flows work: navigation, forms, CRUD operations, auth screens, and responsive breakpoints. Use the Checklist to track progress.",
    status: "pending" as const,
  },
];

const Index = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Migration Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your frontend refactor from legacy styles to Tailwind CSS.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.note}</p>
          </div>
        ))}
      </div>

      {/* Migration Steps */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Migration Workflow</h2>
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.step} className="bg-card border border-border rounded-lg p-4 flex gap-4">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                {step.step}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-sm font-semibold text-foreground mb-2">📝 Integration Notes</h2>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>This project is designed to sync with your existing GitHub repository.</li>
          <li>All business logic and data flow should be preserved during migration.</li>
          <li>Backend changes are out of scope unless required by the frontend refactor.</li>
          <li>The owner should be able to deploy and maintain this codebase independently.</li>
        </ul>
      </div>
    </div>
  );
};

export default Index;
