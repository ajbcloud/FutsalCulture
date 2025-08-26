import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function GetStarted() {
  const [formData, setFormData] = useState({
    org_name: "",
    contact_name: "",
    contact_email: "",
    country: "",
    state: "",
    city: "",
    sports: [] as string[],
    accept: false
  });
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const sportOptions = ["Soccer", "Futsal", "Basketball", "Volleyball", "Other"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.org_name || !formData.contact_name || !formData.contact_email || !formData.accept) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields and accept the terms",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/signup", {
        ...formData,
        plan_key: "free"
      });

      if (response.ok) {
        // Redirect to email verification page
        navigate(`/verify-email-sent?email=${encodeURIComponent(formData.contact_email)}`);
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
                onChange={(e) => setFormData(prev => ({ ...prev, org_name: e.target.value }))}
                placeholder="e.g., City United FC"
                required
                data-testid="input-org-name"
              />
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
              <Label htmlFor="contact_email">Work Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="you@yourclub.com"
                required
                data-testid="input-contact-email"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="USA"
                  data-testid="input-country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="CA"
                  data-testid="input-state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="San Francisco"
                  data-testid="input-city"
                />
              </div>
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="button-create-club"
            >
              {loading ? "Creating your club..." : "Create my club"}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Prefer Google/Microsoft?
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" asChild className="flex-1">
                  <a href="/api/auth/google?intent=owner">Google</a>
                </Button>
                <Button type="button" variant="outline" size="sm" asChild className="flex-1">
                  <a href="/api/auth/microsoft?intent=owner">Microsoft</a>
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Players & parents:{" "}
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