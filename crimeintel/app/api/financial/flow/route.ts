import { NextResponse } from "next/server";
import { ServerDataLoader as DataClient } from "@/lib/api/serverDataLoader";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("account_id");

  try {
    const transactions = await DataClient.getTransactions();
    
    if (accountId) {
      // Filter transactions for a specific account (1 hop)
      const flows = transactions.filter((t: any) => t.from_account_id === accountId || t.to_account_id === accountId);
      return NextResponse.json({ flows });
    }

    // Default: return recent high-value or flagged transactions for overview
    const relevantFlows = transactions
      .filter((t: any) => t.flagged || t.amount > 50000)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);

    return NextResponse.json({ flows: relevantFlows });
  } catch (error) {
    console.error("Error fetching financial flow:", error);
    return NextResponse.json({ error: "Failed to fetch financial flow" }, { status: 500 });
  }
}
