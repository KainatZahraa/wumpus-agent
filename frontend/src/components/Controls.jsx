import React, { useState } from 'react';

function Button({ onClick, disabled, children, color = 'var(--accent-green)', variant = 'outline' }) {
  const [hover, setHover] = useState(false);
  const filled = variant === 'filled';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: filled && !disabled ? color : (filled ? 'var(--bg-card)' : 'transparent'),
        border: `1px solid ${disabled ? 'var(--border-bright)' : color}`,
        color: disabled ? 'var(--text-dim)' : (filled && !disabled ? '#ffffff' : color),
        padding: '10px 20px',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        boxShadow: hover && !disabled ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

export default function Controls({
  onNewGame, onAutoMove, onInfer,
  loading, gameOver, rows, cols,
  onRowsChange, onColsChange,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Grid size config */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}>
        <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
          Config
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
              Rows
            </label>
            <input
              type="number" min={2} max={8} value={rows}
              onChange={e => onRowsChange(Number(e.target.value))}
              style={{
                width: '100%', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-bright)', borderRadius: '6px',
                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                fontSize: '15px', padding: '10px 12px', outline: 'none',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
              Cols
            </label>
            <input
              type="number" min={2} max={8} value={cols}
              onChange={e => onColsChange(Number(e.target.value))}
              style={{
                width: '100%', background: 'var(--bg-secondary)',
                border: '1px solid var(--border-bright)', borderRadius: '6px',
                color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                fontSize: '15px', padding: '10px 12px', outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}>
        <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
          Actions
        </div>

        <Button onClick={onNewGame} disabled={loading} color="var(--accent-green)" variant="filled">
          ⟳  Initialize New World
        </Button>

        <Button onClick={onInfer} disabled={loading || gameOver} color="var(--accent-cyan)">
          ⬡  Run Inference (ASK KB)
        </Button>

        <Button onClick={onAutoMove} disabled={loading || gameOver} color="var(--accent-amber)">
          ▶  Auto Move (Agent Step)
        </Button>
      </div>

      {/* Instructions */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}>
        <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
          Instructions
        </div>
        {[
          ['Click cell', 'Move manually'],
          ['Run Inference', 'KB deduces safe'],
          ['Auto Move', 'Agent picks best'],
          ['Green ✓', 'Safe cell'],
          ['Gray ?', 'Unknown cell'],
          ['Red ◉', 'Pit hazard'],
          ['Amber ⚠', 'Wumpus hazard'],
        ].map(([key, val]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>{key}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
