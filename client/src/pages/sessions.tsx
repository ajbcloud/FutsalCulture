import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import SessionCard from "@/components/session-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FutsalSession } from "@shared/schema";

export default function Sessions() {
  const [ageFilter, setAgeFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");

  const { data: sessions = [], isLoading } = useQuery<FutsalSession[]>({
    queryKey: ["/api/sessions", { ageGroup: ageFilter, location: locationFilter }],
  });

  const filteredSessions = sessions.filter(session => {
    if (ageFilter && session.ageGroup !== ageFilter) return false;
    if (locationFilter && session.location !== locationFilter) return false;
    return true;
  });

  const uniqueAgeGroups = [...new Set(sessions.map(s => s.ageGroup))];
  const uniqueLocations = [...new Set(sessions.map(s => s.location))];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Sessions</h1>
              <p className="text-gray-600 mt-2">Find the perfect session for your young athlete</p>
            </div>
            <div className="flex space-x-4">
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Ages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Ages</SelectItem>
                  {uniqueAgeGroups.map(age => (
                    <SelectItem key={age} value={age}>{age}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  {uniqueLocations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No sessions found matching your criteria.</p>
              <Button 
                onClick={() => {
                  setAgeFilter("");
                  setLocationFilter("");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
