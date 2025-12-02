import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, Users, DollarSign, Key, Building2, ArrowLeft, AlertCircle, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

interface SessionDetail {
  id: string;
  title: string;
  location: string;
  locationName: string | null;
  city: string | null;
  state: string | null;
  ageGroups: string[];
  genders: string[];
  startTime: string;
  endTime: string;
  capacity: number;
  priceCents: number;
  status: string;
  visibility: string;
  signupsCount: number;
  spotsRemaining: number;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

export default function PublicSessionDetail() {
  const [, params] = useRoute('/browse/:tenantSlug/session/:sessionId');
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const tenantSlug = params?.tenantSlug || '';
  const sessionId = params?.sessionId || '';
  
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get('code') || '';
  
  const [accessCode, setAccessCode] = useState(codeFromUrl);
  const [accessCodeError, setAccessCodeError] = useState('');
  const [needsAccessCode, setNeedsAccessCode] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const queryKey = ['/api/public', tenantSlug, 'session', sessionId, accessCode];
  
  const { data, isLoading, error, refetch } = useQuery<{ tenant: TenantInfo; session: SessionDetail }>({
    queryKey,
    queryFn: async () => {
      const url = accessCode 
        ? `/api/public/${tenantSlug}/session/${sessionId}?accessCode=${encodeURIComponent(accessCode.trim().toUpperCase())}`
        : `/api/public/${tenantSlug}/session/${sessionId}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.requiresAccessCode) {
          setNeedsAccessCode(true);
          setAccessDenied(false);
          if (accessCode) {
            setAccessCodeError('Invalid access code. Please try again.');
          }
          throw new Error('Access code required');
        }
        if (data.requiresAuth) {
          setAccessDenied(true);
          setNeedsAccessCode(false);
          throw new Error('This session is private. Please sign in to view.');
        }
        if (res.status === 403) {
          setAccessDenied(true);
          throw new Error(data.error || 'Access denied');
        }
        throw new Error(data.error || 'Failed to load session');
      }
      
      setNeedsAccessCode(false);
      setAccessDenied(false);
      setAccessCodeError('');
      return data;
    },
    enabled: !!tenantSlug && !!sessionId,
    retry: false,
  });

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setAccessCodeError('Please enter an access code');
      return;
    }
    setAccessCodeError('');
    queryClient.removeQueries({ queryKey });
    refetch();
  };

  const handleBackToList = () => {
    setLocation(`/browse/${tenantSlug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (needsAccessCode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button variant="ghost" size="sm" onClick={handleBackToList} className="mr-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2 text-amber-600" />
                Access Code Required
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This session requires an access code to view details and book.
            </p>
            <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value.toUpperCase());
                    setAccessCodeError('');
                  }}
                  placeholder="Enter access code"
                  className="font-mono"
                  data-testid="input-access-code"
                />
                {accessCodeError && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {accessCodeError}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" data-testid="button-submit-access-code">
                View Session
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-amber-600" />
            <h2 className="text-xl font-semibold mb-2">Private Session</h2>
            <p className="text-muted-foreground mb-4">
              This session is private and requires you to sign in to view.
            </p>
            <div className="space-x-2">
              <Button variant="outline" onClick={handleBackToList}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sessions
              </Button>
              <Button asChild>
                <a href="/login">Sign In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error?.message || 'The session you\'re looking for doesn\'t exist or isn\'t available.'}
            </p>
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { tenant, session } = data;
  const isFull = session.spotsRemaining <= 0;
  const sessionDate = new Date(session.startTime);
  const isPast = sessionDate < new Date();

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBackToList} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {tenant.name}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">{session.title}</CardTitle>
                <p className="text-muted-foreground">
                  {format(sessionDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <Badge variant={isPast ? 'secondary' : isFull ? 'destructive' : 'default'}>
                {isPast ? 'Past' : isFull ? 'Full' : `${session.spotsRemaining} spots left`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-muted-foreground">
                <Clock className="w-5 h-5 mr-3 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Time</p>
                  <p>
                    {format(sessionDate, 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-5 h-5 mr-3 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Location</p>
                  <p>{session.locationName || session.location}</p>
                  {session.city && session.state && (
                    <p className="text-sm">{session.city}, {session.state}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <Users className="w-5 h-5 mr-3 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Who Can Join</p>
                  <p>{session.ageGroups?.join(', ') || 'All Ages'}</p>
                  <p className="text-sm">{session.genders?.join(', ') || 'All Genders'}</p>
                </div>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="w-5 h-5 mr-3 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Price</p>
                  <p className="text-lg font-semibold text-foreground">
                    ${(session.priceCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Spots filled</span>
                <span className="font-medium">{session.signupsCount} / {session.capacity}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    isFull ? 'bg-red-500' : 
                    session.signupsCount / session.capacity > 0.7 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (session.signupsCount / session.capacity) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  To book this session, you'll need to create an account or sign in.
                </p>
                <div className="space-x-2">
                  <Button asChild>
                    <a href={`/join/${tenantSlug}`}>
                      Join {tenant.name}
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/login">
                      Sign In
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
