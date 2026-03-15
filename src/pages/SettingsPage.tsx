const SettingsPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configuration and integration notes for your migration project.
        </p>
      </div>

      {/* GitHub Integration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">GitHub Integration</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your existing repository to enable bidirectional sync. Changes in Lovable push to GitHub automatically, and vice versa.
        </p>
        <div className="bg-secondary/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
          <p>1. Go to <span className="font-medium text-foreground">Project Settings → GitHub → Connect project</span></p>
          <p>2. Authorize the Lovable GitHub App</p>
          <p>3. Select the repository containing your existing code</p>
          <p>4. Lovable will sync and you can start refactoring</p>
        </div>
      </div>

      {/* Deployment Notes */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Deployment Notes</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This project is designed to remain deployable outside Lovable. Key considerations:
        </p>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>All dependencies are standard npm packages—no Lovable-specific runtime.</li>
          <li>Environment variables should be documented and managed per hosting platform.</li>
          <li>The Vite build produces a standard static bundle deployable anywhere.</li>
          <li>Tailwind CSS is compiled at build time—no runtime dependency.</li>
        </ul>
      </div>

      {/* Architecture Decisions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Architecture Decisions</h2>
        <div className="space-y-3">
          {[
            { decision: "Tailwind CSS for all styling", reason: "Utility-first approach ensures consistency and eliminates CSS specificity issues." },
            { decision: "CVA for component variants", reason: "class-variance-authority provides type-safe variant management for shadcn components." },
            { decision: "HSL color tokens", reason: "HSL in CSS variables enables opacity modifiers and consistent theming." },
            { decision: "Inter font family", reason: "Industry-standard UI font with excellent legibility at all sizes." },
            { decision: "No backend changes by default", reason: "Frontend refactor is isolated; backend integration is opt-in." },
          ].map((item, i) => (
            <div key={i} className="border-l-2 border-primary/30 pl-4">
              <p className="text-sm font-medium text-foreground">{item.decision}</p>
              <p className="text-xs text-muted-foreground">{item.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
