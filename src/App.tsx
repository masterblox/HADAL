export function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(circle at top, rgba(196,255,44,0.14), transparent 38%), #060800',
        color: 'rgba(196,255,44,0.82)',
        fontFamily: '"Share Tech Mono", monospace',
      }}
    >
      <div
        style={{
          width: 'min(720px, calc(100vw - 32px))',
          border: '1px solid rgba(196,255,44,0.22)',
          background: 'rgba(8,10,2,0.9)',
          padding: '24px',
          boxShadow: '0 0 40px rgba(196,255,44,0.08)',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            letterSpacing: '0.28em',
            color: 'rgba(196,255,44,0.42)',
            marginBottom: '12px',
          }}
        >
          HADAL TERMINAL
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: '40px',
            lineHeight: 1,
            fontWeight: 400,
            letterSpacing: '0.08em',
          }}
        >
          Threat Intelligence Terminal
        </h1>
        <p
          style={{
            margin: '16px 0 0',
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'rgba(196,255,44,0.64)',
          }}
        >
          The Vite shell is active. The primary terminal currently lives in
          <code style={{ marginLeft: 6, marginRight: 6 }}>hadal.html</code>
          while the React extraction is in progress.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          <a
            href="/hadal.html"
            style={{
              color: '#060800',
              background: '#c4ff2c',
              textDecoration: 'none',
              padding: '10px 14px',
              letterSpacing: '0.12em',
              fontSize: '12px',
            }}
          >
            OPEN TERMINAL
          </a>
          <a
            href="/README.md"
            style={{
              color: 'rgba(196,255,44,0.82)',
              border: '1px solid rgba(196,255,44,0.22)',
              textDecoration: 'none',
              padding: '10px 14px',
              letterSpacing: '0.12em',
              fontSize: '12px',
            }}
          >
            PROJECT NOTES
          </a>
        </div>
      </div>
    </main>
  )
}
