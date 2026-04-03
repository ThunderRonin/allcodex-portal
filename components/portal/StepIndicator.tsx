interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 py-4 px-6 border-b border-border/30 bg-card/30">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isPast = i < currentStep;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-6 h-6 rounded-none flex items-center justify-center text-[11px] font-bold ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isPast
                    ? "bg-primary/30 text-primary"
                    : "bg-muted/40 text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs ${isActive ? "text-primary" : "text-muted-foreground"}`}
                style={isActive ? { fontFamily: "var(--font-cinzel)" } : undefined}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-3 ${isPast ? "bg-primary/30" : "bg-border/40"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
