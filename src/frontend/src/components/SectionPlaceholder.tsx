import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

interface SectionPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * A polished section landing shell used as the route target for each
 * foundation-owned section. Page tasks replace the body of each page while
 * keeping this shared shell for consistent structure.
 */
export function SectionPlaceholder({
  icon: Icon,
  title,
  description,
}: SectionPlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">{description}</p>
      </div>

      <Card data-ocid="section_placeholder" className="bg-glow-primary">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="size-7" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-semibold">
              This section is coming together
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              The full experience for {title.toLowerCase()} is being built. Your
              personalized data and progress will live here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
