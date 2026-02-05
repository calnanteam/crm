import { prisma } from "@/lib/prisma";

export default async function HealthPage() {
  // Perform health check directly (no HTTP round-trip needed)
  const timestamp = new Date().toISOString();
  const env = process.env.NODE_ENV || "development";
  
  let dbOk = false;
  let dbDetails: string | undefined;

  try {
    // Lightweight DB connectivity check using contact.count()
    await prisma.contact.count();
    dbOk = true;
  } catch (error) {
    // Don't expose sensitive error details
    dbDetails = error instanceof Error ? "Database connection failed" : "Unknown database error";
  }

  const ok = dbOk;
  
  const healthData = {
    ok,
    timestamp,
    env,
    db: {
      ok: dbOk,
      details: dbDetails,
    },
  };

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '2rem',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Health Check</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Overall Status:</strong> {healthData.ok ? '✓ PASS' : '✗ FAIL'}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>DB:</strong> {healthData.db.ok ? '✓ PASS' : '✗ FAIL'}
        {healthData.db.details && (
          <div style={{ marginLeft: '1rem', color: '#666' }}>
            {healthData.db.details}
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Timestamp:</strong> {healthData.timestamp}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Environment:</strong> {healthData.env}
      </div>
    </div>
  );
}
