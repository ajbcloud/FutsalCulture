import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import SessionCard from "@/components/session-card";
import CartButton from "@/components/cart-button";
import SessionCalendar from "@/components/session-calendar";
import MultiSelectFilter from "@/components/multi-select-filter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FutsalSession, Player } from "@shared/schema";
import { isSessionEligibleForPlayer } from "@shared/utils";

export default function Sessions() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  // Multi-select filter state
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  
  // Applied filters (used for filtering)
  const [appliedAges, setAppliedAges] = useState<string[]>([]);
  const [appliedGenders, setAppliedGenders] = useState<string[]>([]);
  const [appliedLocations, setAppliedLocations] = useState<string[]>([]);

  // Handle different navigation scenarios from dashboard
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isEligibleOnly = urlParams.get('eligibleOnly') === 'true';
    
    if (isEligibleOnly) {
      // Coming from "View All Eligible Sessions" - apply the filters
      const ageParam = urlParams.get('age');
      const genderParam = urlParams.get('gender');
      const locationParam = urlParams.get('location');
      
      // Handle multi-player filters (comma-separated values from dashboard)
      const agesParam = urlParams.get('ages');
      const gendersParam = urlParams.get('genders');
      const locationsParam = urlParams.get('locations');
      
      // Single value filters
      const initialAges: string[] = [];
      const initialGenders: string[] = [];
      const initialLocations: string[] = [];
      
      if (ageParam) initialAges.push(ageParam);
      if (genderParam) initialGenders.push(genderParam);
      if (locationParam) initialLocations.push(locationParam);
      
      // Multi-value filters (from dashboard with multiple players)
      if (agesParam) {
        initialAges.push(...agesParam.split(','));
      }
      if (gendersParam) {
        initialGenders.push(...gendersParam.split(','));
      }
      if (locationsParam) {
        initialLocations.push(...locationsParam.split(','));
      }
      
      // Remove duplicates and set filters
      const uniqueAges = Array.from(new Set(initialAges));
      const uniqueGenders = Array.from(new Set(initialGenders));
      const uniqueLocations = Array.from(new Set(initialLocations));
      
      setSelectedAges(uniqueAges);
      setSelectedGenders(uniqueGenders);
      setSelectedLocations(uniqueLocations);
      setAppliedAges(uniqueAges);
      setAppliedGenders(uniqueGenders);
      setAppliedLocations(uniqueLocations);
      
      // Clean up URL by removing the eligibleOnly flag but keeping the filters visible
      const cleanParams = new URLSearchParams();
      if (uniqueAges.length > 0) cleanParams.set('ages', uniqueAges.join(','));
      if (uniqueGenders.length > 0) cleanParams.set('genders', uniqueGenders.join(','));
      if (uniqueLocations.length > 0) cleanParams.set('locations', uniqueLocations.join(','));
      
      const newUrl = `/sessions${cleanParams.toString() ? `?${cleanParams.toString()}` : ''}`;
      window.history.replaceState({}, document.title, newUrl);
    } else {
      // Coming from "View Full Schedule" or direct navigation - clear all filters
      if (urlParams.toString()) {
        // Clear URL parameters without reloading the page
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Start with empty filters
      setSelectedAges([]);
      setSelectedGenders([]);
      setSelectedLocations([]);
      setAppliedAges([]);
      setAppliedGenders([]);
      setAppliedLocations([]);
    }
  }, []);

  // Get all sessions without server-side filtering (we'll filter client-side for multi-select)
  const { data: sessions = [], isLoading } = useQuery<FutsalSession[]>({
    queryKey: ["/api/sessions"],
  });

  // Apply filters function
  const applyFilters = () => {
    setAppliedAges(selectedAges);
    setAppliedGenders(selectedGenders);
    setAppliedLocations(selectedLocations);
  };

  // Get players for authenticated parents
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: isAuthenticated,
  });

  const filteredSessions = sessions.filter(session => {
    // Filter by date: only show current day or future sessions up to 2 weeks out
    const sessionDate = new Date(session.startTime);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const twoWeeksFromToday = new Date(todayStart.getTime() + (14 * 24 * 60 * 60 * 1000));
    
    if (sessionDate < todayStart || sessionDate > twoWeeksFromToday) {
      return false;
    }
    
    // Apply multi-select filters
    if (appliedAges.length > 0) {
      const ageMatch = session.ageGroups?.some(age => appliedAges.includes(age));
      if (!ageMatch) return false;
    }
    
    if (appliedGenders.length > 0) {
      const genderMatch = session.genders?.some(gender => appliedGenders.includes(gender));
      if (!genderMatch) return false;
    }
    
    if (appliedLocations.length > 0) {
      const locationMatch = appliedLocations.includes(session.location);
      if (!locationMatch) return false;
    }
    
    // If no filters applied but user is authenticated, show only eligible sessions
    if (appliedAges.length === 0 && appliedGenders.length === 0 && isAuthenticated && players.length > 0) {
      const isEligibleForAnyPlayer = players.some(player => isSessionEligibleForPlayer(session, player));
      if (!isEligibleForAnyPlayer) return false;
    }
    
    return true;
  });

  // Get filter options from dedicated endpoint
  const { data: filterOptions = { ageGroups: [], locations: [], genders: [] } } = useQuery<{
    ageGroups: string[];
    locations: string[];
    genders: string[];
  }>({
    queryKey: ["/api/session-filters"],
  });

  // Sort the filter options for better UX
  const sortedAgeGroups = filterOptions.ageGroups.sort((a, b) => {
    // Extract numeric value from age group (e.g., "U8" -> 8)
    const aNum = parseInt(a.substring(1));
    const bNum = parseInt(b.substring(1));
    return aNum - bNum;
  });
  const sortedLocations = filterOptions.locations.sort(); 
  const sortedGenders = filterOptions.genders.sort();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <section className="py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start sm:gap-0">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2 sm:text-3xl">Training Sessions</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Find the perfect session for your young athlete</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-3 sm:gap-0">
                <MultiSelectFilter
                  title="Age Groups"
                  options={sortedAgeGroups}
                  selectedValues={selectedAges}
                  onSelectionChange={setSelectedAges}
                  placeholder="All Ages"
                />
                
                <MultiSelectFilter
                  title="Genders"
                  options={sortedGenders}
                  selectedValues={selectedGenders}
                  onSelectionChange={setSelectedGenders}
                  placeholder="All Genders"
                />
                
                <MultiSelectFilter
                  title="Locations"
                  options={sortedLocations}
                  selectedValues={selectedLocations}
                  onSelectionChange={setSelectedLocations}
                  placeholder="All Locations"
                />
                
                <Button 
                  onClick={applyFilters}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="list" className="data-[state=active]:bg-background">List View</TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-background">Calendar View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-6">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No sessions found matching your criteria.</p>
                  <Button 
                    onClick={() => {
                      setSelectedAges([]);
                      setSelectedGenders([]);
                      setSelectedLocations([]);
                      setAppliedAges([]);
                      setAppliedGenders([]);
                      setAppliedLocations([]);
                    }}
                    className="mt-4"
                    variant="outline"
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onAddToCart={(session) => {
                        addToCart(session);
                        toast({
                          title: "Added to Cart",
                          description: `${session.title} has been added to your cart.`,
                        });
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-6">
              <SessionCalendar
                multiPlayerAges={appliedAges}
                multiPlayerGenders={appliedGenders}
                locationFilter={appliedLocations.length === 1 ? appliedLocations[0] : undefined}
                showBookingButtons={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      <CartButton />
    </div>
  );
}