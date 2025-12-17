import { cn } from "@/lib/utils";

interface SkoreHQLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "light" | "dark";
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

const ballSizes = {
  sm: 20,
  md: 26,
  lg: 32,
  xl: 40,
};

function SoccerBall({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      style={{ marginTop: "-0.1em" }}
    >
      <circle cx="12" cy="12" r="11" fill="currentColor" stroke="currentColor" strokeWidth="1" />
      <path
        d="M12 1C12 1 12 5 12 6.5M12 1C7.5 1 4 3.5 2.5 7M12 1C16.5 1 20 3.5 21.5 7M12 6.5L8 9.5M12 6.5L16 9.5M2.5 7L6 8.5M2.5 7C1.5 9.5 1.5 12.5 2.5 15M6 8.5L8 9.5M6 8.5L4.5 12.5M8 9.5L9 13.5M21.5 7L18 8.5M21.5 7C22.5 9.5 22.5 12.5 21.5 15M18 8.5L16 9.5M18 8.5L19.5 12.5M16 9.5L15 13.5M4.5 12.5L6.5 15.5M4.5 12.5L2.5 15M9 13.5L6.5 15.5M9 13.5L12 15M9 13.5L15 13.5M2.5 15C4 18.5 7.5 21 12 21M6.5 15.5L9 18.5M19.5 12.5L17.5 15.5M19.5 12.5L21.5 15M15 13.5L17.5 15.5M15 13.5L12 15M21.5 15C20 18.5 16.5 21 12 21M17.5 15.5L15 18.5M12 15L12 17.5M12 17.5L9 18.5M12 17.5L15 18.5M9 18.5L12 21M15 18.5L12 21"
        stroke="white"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <polygon
        points="12,6.5 8,9.5 9,13.5 15,13.5 16,9.5"
        fill="white"
        opacity="0.15"
      />
    </svg>
  );
}

export function SkoreHQLogo({ size = "md", className, variant = "dark" }: SkoreHQLogoProps) {
  const textColor = variant === "light" ? "text-white" : "text-gray-900 dark:text-white";
  
  return (
    <span
      className={cn(
        "font-extrabold tracking-tight inline-flex items-center",
        sizeClasses[size],
        textColor,
        className
      )}
      data-testid="logo-skorehq"
    >
      <span>Sk</span>
      <SoccerBall size={ballSizes[size]} className={textColor} />
      <span>reHQ</span>
    </span>
  );
}

export default SkoreHQLogo;
