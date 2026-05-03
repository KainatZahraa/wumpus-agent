import React from 'react';

const CELL_ICONS = {
  agent: '◈',
  pit: '◉',
  wumpus: '⚠',
  safe: '✓',
  unknown: '?',
  dead: '✕',
};

export default function Grid({ state, onCellClick, safeMoves }) {
  if (!state) return null;

  const {
    rows, cols, agent_pos, visited, safe_cells,
    pits, wumpus, game_over, alive, percepts
  } = state;

  const visitedSet = new Set((visited || []).map(([r, c]) => `${r},${c}`));
  const safeSet = new Set((safe_cells || []).map(([r, c]) => `${r},${c}`));
  const pitSet = new Set((pits || []).map(([r, c]) => `${r},${c}`));
  const safeMoveSet = new Set((safeMoves || [])
    .filter(m => m.is_safe && !m.visited)
    .map(m => `${m.pos[0]},${m.pos[1]}`));

  const isAgent = (r, c) => agent_pos && agent_pos[0] === r && agent_pos[1] === c;
  const isWumpus = (r, c) => wumpus && wumpus[0] === r && wumpus[1] === c;

  function getCellType(r, c) {
    const key = `${r},${c}`;
    if (isAgent(r, c)) return 'agent';
    if (game_over && pitSet.has(key)) return 'pit';
    if (game_over && isWumpus(r, c)) return 'wumpus';
    if (visitedSet.has(key)) return 'visited';
    if (safeSet.has(key) || safeMoveSet.has(key)) return 'safe';
    return 'unknown';
  }

  function getCellStyle(type) {
    const base = {
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'all 0.2s ease',
      border: '1px solid',
      borderRadius: '4px',
      position: 'relative',
      userSelect: 'none',
    };

    switch (type) {
      case 'agent':
        return { ...base,
          background: 'var(--cell-agent)',
          borderColor: 'var(--cell-agent-border)',
        };
      case 'visited':
        return { ...base,
          background: 'var(--cell-safe)',
          borderColor: 'var(--cell-safe-border)',
        };
      case 'safe':
        return { ...base,
          background: 'var(--cell-safe)',
          borderColor: 'var(--accent-green)',
        };
      case 'pit':
        return { ...base,
          background: 'var(--cell-danger)',
          borderColor: 'var(--cell-danger-border)',
        };
      case 'wumpus':
        return { ...base,
          background: '#fef3c7',
          borderColor: 'var(--accent-amber)',
        };
      default:
        return { ...base,
          background: 'var(--cell-unknown)',
          borderColor: 'var(--cell-unknown-border)',
        };
    }
  }

  const cellSize = Math.min(80, Math.floor(480 / Math.max(rows, cols)));
  const fontSize = cellSize * 0.35;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {/* Row labels */}
      <div style={{ display: 'grid', gridTemplateColumns: `20px repeat(${cols}, ${cellSize}px)`, gap: '4px', marginBottom: '4px' }}>
        <div />
        {Array.from({ length: cols }, (_, c) => (
          <div key={c} style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            {c}
          </div>
        ))}
      </div>

      {Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ display: 'grid', gridTemplateColumns: `20px repeat(${cols}, ${cellSize}px)`, gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-dim)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            {r}
          </div>
          {Array.from({ length: cols }, (_, c) => {
            const type = getCellType(r, c);
            const key = `${r},${c}`;
            const percept = visitedSet.has(key) && isAgent(r, c) ? percepts : null;

            return (
              <div
                key={c}
                style={{ ...getCellStyle(type), width: cellSize, height: cellSize }}
                onClick={() => !game_over && onCellClick(r, c)}
                title={`Cell (${r},${c})`}
              >
                {/* Main icon */}
                <span style={{
                  fontSize,
                  color: type === 'agent' ? 'var(--accent-blue)'
                    : type === 'visited' ? 'var(--accent-green)'
                    : type === 'safe' ? 'var(--accent-green-dim)'
                    : type === 'pit' ? 'var(--accent-red)'
                    : type === 'wumpus' ? 'var(--accent-amber)'
                    : 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1,
                }}>
                  {type === 'agent' && (alive ? CELL_ICONS.agent : CELL_ICONS.dead)}
                  {type === 'visited' && CELL_ICONS.safe}
                  {type === 'safe' && CELL_ICONS.safe}
                  {type === 'pit' && CELL_ICONS.pit}
                  {type === 'wumpus' && CELL_ICONS.wumpus}
                  {type === 'unknown' && CELL_ICONS.unknown}
                </span>

                {/* Percept indicators on agent cell */}
                {isAgent(r, c) && percept && (
                  <div style={{ display: 'flex', gap: '2px', marginTop: '3px' }}>
                    {percept.breeze && (
                      <span style={{ fontSize: '8px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>B</span>
                    )}
                    {percept.stench && (
                      <span style={{ fontSize: '8px', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>S</span>
                    )}
                  </div>
                )}

                {/* Coord label */}
                <span style={{ fontSize: '8px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {r},{c}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { color: 'var(--accent-blue)', label: 'Agent', icon: '◈' },
          { color: 'var(--accent-green)', label: 'Visited/Safe', icon: '✓' },
          { color: 'var(--text-dim)', label: 'Unknown', icon: '?' },
          { color: 'var(--accent-red)', label: 'Pit', icon: '◉' },
          { color: 'var(--accent-amber)', label: 'Wumpus', icon: '⚠' },
        ].map(({ color, label, icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color, fontSize: '16px' }}>{icon}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
