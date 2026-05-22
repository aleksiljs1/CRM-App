import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagerDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manager Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manager Dashboard - Coming Soon. Track team performance, tasks, and
            client assignments.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
