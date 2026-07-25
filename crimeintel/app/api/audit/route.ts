import { NextResponse } from 'next/server';
import { getCatalystApp } from '@/lib/catalyst';

export async function POST(request: Request) {
  try {
    const log = await request.json();
    const app = getCatalystApp();
    const datastore = app.datastore();
    await datastore.table('AuditLog').insertRow({
      event_type: log.event_type,
      user_id: log.user_id,
      user_role: log.user_role,
      timestamp: log.timestamp,
      ip_address: log.ip_address,
      details: JSON.stringify(log.details)
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Audit API Error:", error);
    return NextResponse.json({ error: "Failed to save audit log" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const app = getCatalystApp();
    const zcql = app.zcql();
    const rows = await zcql.executeZCQLQuery(
      `SELECT * FROM AuditLog ORDER BY timestamp DESC LIMIT 500`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Audit GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
