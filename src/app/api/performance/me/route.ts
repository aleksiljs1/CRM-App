import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPerformanceData } from "../route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allData = await getPerformanceData();
    const myIndex = allData.findIndex((d) => d.user.id === session.user.id);

    if (myIndex === -1) {
      return Response.json(
        { error: "Performance data not found" },
        { status: 404 }
      );
    }

    return Response.json({
      performance: allData[myIndex],
      rank: myIndex + 1,
      totalEmployees: allData.length,
    });
  } catch (error) {
    console.error("Error fetching my performance:", error);
    return Response.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}
