import { NextResponse } from "next/server";

const mockLogs = [
  {
    id: "LOG-001",
    timestamp: new Date().toISOString(),
    user: "Insp. Rajesh Kumar",
    action: "READ",
    resource: "FIR/102/2024",
    status: "SUCCESS",
    ip: "192.168.1.45"
  },
  {
    id: "LOG-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    user: "Const. Suresh Babu",
    action: "EXPORT",
    resource: "PERSON_1204",
    status: "DENIED",
    ip: "10.0.0.12",
    reason: "Insufficient clearance level"
  },
  {
    id: "LOG-003",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: "Admin",
    action: "UPDATE_ROLE",
    resource: "USER_45",
    status: "SUCCESS",
    ip: "192.168.1.10"
  },
  {
    id: "LOG-004",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    user: "System",
    action: "BULK_INGEST",
    resource: "CATALYST_BUCKET",
    status: "SUCCESS",
    ip: "INTERNAL"
  },
  {
    id: "LOG-005",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    user: "Insp. Rajesh Kumar",
    action: "READ",
    resource: "CASE_2024_08",
    status: "SUCCESS",
    ip: "192.168.1.45"
  }
];

export async function GET() {
  try {
    return NextResponse.json({ logs: mockLogs });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
