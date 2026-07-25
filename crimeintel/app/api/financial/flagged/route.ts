import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";

export async function GET(request: Request) {
  try {
    const transactions = await DataClient.getTransactions();
    
    // Find all flagged transactions
    const flaggedTransactions = transactions
      .filter((t: any) => t.flagged === true || t.pattern === "SUSPICIOUS" || t.pattern === "MULE")
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Aggregate stats
    const totalFlaggedAmount = flaggedTransactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const uniqueAccounts = new Set();
    flaggedTransactions.forEach((t: any) => {
      uniqueAccounts.add(t.from_account_id);
      uniqueAccounts.add(t.to_account_id);
    });

    return NextResponse.json({ 
      flaggedTransactions,
      stats: {
        total_flagged_count: flaggedTransactions.length,
        total_flagged_amount: totalFlaggedAmount,
        flagged_accounts_count: uniqueAccounts.size
      }
    });
  } catch (error) {
    console.error("Error fetching flagged transactions:", error);
    return NextResponse.json({ error: "Failed to fetch flagged transactions" }, { status: 500 });
  }
}
