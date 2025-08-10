// Let me create a clean version by copying the working parts and building a clean file structure
// This will be faster than trying to remove all leftover fragments piece by piece

// Plan & Features Component - This should be the only content in the plan tab
function PlanAndFeaturesContent() {
  const { data: tenantPlan, isLoading: tenantPlanLoading } = useTenantPlan();
  const { data: subscriptionInfo, isLoading: subscriptionLoading } = useSubscriptionInfo();
  const { data: planFeatures } = usePlanFeatures();

  if (tenantPlanLoading || subscriptionLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Loading plan information...</div>
      </div>
    );
  }

  const currentPlan = tenantPlan?.planId || planFeatures?.planLevel || 'free';
  const planDisplayName = PLANS[currentPlan as keyof typeof PLANS]?.name || 'Free';
  const planPrice = PLANS[currentPlan as keyof typeof PLANS]?.price || 0;
  const billingStatus = tenantPlan?.billingStatus || 'none';
  const hasActiveSubscription = billingStatus === 'active';

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Crown className="w-5 h-5 mr-2 text-amber-500" />
            Current Plan
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Your plan determines which features and limits are available for your organization.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-foreground capitalize mb-2">
                {planDisplayName} Plan
              </div>
              <div className="text-sm text-muted-foreground">
                {planPrice === 0 ? 'Free forever' : `$${planPrice}/month`}
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-lg font-semibold text-foreground mb-2">Player Limit</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {PLANS[currentPlan as keyof typeof PLANS]?.features.maxPlayers === 'unlimited' 
                  ? 'Unlimited' 
                  : PLANS[currentPlan as keyof typeof PLANS]?.features.maxPlayers || 10}
              </div>
              <div className="text-sm text-muted-foreground">
                Currently registered: {planFeatures?.playerCount || 0}
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-lg font-semibold text-foreground mb-2">Billing Status</div>
              <div className="space-y-2">
                {hasActiveSubscription ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {currentPlan === 'free' ? 'Free Plan' : 'Inactive'}
                    </span>
                  </div>
                )}
                
                <ManageSubscriptionButton
                  planId={currentPlan as any}
                  billingStatus={billingStatus as any}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison Cards */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Plan Options
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Compare features and upgrade to unlock more capabilities for your organization.
          </p>
        </CardHeader>
        <CardContent>
          <PlanComparisonCards currentPlan={currentPlan as any} />
        </CardContent>
      </Card>

      {/* Feature Availability */}
      <FeatureAvailabilityList currentPlan={currentPlan as any} />
    </div>
  );
}

// The Plan & Features tab content should be simply:
//
//         <TabsContent value="plan" className="space-y-6">
//           <PlanAndFeaturesContent />
//         </TabsContent>
//
// Nothing more, nothing less. All the old implementation needs to be completely removed.