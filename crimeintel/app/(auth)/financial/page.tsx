import { DataClient } from "@/lib/api/dataClient";
import { ClientFinancial } from "./ClientFinancial";

export const metadata = {
  title: "Financial Intelligence | CrimeIntel",
  description: "Detect money laundering patterns and trace illicit financial flows.",
};

export default async function FinancialIntelligencePage() {
  const transactions = await DataClient.getTransactions();

  return <ClientFinancial transactions={transactions} />;
}
