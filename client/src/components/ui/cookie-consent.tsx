import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Cookie, Shield, BarChart3, Settings } from "lucide-react";

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  icon: React.ReactNode;
}

interface CookieConsent {
  hasConsented: boolean;
  categories: Record<string, boolean>;
  timestamp: number;
}

const STORAGE_KEY = "playhq-cookie-consent";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [categories, setCategories] = useState<CookieCategory[]>([
    {
      id: "necessary",
      name: "Necessary Cookies",
      description: "Essential for the website to function properly. These cookies enable core functionality such as authentication, security, and network management.",
      required: true,
      enabled: true,
      icon: <Shield className="w-4 h-4" />
    },
    {
      id: "functional", 
      name: "Functional Cookies",
      description: "Enable enhanced functionality and personalization, such as remembering your preferences and settings.",
      required: false,
      enabled: true,
      icon: <Settings className="w-4 h-4" />
    },
    {
      id: "analytics",
      name: "Analytics Cookies", 
      description: "Help us understand how visitors interact with our website by collecting and reporting information anonymously.",
      required: false,
      enabled: false,
      icon: <BarChart3 className="w-4 h-4" />
    }
  ]);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent?.hasConsented) {
      setIsVisible(true);
    }
  }, []);

  const getStoredConsent = (): CookieConsent | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const saveConsent = (categoryChoices: Record<string, boolean>) => {
    const consent: CookieConsent = {
      hasConsented: true,
      categories: categoryChoices,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      
      // Set cookies based on consent
      if (categoryChoices.analytics) {
        // Enable analytics tracking
        console.log("Analytics cookies enabled");
      }
      
      if (categoryChoices.functional) {
        // Enable functional features
        console.log("Functional cookies enabled");
      }
      
    } catch (error) {
      console.error("Failed to save cookie consent:", error);
    }
  };

  const handleAcceptAll = () => {
    const choices = categories.reduce((acc, category) => {
      acc[category.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    saveConsent(choices);
    setIsVisible(false);
  };

  const handleRejectOptional = () => {
    const choices = categories.reduce((acc, category) => {
      acc[category.id] = category.required;
      return acc;
    }, {} as Record<string, boolean>);
    
    saveConsent(choices);
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    const choices = categories.reduce((acc, category) => {
      acc[category.id] = category.enabled;
      return acc;
    }, {} as Record<string, boolean>);
    
    saveConsent(choices);
    setIsVisible(false);
  };

  const toggleCategory = (categoryId: string, enabled: boolean) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId ? { ...cat, enabled } : cat
      )
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Cookie className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Cookie Preferences</CardTitle>
            </div>
          </div>
          <CardDescription>
            We use cookies to enhance your experience on our platform. You can choose which categories of cookies to allow.
            <strong className="block mt-2 text-foreground">This prompt will continue to appear until you make a selection.</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {!showDetails ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {categories.map(category => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {category.icon}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{category.name}</span>
                          {category.required && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={category.enabled}
                      disabled={category.required}
                      onCheckedChange={(enabled) => toggleCategory(category.id, enabled)}
                      data-testid={`cookie-toggle-${category.id}`}
                    />
                  </div>
                ))}
              </div>

              <Button 
                variant="link" 
                className="h-auto p-0 text-sm" 
                onClick={() => setShowDetails(true)}
                data-testid="cookie-show-details"
              >
                Show detailed information
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button 
                variant="link" 
                className="h-auto p-0 text-sm mb-2" 
                onClick={() => setShowDetails(false)}
                data-testid="cookie-hide-details"
              >
                ← Back to summary
              </Button>

              {categories.map((category, index) => (
                <div key={category.id}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {category.icon}
                        <h4 className="font-medium">{category.name}</h4>
                        {category.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <Switch
                        checked={category.enabled}
                        disabled={category.required}
                        onCheckedChange={(enabled) => toggleCategory(category.id, enabled)}
                        data-testid={`cookie-toggle-detail-${category.id}`}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground pl-6">
                      {category.description}
                    </p>
                  </div>
                  {index < categories.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <div className="p-6 pt-4 border-t">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleRejectOptional}
              variant="outline"
              className="flex-1"
              data-testid="cookie-reject-optional"
            >
              Reject Optional
            </Button>
            <Button 
              onClick={handleSaveCustom}
              variant="outline" 
              className="flex-1"
              data-testid="cookie-save-custom"
            >
              Save Custom
            </Button>
            <Button 
              onClick={handleAcceptAll}
              className="flex-1"
              data-testid="cookie-accept-all"
            >
              Accept All
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            You can change these preferences anytime in your account settings.
          </p>
        </div>
      </Card>
    </div>
  );
}