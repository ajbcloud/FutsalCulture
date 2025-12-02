import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUserTerminology } from "@/hooks/use-user-terminology";

export default function GetStarted() {
  const { term } = useUserTerminology();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    org_name: "",
    join_code: "",
    contact_name: "",
    contact_email: "",
    country: "",
    state: "",
    zip_code: "",
    city: "",
    sports: [] as string[],
    accept: false
  });
  const [joinCodeTouched, setJoinCodeTouched] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/signup-business");
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (user) {
      const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const email = user.primaryEmailAddress?.emailAddress || '';
      setFormData(prev => ({
        ...prev,
        contact_name: prev.contact_name || fullName,
        contact_email: prev.contact_email || email
      }));
    }
  }, [user]);

  const sportOptions = ["Soccer", "Futsal", "Basketball", "Volleyball", "Other"];
  
  function generateJoinCode(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
  }

  function handleOrgNameChange(name: string) {
    setFormData(prev => ({ 
      ...prev, 
      org_name: name,
      join_code: joinCodeTouched ? prev.join_code : generateJoinCode(name)
    }));
  }

  function handleJoinCodeChange(code: string) {
    setJoinCodeTouched(true);
    const sanitized = code
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 30);
    setFormData(prev => ({ ...prev, join_code: sanitized }));
  }
  
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

  async function lookupCitiesByZip(zipCode: string) {
    if (!zipCode || zipCode.length !== 5) {
      setCityOptions([]);
      return;
    }
    
    setLoadingCities(true);
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      if (response.ok) {
        const data = await response.json();
        const cities = data.places?.map((place: any) => place['place name']) || [];
        setCityOptions(cities);
        
        if (cities.length === 1) {
          setFormData(prev => ({ ...prev, city: cities[0] }));
        } else if (cities.length === 0) {
          setFormData(prev => ({ ...prev, city: "" }));
        }
      } else {
        setCityOptions([]);
        setFormData(prev => ({ ...prev, city: "" }));
      }
    } catch (error) {
      console.error("Error looking up cities:", error);
      setCityOptions([]);
    } finally {
      setLoadingCities(false);
    }
  }

  function handleZipChange(zipCode: string) {
    setFormData(prev => ({ ...prev, zip_code: zipCode, city: "" }));
    lookupCitiesByZip(zipCode);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.org_name || !formData.join_code || !formData.contact_name || !formData.accept) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields and accept the terms",
        variant: "destructive",
      });
      return;
    }

    if (formData.join_code.length < 3) {
      toast({
        title: "Invalid join code",
        description: "Join code must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/beta/clerk-create-club", {
        org_name: formData.org_name,
        join_code: formData.join_code,
        contact_name: formData.contact_name,
        city: formData.city,
        state: formData.state,
        country: formData.country || "US",
        zip_code: formData.zip_code,
        sports: formData.sports
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Club created!",
          description: `Welcome to ${data.tenantName}! Redirecting to your dashboard...`,
        });
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1500);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to create club");
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

  function handleSportToggle(sport: string) {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport) 
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create your club on PlayHQ</CardTitle>
          <CardDescription>
            Start free. Add coaches, players, and parents in minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org_name">Organization/Club Name *</Label>
              <Input
                id="org_name"
                value={formData.org_name}
                onChange={(e) => handleOrgNameChange(e.target.value)}
                placeholder="e.g., City United FC"
                required
                data-testid="input-org-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join_code">Your Club's Player & Parent Join Code *</Label>
              <Input
                id="join_code"
                value={formData.join_code}
                onChange={(e) => handleJoinCodeChange(e.target.value)}
                placeholder="e.g., city-united-fc"
                required
                data-testid="input-join-code"
              />
              <p className="text-xs text-muted-foreground">
                This is the code players and parents will use to join your club. Letters, numbers, and dashes only.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder="Your full name"
                required
                data-testid="input-contact-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                disabled
                className="bg-muted"
                data-testid="input-contact-email"
              />
              <p className="text-xs text-muted-foreground">This is your account email</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger data-testid="select-country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger data-testid="select-state">
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
              <div className="space-y-2">
                <Label htmlFor="zip_code">Zip Code</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => handleZipChange(e.target.value)}
                  placeholder="12345"
                  maxLength={5}
                  data-testid="input-zip-code"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              {cityOptions.length > 1 ? (
                <Select value={formData.city} onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))}>
                  <SelectTrigger data-testid="select-city">
                    <SelectValue placeholder={loadingCities ? "Loading cities..." : "Select city"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder={loadingCities ? "Loading..." : "Enter city name"}
                  disabled={loadingCities}
                  data-testid="input-city"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Sports (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2">
                {sportOptions.map((sport) => (
                  <div key={sport} className="flex items-center space-x-2">
                    <Checkbox
                      id={sport}
                      checked={formData.sports.includes(sport)}
                      onCheckedChange={() => handleSportToggle(sport)}
                      data-testid={`checkbox-sport-${sport.toLowerCase()}`}
                    />
                    <Label htmlFor={sport} className="text-sm">{sport}</Label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="button-create-club"
            >
              {loading ? "Creating your club..." : "Create my club"}
            </Button>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="accept"
                checked={formData.accept}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accept: !!checked }))}
                required
                data-testid="checkbox-accept-terms"
              />
              <Label htmlFor="accept" className="text-sm">
                I agree to the <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> *
              </Label>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              {term}s & {term === "Player" ? "parents" : "players"}:{" "}
              <a href="/join" className="text-primary hover:underline">
                join with a code
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
