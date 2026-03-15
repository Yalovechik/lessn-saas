import { useState } from "react";
import { cn } from "@/lib/utils";

interface CheckItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
}

const initialChecklist: { section: string; items: CheckItem[] }[] = [
  {
    section: "Repository Setup",
    items: [
      { id: "r1", label: "Connect GitHub repository", description: "Link the existing repo via project settings.", done: false },
      { id: "r2", label: "Verify build succeeds", description: "Ensure Vite builds without errors after import.", done: false },
      { id: "r3", label: "Document environment variables", description: "List all required env vars for deployment.", done: false },
    ],
  },
  {
    section: "Frontend Audit",
    items: [
      { id: "a1", label: "Catalog all pages and routes", description: "List every route and its corresponding page component.", done: false },
      { id: "a2", label: "Identify shared UI patterns", description: "Find repeated buttons, cards, modals, forms, etc.", done: false },
      { id: "a3", label: "Map existing CSS/style files", description: "List all .css files, inline styles, and CSS-in-JS usage.", done: false },
      { id: "a4", label: "Note responsive breakpoints", description: "Document current mobile/tablet/desktop behavior.", done: false },
    ],
  },
  {
    section: "Tailwind Conversion",
    items: [
      { id: "t1", label: "Set up design tokens in index.css", description: "Define colors, fonts, spacing in CSS variables.", done: true },
      { id: "t2", label: "Configure tailwind.config.ts", description: "Extend theme with custom tokens and utilities.", done: true },
      { id: "t3", label: "Convert global styles", description: "Replace global CSS rules with Tailwind base layer.", done: false },
      { id: "t4", label: "Convert page-level styles", description: "Replace page-specific CSS with utility classes.", done: false },
      { id: "t5", label: "Convert component styles", description: "Replace component CSS with Tailwind + CVA variants.", done: false },
      { id: "t6", label: "Remove old CSS files", description: "Delete converted CSS files and update imports.", done: false },
    ],
  },
  {
    section: "Testing & Validation",
    items: [
      { id: "v1", label: "Test all navigation routes", description: "Verify every link and route works correctly.", done: false },
      { id: "v2", label: "Test forms and CRUD flows", description: "Ensure form submissions and data operations work.", done: false },
      { id: "v3", label: "Test auth screens", description: "Verify login, signup, and password reset flows.", done: false },
      { id: "v4", label: "Test responsive layouts", description: "Check mobile, tablet, and desktop viewports.", done: false },
      { id: "v5", label: "Verify accessibility", description: "Check focus states, ARIA labels, and keyboard nav.", done: false },
    ],
  },
];

const Checklist = () => {
  const [sections, setSections] = useState(initialChecklist);

  const toggle = (sectionIdx: number, itemIdx: number) => {
    setSections((prev) =>
      prev.map((s, si) =>
        si === sectionIdx
          ? {
              ...s,
              items: s.items.map((item, ii) =>
                ii === itemIdx ? { ...item, done: !item.done } : item
              ),
            }
          : s
      )
    );
  };

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const doneItems = sections.reduce((sum, s) => sum + s.items.filter((i) => i.done).length, 0);
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Refactor Checklist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your migration progress step by step.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Overall Progress</span>
          <span className="text-sm font-semibold text-foreground">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{doneItems} of {totalItems} tasks completed</p>
      </div>

      {/* Sections */}
      {sections.map((section, si) => (
        <div key={section.section}>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
            {section.section}
          </h2>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {section.items.map((item, ii) => (
              <label
                key={item.id}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors duration-150"
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggle(si, ii)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-ring"
                />
                <div>
                  <p className={cn("text-sm font-medium", item.done ? "line-through text-muted-foreground" : "text-foreground")}>
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Checklist;
