import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Home } from "lucide-react";
import { players } from "@shared/schema";

type Player = typeof players.$inferSelect;

const playerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthYear: z.number().min(2000).max(new Date().getFullYear() - 4, "Child must be at least 4 years old"),
  gender: z.enum(["boys", "girls"], { required_error: "Gender is required" }),
  soccerClub: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
});

type PlayerForm = z.infer<typeof playerSchema>;

interface PlayerFormProps {
  player?: Player | null;
  onSuccess?: () => void;
}

type AgePolicy = {
  audienceMode?: 'youth_only' | 'mixed' | 'adult_only';
  adultAge?: number;
  householdPolicy?: {
    householdRequired: boolean;
    requiresHouseholdForMinors: boolean;
    adultCanSkipHousehold: boolean;
    description: string;
  };
};

type HouseholdMember = { userId?: string | null };
type Household = { members: HouseholdMember[] };

export default function PlayerForm({ player, onSuccess }: PlayerFormProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const form = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      firstName: player?.firstName || "",
      lastName: player?.lastName || "",
      birthYear: player?.birthYear || new Date().getFullYear() - 8,
      gender: player?.gender || "boys",
      soccerClub: player?.soccerClub || "",
      email: player?.email || "",
      phoneNumber: player?.phoneNumber || "",
    },
  });
  
  // Fetch age policy to determine household requirements
  const { data: agePolicy } = useQuery<AgePolicy>({
    queryKey: ["/api/tenant/age-policy"],
    queryFn: () => fetch("/api/tenant/age-policy", { credentials: 'include' }).then(res => res.json()),
    enabled: isAuthenticated,
  });

  // Fetch households to check if user has a household
  const { data: households = [] } = useQuery<Household[]>({
    queryKey: ["/api/households"],
    enabled: isAuthenticated && !!user?.tenantId,
  });

  const userHasHousehold = households.some(h => 
    h.members?.some(m => m.userId === user?.id)
  );

  // Watch birth year changes to show/hide contact fields dynamically
  const watchedBirthYear = form.watch('birthYear');
  const currentYear = new Date().getFullYear();
  const playerAge = currentYear - watchedBirthYear;
  const isEligibleForPortal = playerAge >= 13;

  // Determine if this player needs a household based on age policy
  const adultAge = agePolicy?.adultAge || 18;
  const isMinor = playerAge < adultAge;
  const isMixedMode = agePolicy?.audienceMode === 'mixed';
  const requiresHouseholdForMinors = agePolicy?.householdPolicy?.requiresHouseholdForMinors === true;
  
  // In mixed mode, minors need household but adults don't
  const minorNeedsHousehold = isMixedMode && requiresHouseholdForMinors && isMinor && !userHasHousehold;

  const createPlayerMutation = useMutation({
    mutationFn: async (data: PlayerForm) => {
      const response = await apiRequest("POST", "/api/players", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add player");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player added successfully",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to add player",
        variant: "destructive",
      });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async (data: PlayerForm) => {
      const response = await apiRequest("PUT", `/api/players/${player!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player updated successfully",
      });
      onSuccess?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update player",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlayerForm) => {
    // Block submission if minor needs household in mixed mode
    if (minorNeedsHousehold && !player) {
      toast({
        title: "Household Required",
        description: "Players under " + adultAge + " require a household. Please create a household first.",
        variant: "destructive",
      });
      return;
    }
    
    if (player) {
      updatePlayerMutation.mutate(data);
    } else {
      createPlayerMutation.mutate(data);
    }
  };

  const isLoading = createPlayerMutation.isPending || updatePlayerMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Warning for minor players without household in mixed mode */}
        {minorNeedsHousehold && !player && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Players under {adultAge} require a household. Please create a household first or change the birth year to add an adult player.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="birthYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birth Year</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="soccerClub"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Soccer Club</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Boca FC Youth" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contact fields for portal-eligible players */}
        {isEligibleForPortal && (
          <>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                Portal Access Contact Information (Age 13+)
              </div>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="player@example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : player ? "Update Player" : "Add Player"}
        </Button>
      </form>
    </Form>
  );
}
