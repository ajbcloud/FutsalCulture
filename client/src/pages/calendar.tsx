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
      
      const newUrl = `/calendar${cleanParams.toString() ? `?${cleanParams.toString()}` : ''}`;
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