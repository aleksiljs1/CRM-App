import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Client Portal</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Client Portal - Coming Soon. View your submissions, documents, and
            communicate with your team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
