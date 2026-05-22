import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  INCOMPLETE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  COMPLETE: "bg-blue-100 text-blue-700 border-blue-200",
  UNDER_REVIEW: "bg-purple-100 text-purple-700 border-purple-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  INCOMPLETE: "Incomplete",
  COMPLETE: "Complete",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const client = await prisma.client.findFirst({
    where: { contactEmail: session.user.email },
  });

  const submissions = client
    ? await prisma.clientSubmission.findMany({
        where: { clientId: client.id },
        include: {
          processType: true,
          documents: true,
        },
        orderBy: { submittedAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
        {client && (
          <p className="text-muted-foreground mt-1">
            Welcome back,{" "}
            <span className="font-medium text-[#00968a]">
              {client.companyName}
            </span>
          </p>
        )}
        {!client && (
          <p className="text-muted-foreground mt-1">
            Welcome, {session.user.name ?? session.user.email}
          </p>
        )}
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No active processes. Contact your representative to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {submissions.map((sub) => (
            <Card key={sub.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {sub.processType.name}
                  </CardTitle>
                  <Badge
                    className={`text-xs border ${statusColors[sub.status] ?? ""}`}
                  >
                    {statusLabels[sub.status] ?? sub.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="font-medium">
                      {sub.submittedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Documents uploaded
                    </span>
                    <span className="font-medium">{sub.documents.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
