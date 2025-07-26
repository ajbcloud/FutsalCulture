import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import SessionCard from "@/components/session-card";
import CartButton from "@/components/cart-button";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FutsalSession } from "@shared/schema";

export default function Sessions() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [ageFilter, setAgeFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [cartMode, setCartMode] = useState(false);

  const { data: sessions = [], isLoading } = useQuery<FutsalSession[]>({
    queryKey: ["/api/sessions", { ageGroup: ageFilter, location: locationFilter, gender: genderFilter }],
  });

  const filteredSessions = sessions.filter(session => {
    if (ageFilter && ageFilter !== "all" && session.ageGroup !== ageFilter) return false;
    if (locationFilter && locationFilter !== "all" && session.location !== locationFilter) return false;
    if (genderFilter && genderFilter !== "all" && session.gender !== genderFilter) return false;
    return true;
  });

  const uniqueAgeGroups = Array.from(new Set(sessions.map(s => s.ageGroup)));
  const uniqueLocations = Array.from(new Set(sessions.map(s => s.location)));
  const uniqueGenders = Array.from(new Set(sessions.map(s => s.gender)));

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
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Training Sessions</h1>
              <p className="text-zinc-400 mt-2">Find the perfect session for your young athlete</p>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="cart-mode"
                    checked={cartMode}
                    onCheckedChange={setCartMode}
                  />
                  <Label htmlFor="cart-mode" className="text-white text-sm">Multi-select mode</Label>
                </div>
              )}
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-32 bg-zinc-900 border-zinc-700">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all">All Genders</SelectItem>
                  {uniqueGenders.map(gender => (
                    <SelectItem key={gender} value={gender}>
                      {gender === "boys" ? "Boys" : "Girls"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger className="w-32 bg-zinc-900 border-zinc-700">
                  <SelectValue placeholder="All Ages" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all">All Ages</SelectItem>
                  {uniqueAgeGroups.map(age => (
                    <SelectItem key={age} value={age}>{age}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-48 bg-zinc-900 border-zinc-700">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all">All Locations</SelectItem>
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
                  setAgeFilter("all");
                  setLocationFilter("all");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session) => (
                <SessionCard 
                  key={session.id} 
                  session={session} 
                  showAddToCart={cartMode}
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
        </div>
      </section>
    </div>
  );
}
