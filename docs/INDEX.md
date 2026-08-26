# 📚 CrimeIntel Documentation Index

Welcome to the centralized documentation directory for the **CrimeIntel** (Project-Rainfall) project for Karnataka State Police.

All documentation, architecture plans, deployment guides, and forensic audit reports are categorized below.

---

## 📑 Table of Contents

- [1. System Specifications & Architecture](#1-system-specifications--architecture)
- [2. Deployment & AppSail Guides](#2-deployment--appsail-guides)
- [3. Audits, Status Reports & Verification](#3-audits-status-reports--verification)
- [4. Primary Quick References](#4-primary-quick-references)

---

## 1. System Specifications & Architecture
*Location:* [`docs/specs/`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/)

| Document | Description |
|---|---|
| [`CrimeIntel_Implementation_Plan_v4.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/CrimeIntel_Implementation_Plan_v4.md) | **Master Blueprint**: End-to-end technical implementation plan across all 26 phases. |
| [`Police_FIR_ER_Diagram.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/Police_FIR_ER_Diagram.md) | **Database Schema**: Authoritative 23-table ER diagram with `CaseMaster` spine. |
| [`PRD_CrimeIntel_KSP.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/PRD_CrimeIntel_KSP.md) | **Product Requirements Document (PRD)** for Karnataka State Police intelligence copilot. |
| [`CrimeIntel_TRD.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/CrimeIntel_TRD.md) | **Technical Requirements Document (TRD)** detailing system architecture and SLAs. |
| [`Abstract.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/Abstract.md) | Executive summary and abstract of CrimeIntel. |
| [`pipeline_instructions.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/pipeline_instructions.md) | Data processing and ingestion pipeline guidelines. |
| [`synthetic_data_generation_prompt.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/synthetic_data_generation_prompt.md) | Prompts and constraints used to generate realistic synthetic police records. |
| [`batch4_generation_prompt.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/batch4_generation_prompt.md) | Prompts for batch data generation. |
| [`v2_upgrade.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/v2_upgrade.md) | Upgrade specifications for V2 system capabilities. |

---

## 2. Deployment & AppSail Guides
*Location:* [`docs/deployment/`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/deployment/)

| Document | Description |
|---|---|
| [`DEPLOYMENT_GUIDE.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/DEPLOYMENT_GUIDE.md) | **Primary Guide**: How to build, package, and deploy Next.js to AppSail (includes live URL). |
| [`UPLOAD_TO_APPSAIL.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/deployment/UPLOAD_TO_APPSAIL.md) | Step-by-step console upload guide for Catalyst AppSail. |
| [`DEPLOYMENT_READY_FINAL.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/deployment/DEPLOYMENT_READY_FINAL.md) | Package readiness checklist and `server.js` standalone configuration. |
| [`STRATUS_REAL_CONNECTION_GUIDE.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/deployment/STRATUS_REAL_CONNECTION_GUIDE.md) | Guide for connecting Catalyst Stratus (File Store) for FIR PDF uploads. |
| [`STRATUS_UPLOAD_GUIDE.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/deployment/STRATUS_UPLOAD_GUIDE.md) | File upload handling instructions for Stratus buckets. |
| [`CATALYST_DEPLOYMENT_TROUBLESHOOTING.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/deployment/CATALYST_DEPLOYMENT_TROUBLESHOOTING.md) | Troubleshooting common deployment errors (port mismatches, extraction failures). |
| [`GITHUB_DEPLOY_GUIDE.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/deployment/GITHUB_DEPLOY_GUIDE.md) | Git-based workflow and deployment instructions. |
| [`POST_DEPLOYMENT_CHECKLIST.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/deployment/POST_DEPLOYMENT_CHECKLIST.md) | Post-deployment smoke test verification checklist. |
| [`GET_CATALYST_TOKEN.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/deployment/GET_CATALYST_TOKEN.md) | Instructions to generate Zoho Catalyst CLI authentication tokens. |

---

## 3. Audits, Status Reports & Verification
*Location:* [`docs/audits_and_status/`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/audits_and_status/)

| Document | Description |
|---|---|
| [`IMPLEMENTATION_AUDIT_REPORT.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/audits_and_status/IMPLEMENTATION_AUDIT_REPORT.md) | Deep audit of codebase against planned features. |
| [`STEP_1_AUDIT.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/audits_and_status/STEP_1_AUDIT.md) | Forensic evaluation of Step 1 / Phase 0.0 database foundation. |
| [`STEP_1_COMPLETED.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/audits_and_status/STEP_1_COMPLETED.md) | Historical report on initial table generation and mock loading. |
| [`CURRENT_STATUS_AND_NEXT_STEPS.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/audits_and_status/CURRENT_STATUS_AND_NEXT_STEPS.md) | Summary of active features and outstanding tasks. |
| [`PHASE_0.3_0.4_VERIFICATION.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/audits_and_status/PHASE_0.3_0.4_VERIFICATION.md) | Verification notes for Intent Classification and GraphRAG. |
| [`FINAL_STATUS_GEMINI_STRATUS.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/audits_and_status/FINAL_STATUS_GEMINI_STRATUS.md) | Status log for Gemini LLM and Stratus bucket integrations. |
| [`DATABASE_UPDATE_FIX.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/audits_and_status/DATABASE_UPDATE_FIX.md) | Record of ZCQL query fixes and schema updates. |
| [`OCR_FIX.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/audits_and_status/OCR_FIX.md) | Documentation on OCR pipeline adjustments. |
| [`PERFORMANCE_BENCHMARKING_SLIDE.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/audits_and_status/PERFORMANCE_BENCHMARKING_SLIDE.md) | AppSail performance and latency benchmarking data. |

---

## 4. Primary Quick References

- **Live Deployed Application:** [https://crimeintel-50044146268.development.catalystappsail.in/](https://crimeintel-50044146268.development.catalystappsail.in/)
- **Main Deployment Guide:** [`DEPLOYMENT_GUIDE.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/DEPLOYMENT_GUIDE.md)
- **Database ER Diagram:** [`docs/specs/Police_FIR_ER_Diagram.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/Police_FIR_ER_Diagram.md)
- **Implementation Plan:** [`docs/specs/CrimeIntel_Implementation_Plan_v4.md`](file:///c:/Users/Kishan%20Shetty/Downloads/DATATHON%20KSP/CrimeIntel/docs/specs/CrimeIntel_Implementation_Plan_v4.md)
