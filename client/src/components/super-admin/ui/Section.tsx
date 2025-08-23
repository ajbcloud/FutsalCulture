import { cn } from '@/lib/utils';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Section({ title, subtitle, children, className }: SectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || subtitle) && (
        <div>
          {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}