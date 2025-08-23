import DunningDashboard from '@/components/super-admin/DunningDashboard';

export default function SuperAdminDunning() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Payment Recovery</h1>
        <p className="text-lg text-muted-foreground">
          Manage failed payments and recovery processes across all tenants
        </p>
      </div>
      
      <DunningDashboard />
    </div>
  );
}