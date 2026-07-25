import { PredictionEngine } from "@/lib/api/predictionEngine";
import { ClientAlerts } from "./ClientAlerts";

export const metadata = {
  title: "Early Warning & Alerts | CrimeIntel",
  description: "Predictive analytics and early warning system.",
};

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
}
