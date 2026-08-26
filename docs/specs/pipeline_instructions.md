# QuickML Pipeline Creation Instructions

This guide provides the exact steps to create all the remaining Machine Learning pipelines in the Zoho Catalyst QuickML UI. You can create these one by one.

---

## 🟢 Pipeline 2: Case Resolution Predictor
*Predicts whether an incoming case will be resolved or remain pending.*

1. Go to **Pipelines** → Click **Create Pipeline**
2. **Name**: `Case_Resolution_Predictor`
3. **Dataset**: Select `CaseMaster_Enriched`
4. **Pipeline Type**: Choose **AutoML**
5. **Target Column**: Select `IsResolved`
6. **Problem Type**: It should auto-detect as **Classification**.
7. Click **Run Pipeline** / **Train Model**.

---

## 🟢 Pipeline 3: Arrest Delay Predictor
*Predicts how many days it will take to arrest suspects in a new case.*

1. Go to **Pipelines** → Click **Create Pipeline**
2. **Name**: `Arrest_Delay_Predictor`
3. **Dataset**: Select `ArrestTimeline`
4. **Pipeline Type**: Choose **AutoML**
5. **Target Column**: Select `ArrestDelayDays`
6. **Problem Type**: It should auto-detect as **Regression**.
7. Click **Run Pipeline** / **Train Model**.

---

## 🟢 Pipeline 4: Chargesheet Predictor
*Predicts the probability of a chargesheet being filed for a case.*

1. Go to **Pipelines** → Click **Create Pipeline**
2. **Name**: `Chargesheet_Predictor`
3. **Dataset**: Select `CaseMaster_Enriched`
4. **Pipeline Type**: Choose **AutoML**
5. **Target Column**: Select `HasChargesheet`
6. **Problem Type**: It should auto-detect as **Classification**.
7. Click **Run Pipeline** / **Train Model**.

---

## 🔴 Pipeline 5: Recidivism Risk Scorer (CRITICAL)
*Predicts whether a given suspect is likely to be a repeat offender.*

1. Go to **Pipelines** → Click **Create Pipeline**
2. **Name**: `Recidivism_Risk_Scorer`
3. **Dataset**: Select `Accused_Enriched`
4. **Pipeline Type**: Choose **AutoML**
5. **Target Column**: Select `IsRepeatOffender`
6. **Problem Type**: It should auto-detect as **Classification**.
7. Click **Run Pipeline** / **Train Model**.

---

## 🔴 Pipeline 6: District Risk Scorer (CRITICAL)
*Classifies a district's overall risk level based on aggregated crime metrics.*

1. Go to **Pipelines** → Click **Create Pipeline**
2. **Name**: `District_Risk_Scorer`
3. **Dataset**: Select `DistrictCrimeAggregated`
4. **Pipeline Type**: Choose **AutoML**
5. **Target Column**: Select `RiskLevel`
6. **Problem Type**: It should auto-detect as **Classification** (Multi-class).
7. Click **Run Pipeline** / **Train Model**.

---

## 🔵 Pipeline 7: Crime Hotspot Forecast
*Time-series forecasting of crime volumes for the upcoming months.*

> [!IMPORTANT]
> This one is different! It is NOT an AutoML pipeline. It is a **Forecasting** pipeline.

1. Go to **Pipelines** → Click **Create Pipeline**
2. **Name**: `Crime_Hotspot_Forecast`
3. **Dataset**: Select `MonthlyDistrictCounts`
4. **Pipeline Type**: Choose **Forecasting** *(Do not choose AutoML)*
5. **Target Column**: Select `IncidentCount`
6. **Time Column**: Select `YearMonth`
7. **Group By** (or Entity Column): Select `DistrictName`
8. Click **Run Pipeline** / **Train Model**.

---

## 🚀 Final Step: Creating Endpoints

Once **all** pipelines have finished training successfully (Status: Completed), you need to expose them so our Next.js app can call them.

For **each** of the 6 pipelines above (plus your original `Crime_Severity_Predictor`):
1. Go to **Endpoints** in the left sidebar.
2. Click **Create Endpoint**.
3. **Name**: Use the exact name of the pipeline (e.g., `Case_Resolution_Predictor`).
4. **Model**: Select the trained model that corresponds to the name.
5. Click **Create** and then **Publish**.

Let me know once you have created the endpoints, and then I will update the Next.js app code to connect to them!
