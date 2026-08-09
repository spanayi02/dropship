import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrderTrackingStep {
  name: string;
  timestamp: string;
  isCompleted: boolean;
}

interface OrderTrackingProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: OrderTrackingStep[];
}

function OrderTracking({ steps = [], className, ...props }: OrderTrackingProps) {
  return (
    <div data-slot="order-tracking" className={cn("w-full", className)} {...props}>
      {steps.length > 0 ? (
        steps.map((step, index) => (
          <div key={step.name} className="flex">
            <div className="flex flex-col items-center">
              {step.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--emerald)]" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
              )}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-px grow",
                    steps[index + 1].isCompleted ? "bg-[var(--emerald)]" : "bg-border"
                  )}
                />
              )}
            </div>
            <div className="ml-3 pb-6">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{step.timestamp}</p>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">This order has no tracking information.</p>
      )}
    </div>
  );
}

export { OrderTracking };
