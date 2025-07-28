import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import SessionCard from "@/components/session-card";
import CartButton from "@/components/cart-button";
import SessionCalendar from "@/components/session-calendar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


import { FutsalSession, Player } from "@shared/schema";
import { isSessionEligibleForPlayer } from "@shared/utils";

export default function Sessions() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  // Filter state - separate current values from applied values
  const [currentAgeFilter, setCurrentAgeFilter] = useState<string>("all");
  const [currentLocationFilter, setCurrentLocationFilter] = useState<string>("all");
  const [currentGenderFilter, setCurrentGenderFilter] = useState<string>("all");
  
  // Applied filters (used for API calls)
  const [appliedAgeFilter, setAppliedAgeFilter] = useState<string>("all");
  const [appliedLocationFilter, setAppliedLocationFilter] = useState<string>("all");
  const [appliedGenderFilter, setAppliedGenderFilter] = useState<string>("all");

  // Build query parameters for sessions API using applied filters
  const sessionParams = new URLSearchParams();
  if (appliedAgeFilter !== "all") sessionParams.set("ageGroup", appliedAgeFilter);
  if (appliedLocationFilter !== "all") sessionParams.set("location", appliedLocationFilter);
  if (appliedGenderFilter !== "all") sessionParams.set("gender", appliedGenderFilter);
  
  const sessionsUrl = `/api/sessions${sessionParams.toString() ? `?${sessionParams.toString()}` : ''}`;
  
  const { data: sessions = [], isLoading } = useQuery<FutsalSession[]>({
    queryKey: [sessionsUrl],
  });

  // Apply filters function
  const applyFilters = () => {
    setAppliedAgeFilter(currentAgeFilter);
    setAppliedLocationFilter(currentLocationFilter);
    setAppliedGenderFilter(currentGenderFilter);
  };

  // Get players for authenticated parents
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: isAuthenticated,
  });

  const filteredSessions = sessions.filter(session => {
    // For authenticated parents with players, only show sessions their players can book
    if (isAuthenticated && players.length > 0) {
      const isEligibleForAnyPlayer = players.some(player => isSessionEligibleForPlayer(session, player));
      if (!isEligibleForAnyPlayer) return false;
    }
    
    // Apply manual filters (using applied filter values)
    if (appliedAgeFilter !== "all" && !session.ageGroups?.includes(appliedAgeFilter)) return false;
    if (appliedLocationFilter !== "all" && session.location !== appliedLocationFilter) return false;
    if (appliedGenderFilter !== "all" && !session.genders?.includes(appliedGenderFilter)) return false;
    return true;
  });

  // Get filter options from dedicated endpoint
  const { data: filterOptions = { ageGroups: [], locations: [], genders: [] } } = useQuery({
    queryKey: ["/api/session-filters"],
  });

  // Sort the filter options for better UX
  const sortedAgeGroups = filterOptions.ageGroups.sort();
  const sortedLocations = filterOptions.locations.sort(); 
  const sortedGenders = filterOptions.genders.sort();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <section className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start sm:gap-0">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2 sm:text-3xl">Training Sessions</h1>
                <p className="text-zinc-400 text-sm sm:text-base">Find the perfect session for your young athlete</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-3 sm:gap-0">
                <Select value={currentGenderFilter} onValueChange={setCurrentGenderFilter}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 sm:w-32">
                    <SelectValue placeholder="All Genders" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="all">All Genders</SelectItem>
                    {sortedGenders.map(gender => (
                      <SelectItem key={gender} value={gender}>
                        {gender === "boys" ? "Boys" : gender === "girls" ? "Girls" : gender === "mixed" ? "Mixed" : gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={currentAgeFilter} onValueChange={setCurrentAgeFilter}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 sm:w-32">
                    <SelectValue placeholder="All Ages" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="all">All Ages</SelectItem>
                    {sortedAgeGroups.map(age => (
                      <SelectItem key={age} value={age}>{age}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={currentLocationFilter} onValueChange={setCurrentLocationFilter}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 sm:w-48">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="all">All Locations</SelectItem>
                    {sortedLocations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={applyFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  Update
                </Button>
              </div>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No sessions found matching your criteria.</p>
              <Button 
                onClick={() => {
                  setCurrentAgeFilter("all");
                  setCurrentLocationFilter("all");
                  setCurrentGenderFilter("all");
                  setAppliedAgeFilter("all");
                  setAppliedLocationFilter("all");
                  setAppliedGenderFilter("all");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 lg:grid-cols-3 lg:gap-6">
              {filteredSessions.map((session) => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  showAddToCart={false}
                  onAddToCart={(session) => {
                    addToCart(session);
                    toast({
                      title: "Added to cart",
                      description: `${session.title} added to your cart`,
                    });
                  }}
                />
              ))}
            </div>
          )}
          
          <CartButton />
          
          {/* Calendar Section - Mobile First */}
          <div className="mt-12 sm:mt-16" id="calendar">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 sm:text-3xl">Upcoming Sessions Calendar</h2>
              <p className="text-zinc-400 text-sm sm:text-base">View all scheduled training sessions at a glance</p>
            </div>
            <SessionCalendar 
              ageGroupFilter={appliedAgeFilter === "all" ? undefined : appliedAgeFilter}
              genderFilter={appliedGenderFilter === "all" ? undefined : appliedGenderFilter}
              locationFilter={appliedLocationFilter === "all" ? undefined : appliedLocationFilter}
              showBookingButtons={true}
              onSessionClick={(session) => {
                window.location.href = `/sessions/${session.id}`;
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
