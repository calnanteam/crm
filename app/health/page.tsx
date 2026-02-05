export default async function HealthPage() {
  // Fetch health check data from the API endpoint
  let healthData;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/health`, {
      cache: 'no-store',
    });
    healthData = await response.json();
  } catch (error) {
    healthData = {
      ok: false,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      db: {
        ok: false,
        details: 'Failed to fetch health data',
      },
    };
  }

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
