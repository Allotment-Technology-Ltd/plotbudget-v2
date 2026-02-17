/**
 * Inline preview of the PLOT app dashboard for the marketing showcase.
 * Renders a mini dashboard (header + hero metrics) in light or dark theme
 * so the section always reflects the current app without static screenshots.
 */
export default function AppPreview({ variant = 'light' }) {
  const isDark = variant === 'dark';

  const styles = {
    dark: {
      bg: '#0a0a0a',
      cardBg: '#1a1a1a',
      text: '#F5F0EA',
      muted: '#999999',
      accent: '#69F0AE',
      border: 'rgba(255,255,255,0.08)',
      progressBg: '#2a2a2a',
    },
    light: {
      bg: '#F5F0EA',
      cardBg: '#ffffff',
      text: '#111111',
      muted: '#555555',
      accent: '#0E8345',
      border: 'rgba(0,0,0,0.08)',
      progressBg: '#eae6e1',
    },
  };

  const s = styles[variant] ?? styles.light;

  return (
    <div
      style={{
        width: '100%',
        minHeight: '512px',
        maxHeight: '512px',
        overflowY: 'auto',
        background: s.bg,
        color: s.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        paddingTop: '12px',
        paddingBottom: '16px',
        paddingLeft: '12px',
        paddingRight: '12px',
        boxSizing: 'border-box',
      }}
      aria-hidden
    >
      {/* Header */}
      <header
        style={{
          paddingBottom: '12px',
          borderBottom: `1px solid ${s.border}`,
          marginBottom: '12px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Dashboard
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: s.muted }}>
          Your financial overview · 1 Feb – 28 Feb
        </p>
      </header>

      {/* Hero metrics — 2-col then full width */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        {[
          { label: 'Allocated', value: '£2,400', sub: 'of £2,800', pct: 86 },
          { label: 'Left to pay', value: '£412', sub: '15% left', pct: 15 },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: s.cardBg,
              border: `1px solid ${s.border}`,
              borderRadius: '8px',
              padding: '10px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: s.muted,
              }}
            >
              {m.label}
            </p>
            <p style={{ margin: '4px 0 2px', fontSize: '16px', fontWeight: 700 }}>
              {m.value}
            </p>
            <p style={{ margin: 0, fontSize: '10px', color: s.muted }}>{m.sub}</p>
            <div
              style={{
                height: '4px',
                background: s.progressBg,
                borderRadius: '2px',
                marginTop: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${m.pct}%`,
                  height: '100%',
                  background: s.accent,
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Days left — full width */}
      <div
        style={{
          background: s.cardBg,
          border: `1px solid ${s.border}`,
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '12px',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '9px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: s.muted,
          }}
        >
          Days Left
        </p>
        <p style={{ margin: '4px 0 2px', fontSize: '16px', fontWeight: 700 }}>
          14 days
        </p>
        <p style={{ margin: 0, fontSize: '10px', color: s.muted }}>
          50% through cycle
        </p>
        <div
          style={{
            height: '4px',
            background: s.progressBg,
            borderRadius: '2px',
            marginTop: '6px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '50%',
              height: '100%',
              background: s.accent,
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      {/* Quick actions hint */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: `1px solid ${s.border}`,
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: s.accent,
            letterSpacing: '0.05em',
          }}
        >
          Dashboard
        </span>
        <span style={{ fontSize: '10px', color: s.muted }}>Blueprint</span>
      </div>
    </div>
  );
}
