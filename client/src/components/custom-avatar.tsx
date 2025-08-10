import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface CustomAvatarProps {
  src?: string;
  alt?: string;
  fallbackText?: string;
  backgroundColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8", 
  lg: "h-10 w-10"
};

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base"
};

// Function to calculate if a color is light or dark
function isLightColor(color: string): boolean {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function CustomAvatar({ 
  src, 
  alt, 
  fallbackText, 
  backgroundColor = "#2563eb",
  size = "md",
  className = ""
}: CustomAvatarProps) {
  const textColor = isLightColor(backgroundColor) ? "#000000" : "#ffffff";
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback 
        className={`${textSizes[size]} font-medium`}
        style={{ backgroundColor, color: textColor }}
        data-testid="avatar-fallback"
      >
        {fallbackText || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}