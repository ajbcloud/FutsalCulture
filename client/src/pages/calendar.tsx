import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SessionCalendar from "@/components/session-calendar";
import Navbar from "@/components/navbar";
import MultiSelectFilter from "@/components/multi-select-filter";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Calendar() {
  const [location] = useLocation();
  
  // Multi-select filter state
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  
  // Applied filters (used for filtering)
  const [appliedAges, setAppliedAges] = useState<string[]>([]);
  const [appliedGenders, setAppliedGenders] = useState<string[]>([]);
  const [appliedLocations, setAppliedLocations] = useState<string[]>([]);

  // Apply filters function
  const applyFilters = () => {
    setAppliedAges(selectedAges);
    setAppliedGenders(selectedGenders);
    setAppliedLocations(selectedLocations);
  };

  // Clear filters when navigating from dashboard "View Full Schedule"
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // If there are URL parameters (from dashboard navigation), clear them
    // This ensures users start with empty filters and can choose their own
    if (urlParams.toString()) {
      // Clear URL parameters without reloading the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Always start with empty filters on calendar page
    setSelectedAges([]);
    setSelectedGenders([]);
    setSelectedLocations([]);
    setAppliedAges([]);
    setAppliedGenders([]);
    setAppliedLocations([]);
  }, []);

  // Get filter options from dedicated endpoint
  const { data: filterOptions = { ageGroups: [], locations: [], genders: [] } } = useQuery<{
    ageGroups: string[];
    locations: string[];
    genders: string[];
  }>({
    queryKey: ["/api/session-filters"],
  });

  // Sort the filter options for better UX
  const sortedAgeGroups = filterOptions.ageGroups.sort();
  const sortedLocations = filterOptions.locations.sort(); 
  const sortedGenders = filterOptions.genders.sort();
  
  // Check if we're in admin context by looking at the URL
  const isAdminContext = location.startsWith('/admin/calendar');

  const handleSessionClick = (session: any) => {
    window.location.href = `/sessions/${session.id}`;
  };

  // Always show the parent/player portal calendar view
  // Admin calendar should be at /admin/calendar
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#18181b] text-white">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start sm:gap-0">
              <div className="text-center sm:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Session Calendar</h1>
                <p className="text-zinc-400 text-lg">View all upcoming futsal training sessions</p>
              </div>
              
              {/* Filter Controls */}
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>

          <SessionCalendar 
            multiPlayerAges={appliedAges}
            multiPlayerGenders={appliedGenders}
            locationFilter={appliedLocations.length === 1 ? appliedLocations[0] : undefined}
            showBookingButtons={true}
            onSessionClick={handleSessionClick}
          />
        </div>
      </div>
    </>
  );
}