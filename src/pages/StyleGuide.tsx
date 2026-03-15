import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const colors = [
  { name: "Primary", var: "--primary", class: "bg-primary" },
  { name: "Secondary", var: "--secondary", class: "bg-secondary" },
  { name: "Muted", var: "--muted", class: "bg-muted" },
  { name: "Accent", var: "--accent", class: "bg-accent" },
  { name: "Destructive", var: "--destructive", class: "bg-destructive" },
  { name: "Success", var: "--success", class: "bg-success" },
  { name: "Warning", var: "--warning", class: "bg-warning" },
];

const StyleGuide = () => {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Style Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reference for the design system tokens, components, and patterns used in this project.
        </p>
      </div>

      {/* Colors */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Colors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {colors.map((c) => (
            <div key={c.name} className="text-center">
              <div className={`${c.class} h-16 rounded-lg border border-border`} />
              <p className="text-xs font-medium text-foreground mt-2">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.var}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Typography</h2>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-2xl font-bold (Page Title)</p>
            <p className="text-2xl font-bold text-foreground">The quick brown fox jumps</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-lg font-semibold (Section Title)</p>
            <p className="text-lg font-semibold text-foreground">The quick brown fox jumps</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-sm font-medium (Label)</p>
            <p className="text-sm font-medium text-foreground">The quick brown fox jumps</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-sm text-muted-foreground (Body)</p>
            <p className="text-sm text-muted-foreground">The quick brown fox jumps over the lazy dog.</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-xs text-muted-foreground (Caption)</p>
            <p className="text-xs text-muted-foreground">The quick brown fox jumps over the lazy dog.</p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Buttons</h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Badges</h2>
        <div className="bg-card border border-border rounded-lg p-6 flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      {/* Spacing */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-4">Spacing Scale</h2>
        <div className="bg-card border border-border rounded-lg p-6 space-y-2">
          {[1, 2, 3, 4, 6, 8, 12, 16].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-8 text-right">{s * 4}px</span>
              <div className={`h-3 bg-primary/30 rounded`} style={{ width: `${s * 16}px` }} />
              <span className="text-xs text-muted-foreground">space-{s}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StyleGuide;
