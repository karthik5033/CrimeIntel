import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";

export async function GET() {
  try {
    const logs = await DataClient.getAuditLogs();
    
    // Sort logs by timestamp descending if available
    const sortedLogs = logs.sort((a: any, b: any) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ logs: sortedLogs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
