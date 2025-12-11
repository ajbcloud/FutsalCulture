import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserCircle, GraduationCap, ChevronDown } from "lucide-react";

type ActiveRole = "coach" | "parent";

export function RoleSwitcher() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeRole, setActiveRole] = useState<ActiveRole>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("activeRole") as ActiveRole) || "coach";
    }
    return "coach";
  });

  // Check if user has any players registered (making them a parent)
  const { data: playersData } = useQuery<any[]>({
    queryKey: ['/api/players'],
    enabled: isAuthenticated && user?.isAssistant === true,
  });

  const hasPlayers = (playersData?.length || 0) > 0;
  
  // Only show role switcher when user is BOTH a coach (isAssistant) AND has players (is a parent)
  // Pure coaches without players should not see this dropdown
  const shouldShowSwitcher = user?.isAssistant && user?.tenantId && hasPlayers;

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("activeRole", activeRole);
    }
  }, [activeRole]);

  if (!shouldShowSwitcher) {
    return null;
  }

  const handleSwitch = (role: ActiveRole) => {
    setActiveRole(role);
    if (role === "parent") {
      setLocation("/dashboard");
    } else {
      setLocation("/coach/dashboard");
    }
  };

  const CurrentIcon = activeRole === "coach" ? GraduationCap : UserCircle;
  const currentLabel = activeRole === "coach" ? "Coach View" : "Parent View";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          data-testid="role-switcher-button"
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => handleSwitch("parent")}
          className={`cursor-pointer ${activeRole === "parent" ? "bg-accent" : ""}`}
          data-testid="role-switcher-parent"
        >
          <UserCircle className="mr-2 h-4 w-4" />
          Parent View
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSwitch("coach")}
          className={`cursor-pointer ${activeRole === "coach" ? "bg-accent" : ""}`}
          data-testid="role-switcher-coach"
        >
          <GraduationCap className="mr-2 h-4 w-4" />
          Coach View
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
