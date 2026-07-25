import { AlertsDashboard } from "@/components/alerts/AlertsDashboard";

export const metadata = {
  title: "Early Warning & Alerts | CrimeIntel",
  description: "Predictive analytics and early warning system.",
};

<<<<<<< HEAD
export default async function AlertsPage() {
  try {
    const [alerts, districtRisks] = await Promise.all([
      PredictionEngine.getAlerts(),
      PredictionEngine.getDistrictRiskScores()
    ]);

    return <ClientAlerts alerts={alerts} districtRisks={districtRisks} />;
  } catch (error) {
    console.error('Failed to load alerts:', error);
    // Return with empty data if build-time fetch fails
    return <ClientAlerts alerts={[]} districtRisks={[]} />;
  }
=======
export default function AlertsPage() {
  return <AlertsDashboard />;
>>>>>>> 8d2043f5e78d2a5f1f607b86679277cdfb6de81c
}
