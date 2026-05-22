import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>System Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Admin Dashboard - Coming Soon. Manage users, roles, system settings,
            and audit logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
