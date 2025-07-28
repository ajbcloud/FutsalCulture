import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SessionCalendar from "@/components/session-calendar";
import Navbar from "@/components/navbar";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Calendar() {
  const [location] = useLocation();
  
  // Filter state - separate current values from applied values
  const [currentAgeFilter, setCurrentAgeFilter] = useState<string>("all");
  const [currentLocationFilter, setCurrentLocationFilter] = useState<string>("all");
  const [currentGenderFilter, setCurrentGenderFilter] = useState<string>("all");
  
  // Applied filters (used for calendar)
  const [appliedAgeFilter, setAppliedAgeFilter] = useState<string>("all");
  const [appliedLocationFilter, setAppliedLocationFilter] = useState<string>("all");
  const [appliedGenderFilter, setAppliedGenderFilter] = useState<string>("all");
  
  // Multi-player filter state (for when parent has multiple players)
  const [multiPlayerAges, setMultiPlayerAges] = useState<string[]>([]);
  const [multiPlayerGenders, setMultiPlayerGenders] = useState<string[]>([]);

  // Apply filters function
  const applyFilters = () => {
    setAppliedAgeFilter(currentAgeFilter);
    setAppliedLocationFilter(currentLocationFilter);
    setAppliedGenderFilter(currentGenderFilter);
  };

  // Check for URL parameters to auto-apply filters (same logic as sessions page)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ageParam = urlParams.get('age');
    const genderParam = urlParams.get('gender');
    const locationParam = urlParams.get('location');
    
    // Handle multi-player filters (comma-separated values)
    const agesParam = urlParams.get('ages');
    const gendersParam = urlParams.get('genders');
    
    if (ageParam) {
      setCurrentAgeFilter(ageParam);
      setAppliedAgeFilter(ageParam);
    }
    if (genderParam) {
      setCurrentGenderFilter(genderParam);
      setAppliedGenderFilter(genderParam);
    }
    if (locationParam) {
      setCurrentLocationFilter(locationParam);
      setAppliedLocationFilter(locationParam);
    }
    
    // For multiple players, store the multi-select values
    if (agesParam) {
      setMultiPlayerAges(agesParam.split(','));
    }
    if (gendersParam) {
      setMultiPlayerGenders(gendersParam.split(','));
    }
  }, []);

  // Get filter options from dedicated endpoint
  const { data: filterOptions = { ageGroups: [], locations: [], genders: [] } } = useQuery({
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

          <SessionCalendar 
            ageGroupFilter={appliedAgeFilter === "all" ? undefined : appliedAgeFilter}
            genderFilter={appliedGenderFilter === "all" ? undefined : appliedGenderFilter}
            locationFilter={appliedLocationFilter === "all" ? undefined : appliedLocationFilter}
            multiPlayerAges={multiPlayerAges}
            multiPlayerGenders={multiPlayerGenders}
            showBookingButtons={true}
            onSessionClick={handleSessionClick}
          />
        </div>
      </div>
    </>
  );
}