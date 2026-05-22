import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Partner Overview</h1>
      <Card>
        <CardHeader>
          <CardTitle>Partner Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Partner Dashboard - Coming Soon. Overview of all departments,
            clients, and key metrics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
