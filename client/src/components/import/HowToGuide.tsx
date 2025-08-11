import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface HowToGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToGuide({ isOpen, onClose }: HowToGuideProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sessions CSV Import Guide</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Overview</h3>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Use the blank template for your tenant. All times must be ISO 8601 with timezone 
                (e.g., 2025-08-29T14:00:00-04:00). Age & gender options must match the admin "Create Session" screen.
              </AlertDescription>
            </Alert>
          </div>

          {/* Required Fields */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Required Fields</h3>
            <div className="grid gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">title</Badge>
                      <span className="text-sm text-muted-foreground">Text up to 120 characters</span>
                    </div>
                    <p className="text-sm">Session name that appears to users. Example: <code>U12 Skills Clinic</code></p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">location</Badge>
                      <span className="text-sm text-muted-foreground">Existing location by name</span>
                    </div>
                    <p className="text-sm">If not found, the importer will create it automatically. Example: <code>Sports Hub</code></p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">start_time / end_time</Badge>
                      <span className="text-sm text-muted-foreground">ISO 8601 with timezone</span>
                    </div>
                    <p className="text-sm">Must include timezone. end_time must be after start_time.</p>
                    <p className="text-sm">Example: <code>2025-08-29T14:00:00-04:00</code></p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">age_groups</Badge>
                      <span className="text-sm text-muted-foreground">U9, U10, U11, etc.</span>
                    </div>
                    <p className="text-sm">Separate multiple values with semicolons. Example: <code>U10;U12</code></p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">genders</Badge>
                      <span className="text-sm text-muted-foreground">Boys, Girls, or Mixed</span>
                    </div>
                    <p className="text-sm">Case sensitive. Example: <code>Mixed</code></p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">capacity</Badge>
                      <span className="text-sm text-muted-foreground">Positive integer</span>
                    </div>
                    <p className="text-sm">Maximum number of players for this session. Example: <code>12</code></p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Optional Fields</h3>
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">booking_open_time</Badge>
                  <span>HH:mm format (06:00 to 19:00)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">price_cents</Badge>
                  <span>Integer amount in cents (2500 = $25.00)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">has_access_code</Badge>
                  <span>true or false</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">access_code</Badge>
                  <span>3-32 characters (required if has_access_code=true)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">waitlist_enabled</Badge>
                  <span>true or false</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">recurring</Badge>
                  <span>true or false</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">recurring_rule</Badge>
                  <span>RRULE string (required if recurring=true)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recurrence Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Recurrence Examples</h3>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <code className="text-sm bg-muted px-2 py-1 rounded">FREQ=WEEKLY;BYDAY=MO,WE;COUNT=6</code>
                    <p className="text-sm text-muted-foreground mt-1">6 weeks on Mondays & Wednesdays</p>
                  </div>
                  <div>
                    <code className="text-sm bg-muted px-2 py-1 rounded">FREQ=WEEKLY;BYDAY=SU;COUNT=8</code>
                    <p className="text-sm text-muted-foreground mt-1">8 weeks on Sundays</p>
                  </div>
                  <div>
                    <code className="text-sm bg-muted px-2 py-1 rounded">FREQ=DAILY;COUNT=5</code>
                    <p className="text-sm text-muted-foreground mt-1">5 consecutive days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Common Errors */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Common Errors & Solutions</h3>
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Missing Timezone:</strong> Add timezone offset to your datetime values.
                  <br />
                  <span className="text-sm">Example: <code>2025-08-29T14:00:00-04:00</code></span>
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Invalid Age Group:</strong> Use exactly U9, U10, etc. Separate with semicolons.
                  <br />
                  <span className="text-sm">Correct: <code>U10;U12</code></span>
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Invalid Gender:</strong> Use exact capitalization: Boys, Girls, or Mixed.
                  <br />
                  <span className="text-sm">Correct: <code>Mixed</code></span>
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Missing Access Code:</strong> Provide an access code or set has_access_code=false.
                  <br />
                  <span className="text-sm">If has_access_code=true, access_code is required</span>
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Import Flow */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Import Flow</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</div>
                <span>Upload CSV → Server parses and validates all rows</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</div>
                <span>Preview → Review table showing all data with any errors/warnings</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">3</div>
                <span>Confirm → Import executes in one transaction</span>
              </div>
            </div>
            
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Preview Display:</strong> Shows "X rows • Y errors • Z warnings". 
                Import is disabled until error count = 0. You can download errors as CSV if needed.
              </AlertDescription>
            </Alert>
          </div>

          {/* Need Help */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
            <ul className="text-sm space-y-2">
              <li>• Download the <strong>template</strong> for column headers</li>
              <li>• Download the <strong>sample</strong> for working examples</li>
              <li>• Contact support if you encounter persistent issues</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              Remember: The manual "Create Session" form is the authoritative source for all supported values and options.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}