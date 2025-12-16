import React, { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import AdminLayout from '@/components/admin-layout';
import { adminSessions } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Key, Lock, Unlock, Repeat, Calendar, Users, List, Mail } from 'lucide-react';
import { Link } from 'wouter';
import { Switch } from '@/components/ui/switch';
import { AGE_GROUPS } from '@shared/constants';
import { format12Hour, convert12To24Hour, isValidBookingTime } from '@shared/booking-config';
import { useQuery } from '@tanstack/react-query';
import { useHasFeature } from '@/hooks/use-feature-flags';
import type { InviteCodeSelect } from '@shared/schema';

export default function AdminSessionDetail() {
  const [match, params] = useRoute('/admin/sessions/:id');
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingRoster, setSendingRoster] = useState(false);
  const isNew = params?.id === 'new';
  
  // Feature flags for premium features
  const { hasFeature: hasWaitlistFeature } = useHasFeature('waitlist_manual');
  
  // Fetch admin settings to get available locations
  const { data: adminSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: () => fetch('/api/admin/settings').then(res => res.json())
  });
  
  // Fetch access codes for the dropdown
  const { data: accessCodesData } = useQuery<InviteCodeSelect[]>({
    queryKey: ['/api/admin/invite-codes'],
    queryFn: () => fetch('/api/admin/invite-codes').then(res => res.json())
  });
  
  // Filter to only get active access codes (codeType = 'access')
  const availableAccessCodes = (accessCodesData || []).filter(
    (code) => code.codeType === 'access' && code.isActive
  );
  
  // Convert available locations to a simple array of names for the dropdown
  const availableLocationNames = (adminSettings?.availableLocations || []).map((loc: any) => 
    typeof loc === 'object' ? loc.name : loc
  );

  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '', // Location name from admin settings dropdown
    ageGroups: [] as string[],
    genders: [] as string[],
    capacity: 12,
    bookingOpenHour: 8,
    bookingOpenMinute: 0,
    noTimeConstraints: false,
    daysBeforeBooking: 0,
    hasAccessCode: false,
    accessCode: '',
    waitlistEnabled: true,
    waitlistLimit: '',
    paymentWindowMinutes: 60,
    autoPromote: true,
    isRecurring: false,
    recurringType: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    recurringEndDate: '',
    recurringCount: 8,
  });

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }

    if (params?.id) {
      adminSessions.get(params.id).then(data => {
        setSession(data);
        setFormData({
          title: data.title || '',
          startTime: data.startTime?.slice(0, 16) || '',
          endTime: data.endTime?.slice(0, 16) || '',
          location: data.location || '',
          ageGroups: data.ageGroups || [],
          genders: data.genders || [],
          capacity: data.capacity || 12,
          bookingOpenHour: data.bookingOpenHour ?? 8,
          bookingOpenMinute: data.bookingOpenMinute ?? 0,
          noTimeConstraints: data.noTimeConstraints ?? false,
          daysBeforeBooking: data.daysBeforeBooking ?? 0,
          hasAccessCode: data.hasAccessCode || false,
          accessCode: data.accessCode || '',
          waitlistEnabled: data.waitlistEnabled ?? true,
          waitlistLimit: data.waitlistLimit || '',
          paymentWindowMinutes: data.paymentWindowMinutes ?? 60,
          autoPromote: data.autoPromote ?? true,
          isRecurring: false, // Single sessions don't have recurring data
          recurringType: 'weekly',
          recurringEndDate: '',
          recurringCount: 8,
        });
        setLoading(false);
      }).catch(err => {
        console.error('Error fetching session:', err);
        setLoading(false);
      });
    }
  }, [params?.id, isNew]);

  const validateForm = () => {
    const errors = [];
    
    if (!formData.title?.trim()) errors.push("Title is required");
    if (!formData.location?.trim()) errors.push("Location is required");
    if (!formData.startTime) errors.push("Start Time is required");
    if (!formData.endTime) errors.push("End Time is required");
    if (formData.ageGroups.length === 0) errors.push("At least one Age Group is required");
    if (formData.genders.length === 0) errors.push("At least one Gender is required");
    if (!formData.capacity || formData.capacity < 1) errors.push("Capacity must be at least 1");
    
    // Validate start time is before end time
    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      errors.push("Start Time must be before End Time");
    }
    
    return errors;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate required fields
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        toast({ 
          title: "Please fix the following errors:", 
          description: validationErrors.join(", "),
          variant: "destructive" 
        });
        setSaving(false);
        return;
      }
      // Prepare session data with proper type conversions
      const sessionData: any = {
        title: formData.title,
        location: formData.location,
        ageGroups: formData.ageGroups,
        genders: formData.genders,
        capacity: formData.capacity,
        bookingOpenHour: formData.bookingOpenHour,
        bookingOpenMinute: formData.bookingOpenMinute,
        // New booking constraint fields
        noTimeConstraints: Boolean(formData.noTimeConstraints),
        daysBeforeBooking: formData.daysBeforeBooking || 0,
        hasAccessCode: Boolean(formData.hasAccessCode),
        accessCode: formData.hasAccessCode && formData.accessCode ? formData.accessCode.trim().toUpperCase() : null,
        // Waitlist settings
        waitlistEnabled: Boolean(formData.waitlistEnabled),
        waitlistLimit: formData.waitlistLimit && formData.waitlistLimit.trim() ? parseInt(formData.waitlistLimit) : null,
        paymentWindowMinutes: formData.paymentWindowMinutes || 60,
        autoPromote: Boolean(formData.autoPromote),
        // Include recurring data for new sessions
        ...(isNew && {
          isRecurring: formData.isRecurring,
          recurringType: formData.recurringType,
          recurringEndDate: formData.recurringEndDate,
          recurringCount: formData.recurringCount,
        }),
      };

      // Only include datetime fields if they have values
      if (formData.startTime) {
        sessionData.startTime = new Date(formData.startTime);
      }
      if (formData.endTime) {
        sessionData.endTime = new Date(formData.endTime);
      }


      if (isNew) {
        await adminSessions.create(sessionData);
        toast({ title: "Session created successfully" });
      } else {
        await adminSessions.update(params?.id, sessionData);
        toast({ title: "Session updated successfully" });
      }
      window.location.href = '/admin/sessions';
    } catch (error) {
      console.error('Error saving session:', error);
      toast({ title: "Error saving session", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSendRosterEmail = async () => {
    if (!params?.id || isNew) return;
    setSendingRoster(true);
    try {
      const response = await fetch(`/api/admin/sessions/${params.id}/send-roster-email`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast({ 
          title: "Roster email sent", 
          description: data.message 
        });
      } else {
        toast({ 
          title: "Failed to send roster email", 
          description: data.error || 'An error occurred',
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error('Error sending roster email:', error);
      toast({ title: "Error sending roster email", variant: "destructive" });
    }
    setSendingRoster(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link href="/admin/sessions">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sessions
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          {isNew ? 'Create New Session' : 'Edit Session'}
        </h1>
      </div>

      <div className="bg-card p-6 rounded-lg">
        {/* Session Details Section */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Session Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title" className="text-muted-foreground">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-input border-border text-foreground"
                placeholder="Session title"
                required
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-muted-foreground">Location *</Label>
              <Select value={formData.location} onValueChange={(value) => setFormData({...formData, location: value})}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocationNames.map((location: string) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startTime" className="text-muted-foreground">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="bg-input border-border text-foreground"
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime" className="text-muted-foreground">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="bg-input border-border text-foreground"
                required
              />
            </div>
          </div>
        </div>



        {/* Additional Session Configuration */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Session Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Recurring Session Options - Only show for new sessions */}
          {isNew && (
            <>
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked})}
                  />
                  <Label className="text-foreground flex items-center">
                    Make Recurring Session
                  </Label>
                </div>
              </div>

              {formData.isRecurring && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Recurring Pattern</Label>
                    <Select 
                      value={formData.recurringType} 
                      onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => 
                        setFormData({...formData, recurringType: value})
                      }
                    >
                      <SelectTrigger className="bg-input border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly (every 7 days)</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly (every 14 days)</SelectItem>
                        <SelectItem value="monthly">Monthly (same date each month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Number of Sessions</Label>
                    <Input
                      type="number"
                      value={formData.recurringCount}
                      onChange={(e) => setFormData({...formData, recurringCount: parseInt(e.target.value) || 1})}
                      className="bg-input border-border text-foreground"
                      min="2"
                      max="52"
                      placeholder="8"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="recurringEndDate" className="text-muted-foreground">
                      End Date (Optional)
                    </Label>
                    <Input
                      id="recurringEndDate"
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => setFormData({...formData, recurringEndDate: e.target.value})}
                      className="bg-input border-border text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Sessions will not be created beyond this date (overrides session count)
                    </p>
                  </div>
                  
                  <div className="md:col-span-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Preview:</strong> This will create{' '}
                      <span className="font-semibold">{formData.recurringCount} sessions</span>{' '}
                      {formData.recurringType === 'weekly' ? 'every week' : 
                       formData.recurringType === 'biweekly' ? 'every 2 weeks' : 'monthly'}
                      {formData.recurringEndDate && (
                        <> until {new Date(formData.recurringEndDate).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <Label className="text-muted-foreground">Age Groups (Multi-Select) *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {AGE_GROUPS.map(age => (
                <label key={age} className="flex items-center space-x-2 text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.ageGroups.includes(age)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, ageGroups: [...formData.ageGroups, age]});
                      } else {
                        setFormData({...formData, ageGroups: formData.ageGroups.filter(g => g !== age)});
                      }
                    }}
                    className="rounded"
                  />
                  <span>{age}</span>
                </label>
              ))}
            </div>
            {formData.ageGroups.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {formData.ageGroups.join(', ')}
              </p>
            )}
          </div>

          <div>
            <Label className="text-muted-foreground">Genders (Multi-Select) *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['boys', 'girls'].map(gender => (
                <label key={gender} className="flex items-center space-x-2 text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.genders.includes(gender)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, genders: [...formData.genders, gender]});
                      } else {
                        setFormData({...formData, genders: formData.genders.filter(g => g !== gender)});
                      }
                    }}
                    className="rounded"
                  />
                  <span className="capitalize">{gender}</span>
                </label>
              ))}
            </div>
            {formData.genders.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {formData.genders.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="capacity" className="text-muted-foreground">Capacity *</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
              className="bg-input border-border text-foreground"
              min="1"
              max="20"
              required
            />
          </div>
        </div>

        {/* Booking Time Controls */}
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Booking Time Settings</h3>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Configure when this session becomes available for booking. Choose from specific times, advance booking windows, or no time constraints.
            </p>
          </div>

          {/* Booking Constraint Options */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3">
              <Switch
                checked={formData.noTimeConstraints}
                onCheckedChange={(checked) => setFormData({...formData, noTimeConstraints: checked})}
              />
              <Label className="text-foreground">
                No time constraints - allow booking anytime
              </Label>
            </div>
            
            {!formData.noTimeConstraints && (
              <div>
                <Label className="text-muted-foreground">Days before session when booking opens</Label>
                <div className="flex items-center space-x-3 mt-2">
                  <Select 
                    value={formData.daysBeforeBooking?.toString() || "0"} 
                    onValueChange={(value) => setFormData({...formData, daysBeforeBooking: parseInt(value)})}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="0" className="text-foreground hover:bg-muted">Same day (default)</SelectItem>
                      <SelectItem value="1" className="text-foreground hover:bg-muted">1 day before</SelectItem>
                      <SelectItem value="2" className="text-foreground hover:bg-muted">2 days before</SelectItem>
                      <SelectItem value="3" className="text-foreground hover:bg-muted">3 days before</SelectItem>
                      <SelectItem value="7" className="text-foreground hover:bg-muted">1 week before</SelectItem>
                      <SelectItem value="14" className="text-foreground hover:bg-muted">2 weeks before</SelectItem>
                      <SelectItem value="30" className="text-foreground hover:bg-muted">1 month before</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    {formData.daysBeforeBooking === 0 ? "Opens on session day" : `Opens ${formData.daysBeforeBooking} day${formData.daysBeforeBooking > 1 ? 's' : ''} before`}
                  </span>
                </div>
              </div>
            )}
          
          {!formData.noTimeConstraints && formData.daysBeforeBooking === 0 && (
            <div>
              <Label className="text-muted-foreground">Booking Opens At</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div>
                  <Select 
                    value={(() => {
                      const hour = formData.bookingOpenHour;
                      if (hour === 0) return "12";
                      if (hour > 12) return (hour - 12).toString();
                      return hour.toString();
                    })()} 
                    onValueChange={(value) => {
                      const hour12 = parseInt(value);
                      const currentAMPM = formData.bookingOpenHour < 12 ? 'AM' : 'PM';
                      const hour24 = convert12To24Hour(hour12, currentAMPM);
                      
                      if (isValidBookingTime(hour24)) {
                        setFormData({...formData, bookingOpenHour: hour24});
                      }
                    }}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = i + 1;
                        return (
                          <SelectItem key={hour} value={hour.toString()} className="text-foreground hover:bg-muted">
                            {hour}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select 
                    value={formData.bookingOpenMinute.toString()} 
                    onValueChange={(value) => setFormData({...formData, bookingOpenMinute: parseInt(value)})}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="0" className="text-foreground hover:bg-muted">00</SelectItem>
                      <SelectItem value="15" className="text-foreground hover:bg-muted">15</SelectItem>
                      <SelectItem value="30" className="text-foreground hover:bg-muted">30</SelectItem>
                      <SelectItem value="45" className="text-foreground hover:bg-muted">45</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select 
                    value={formData.bookingOpenHour < 12 ? 'AM' : 'PM'} 
                    onValueChange={(value) => {
                      const currentHour12 = formData.bookingOpenHour === 0 ? 12 : 
                                           formData.bookingOpenHour > 12 ? formData.bookingOpenHour - 12 : 
                                           formData.bookingOpenHour;
                      const hour24 = convert12To24Hour(currentHour12, value as 'AM' | 'PM');
                      
                      if (isValidBookingTime(hour24)) {
                        setFormData({...formData, bookingOpenHour: hour24});
                      }
                    }}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="AM" className="text-foreground hover:bg-muted">AM</SelectItem>
                      <SelectItem value="PM" className="text-foreground hover:bg-muted">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available times: 6:00 AM - 9:00 PM (Default: 8:00 AM)</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Preview:</strong> {formData.noTimeConstraints ? (
                "This session can be booked anytime."
              ) : formData.daysBeforeBooking && formData.daysBeforeBooking > 0 ? (
                `This session will open for booking ${formData.daysBeforeBooking} day${formData.daysBeforeBooking > 1 ? 's' : ''} before the session date.`
              ) : (
                <>
                  This session will open for booking at{' '}
                  <span className="font-semibold">
                    {format12Hour(formData.bookingOpenHour, formData.bookingOpenMinute)}
                  </span>
                  {' '}on the day of the session.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Access Code Section */}
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Access Code Settings
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Enable access code protection to require parents to enter a code before booking this session.
              This is useful for private sessions or controlling access to specific sessions.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Switch
                checked={formData.hasAccessCode}
                onCheckedChange={(checked) => setFormData({...formData, hasAccessCode: checked, accessCode: checked ? formData.accessCode : ''})}
                data-testid="switch-access-code"
              />
              <Label className="text-foreground flex items-center">
                {formData.hasAccessCode ? (
                  <><Lock className="w-4 h-4 mr-2" />Require access code for booking</>
                ) : (
                  <><Unlock className="w-4 h-4 mr-2" />Session is open for booking</>
                )}
              </Label>
            </div>

            {formData.hasAccessCode && (
              <div className="space-y-4 pl-6">
                {/* Dropdown for existing access codes */}
                {availableAccessCodes.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground flex items-center mb-2">
                      <List className="w-4 h-4 mr-2" />
                      Select from existing access codes
                    </Label>
                    <Select
                      value={availableAccessCodes.find(c => c.code === formData.accessCode)?.id || ''}
                      onValueChange={(codeId) => {
                        const selectedCode = availableAccessCodes.find(c => c.id === codeId);
                        if (selectedCode) {
                          setFormData({...formData, accessCode: selectedCode.code});
                        }
                      }}
                    >
                      <SelectTrigger className="bg-input border-border text-foreground" data-testid="select-access-code">
                        <SelectValue placeholder="Choose an access code..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAccessCodes.map((code) => (
                          <SelectItem key={code.id} value={code.id} data-testid={`option-access-code-${code.id}`}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-mono font-medium">{code.code}</span>
                              {code.description && (
                                <span className="text-muted-foreground text-sm ml-2">- {code.description}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select an existing access code from your codes library
                    </p>
                  </div>
                )}

                {/* Divider when both options are available */}
                {availableAccessCodes.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-border"></div>
                    <span className="text-xs text-muted-foreground">OR</span>
                    <div className="flex-1 border-t border-border"></div>
                  </div>
                )}

                {/* Manual entry option */}
                <div>
                  <Label htmlFor="accessCode" className="text-muted-foreground">
                    {availableAccessCodes.length > 0 ? 'Enter a custom code' : 'Access Code'}
                  </Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="accessCode"
                      value={formData.accessCode}
                      onChange={(e) => setFormData({...formData, accessCode: e.target.value.toUpperCase()})}
                      className="bg-input border-border text-foreground font-mono"
                      placeholder="Enter access code"
                      maxLength={20}
                      data-testid="input-access-code"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                        setFormData({...formData, accessCode: code});
                      }}
                      data-testid="button-generate-access-code"
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Parents will need this code to book spots in this session
                  </p>
                </div>
                
                {formData.accessCode && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Access Code:</strong>{' '}
                      <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded font-mono">
                        {formData.accessCode}
                      </code>
                    </p>
                  </div>
                )}

                {availableAccessCodes.length === 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Tip:</strong> You can create reusable access codes in the{' '}
                      <Link href="/admin/invite-codes" className="underline hover:no-underline">
                        Codes section
                      </Link>{' '}
                      to easily apply them to multiple sessions.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Waitlist Settings Section - Premium Feature */}
        {hasWaitlistFeature ? (
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Waitlist Settings
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Configure waitlist functionality for when this session reaches capacity. Players can join the waitlist and receive time-limited offers when spots become available.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Switch
                checked={formData.waitlistEnabled}
                onCheckedChange={(checked) => setFormData({...formData, waitlistEnabled: checked})}
                data-testid="switch-waitlist-enabled"
              />
              <Label className="text-foreground flex items-center">
                {formData.waitlistEnabled ? (
                  <>Enable waitlist for this session</>
                ) : (
                  <>Waitlist disabled - session will close when full</>
                )}
              </Label>
            </div>

            {formData.waitlistEnabled && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="waitlistLimit" className="text-muted-foreground">
                      Waitlist Limit
                    </Label>
                    <Input
                      id="waitlistLimit"
                      type="number"
                      value={formData.waitlistLimit}
                      onChange={(e) => setFormData({...formData, waitlistLimit: e.target.value})}
                      className="bg-input border-border text-foreground"
                      placeholder="No limit"
                      min="1"
                      data-testid="input-waitlist-limit"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for unlimited waitlist
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="paymentWindowMinutes" className="text-muted-foreground">
                      Waitlist Offer Time (minutes)
                    </Label>
                    <Input
                      id="paymentWindowMinutes"
                      type="number"
                      value={formData.paymentWindowMinutes}
                      onChange={(e) => setFormData({...formData, paymentWindowMinutes: parseInt(e.target.value) || 60})}
                      className="bg-input border-border text-foreground"
                      placeholder="60"
                      min="5"
                      max="1440"
                      data-testid="input-payment-window"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How long waitlisted players have to accept their offer
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={formData.autoPromote}
                      onCheckedChange={(checked) => setFormData({...formData, autoPromote: checked})}
                      data-testid="switch-auto-promote"
                    />
                    <div>
                      <Label className="text-foreground">Auto-promote</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically offer spots to next person when someone cancels
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        ) : (
          <div className="border-t border-border pt-6 mt-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3 text-orange-600 dark:text-orange-400" />
                <div>
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-1">
                    Waitlist Settings - Premium Feature
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Upgrade to Core plan or higher to enable waitlist functionality for your sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6 space-x-4">
          <Link href="/admin/sessions">
            <Button variant="outline">Cancel</Button>
          </Link>
          {!isNew && (
            <Button 
              onClick={handleSendRosterEmail} 
              disabled={sendingRoster}
              variant="secondary"
              data-testid="button-send-roster-email"
            >
              <Mail className="w-4 h-4 mr-2" />
              {sendingRoster ? 'Sending...' : 'Send Roster Email'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'Saving...' : (isNew ? 'Create Session' : 'Update Session')}
          </Button>
        </div>
      </div>
      </div>
      </div>
    </AdminLayout>
  );
}