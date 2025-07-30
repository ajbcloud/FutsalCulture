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
import { ArrowLeft, Key, Lock, Unlock, Repeat, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { Switch } from '@/components/ui/switch';
import { AGE_GROUPS } from '@shared/constants';
import { format12Hour, convert12To24Hour, isValidBookingTime } from '@shared/booking-config';

export default function AdminSessionDetail() {
  const [match, params] = useRoute('/admin/sessions/:id');
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isNew = params?.id === 'new';

  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    ageGroups: [] as string[],
    genders: [] as string[],
    capacity: 12,
    bookingOpenHour: 8,
    bookingOpenMinute: 0,
    hasAccessCode: false,
    accessCode: '',
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
        console.log('admin session detail:', data);
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
          hasAccessCode: data.hasAccessCode || false,
          accessCode: data.accessCode || '',
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare session data with proper type conversions
      const sessionData: any = {
        title: formData.title,
        location: formData.location,
        ageGroups: formData.ageGroups,
        genders: formData.genders,
        capacity: formData.capacity,
        bookingOpenHour: formData.bookingOpenHour,
        bookingOpenMinute: formData.bookingOpenMinute,
        hasAccessCode: Boolean(formData.hasAccessCode),
        accessCode: formData.hasAccessCode && formData.accessCode ? formData.accessCode.trim().toUpperCase() : null,
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

      console.log('Saving session data:', sessionData);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="title" className="text-muted-foreground">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="bg-input border-border text-foreground"
              placeholder="Session title"
            />
          </div>

          <div>
            <Label htmlFor="location" className="text-muted-foreground">Location</Label>
            <Select value={formData.location} onValueChange={(value) => setFormData({...formData, location: value})}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Turf City">Turf City</SelectItem>
                <SelectItem value="Sports Hub">Sports Hub</SelectItem>
                <SelectItem value="Jurong East">Jurong East</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startTime" className="text-muted-foreground">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              className="bg-input border-border text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="endTime" className="text-muted-foreground">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              className="bg-input border-border text-foreground"
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Age Groups (Multi-Select)</Label>
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
            <Label className="text-muted-foreground">Genders (Multi-Select)</Label>
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
            <Label htmlFor="capacity" className="text-muted-foreground">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
              className="bg-input border-border text-foreground"
              min="1"
              max="20"
            />
          </div>
        </div>

        {/* Booking Time Controls */}
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Booking Time Settings</h3>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              By default, sessions open for booking at 8:00 AM on the day of the session. 
              You can customize this time between 6:00 AM and 9:00 PM.
            </p>
          </div>
          
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

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>Preview:</strong> This session will open for booking at{' '}
              <span className="font-semibold">
{format12Hour(formData.bookingOpenHour, formData.bookingOpenMinute)}
              </span>
              {' '}on the day of the session.
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
                onCheckedChange={(checked) => setFormData({...formData, hasAccessCode: checked})}
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
              <div className="space-y-3 pl-6">
                <div>
                  <Label htmlFor="accessCode" className="text-muted-foreground">Access Code</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="accessCode"
                      value={formData.accessCode}
                      onChange={(e) => setFormData({...formData, accessCode: e.target.value.toUpperCase()})}
                      className="bg-input border-border text-foreground font-mono"
                      placeholder="Enter access code"
                      maxLength={8}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                        setFormData({...formData, accessCode: code});
                      }}
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
              </div>
            )}
          </div>
        </div>

        {/* Recurring Session Section - Only show for new sessions */}
        {isNew && (
          <div className="border-t border-border pt-6 mt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <Repeat className="w-5 h-5 mr-2" />
              Recurring Session Options
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Create multiple sessions at once with recurring schedule. Perfect for weekly training programs or regular sessions.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked})}
                />
                <Label className="text-foreground flex items-center">
                  {formData.isRecurring ? (
                    <><Repeat className="w-4 h-4 mr-2" />Create recurring sessions</>
                  ) : (
                    <><Calendar className="w-4 h-4 mr-2" />Single session only</>
                  )}
                </Label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-4 pl-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="text-xs text-muted-foreground mt-1">
                        How many sessions to create (including the first one)
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="recurringEndDate" className="text-muted-foreground">
                      End Date (Optional)
                    </Label>
                    <Input
                      id="recurringEndDate"
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => setFormData({...formData, recurringEndDate: e.target.value})}
                      className="bg-input border-border text-foreground mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Sessions will not be created beyond this date (overrides session count)
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6 space-x-4">
          <Link href="/admin/sessions">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? 'Saving...' : (isNew ? 'Create Session' : 'Update Session')}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}