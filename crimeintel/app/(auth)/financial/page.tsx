import { FinancialDashboard } from "@/components/financial/FinancialDashboard";

export const metadata = {
  title: "Financial Intelligence | CrimeIntel",
  description: "Detect money laundering patterns and trace illicit financial flows.",
};

export default function FinancialIntelligencePage() {
  return <FinancialDashboard />;
}
