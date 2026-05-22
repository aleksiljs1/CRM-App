import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;

  switch (role) {
    case "ADMIN":
      redirect("/dashboard/admin");
    case "PARTNER":
      redirect("/dashboard/partner");
    case "CLIENT":
      redirect("/dashboard/client");
    case "MANAGER":
      redirect("/dashboard/manager");
    default:
      redirect("/dashboard/hr");
  }
}
