import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const usStates = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" }
];

export default function ClubSetup() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    org_name: "",
    contact_name: "",
    contact_email: "",
    city: "",
    state: "",
    country: "US"
  });
  const [loading, setLoading] = useState(false);
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (!isSignedIn) {
    navigate("/club-signup");
    return null;
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.org_name || !formData.contact_name || !formData.contact_email) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/club-signup", formData);
      
      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Club created!",
          description: `${data.tenant.name} is ready. Invite code: ${data.tenant.inviteCode}`,
        });
        
        navigate("/admin");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create club");
      }
    } catch (error: any) {
      console.error("Error creating club:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create your club. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1629] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl dark:text-white">Set up your club</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Enter your organization details to complete setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org_name" className="dark:text-gray-300">
                Organization/Club Name *
              </Label>
              <Input
                id="org_name"
                value={formData.org_name}
                onChange={(e) => setFormData(prev => ({ ...prev, org_name: e.target.value }))}
                placeholder="e.g., City United FC"
                required
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                data-testid="input-org-name"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will also be your invite code (e.g., city-united-fc)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_name" className="dark:text-gray-300">
                Your Name *
              </Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder="Your full name"
                required
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                data-testid="input-contact-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="dark:text-gray-300">
                Contact Email *
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="you@yourclub.com"
                required
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                data-testid="input-contact-email"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="dark:text-gray-300">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City name"
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="dark:text-gray-300">State</Label>
                <Select 
                  value={formData.state} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                >
                  <SelectTrigger 
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    data-testid="select-state"
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {usStates.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country" className="dark:text-gray-300">Country</Label>
              <Select 
                value={formData.country} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger 
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  data-testid="select-country"
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
              data-testid="button-create-club"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating your club...
                </>
              ) : (
                "Create my club"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
