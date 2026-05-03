import React from 'react';

function StatCard({ label, value, color = 'var(--accent-blue)', sub }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '16px',
      flex: 1,
      minWidth: '120px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: '24px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

function PerceptBadge({ active, label, color, symbol }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px',
      background: active ? 'var(--bg-secondary)' : 'var(--bg-card)',
      border: `1px solid ${active ? color : 'var(--border)'}`,
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      flex: 1,
      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.02)' : 'none',
    }}>
      <span style={{ fontSize: '20px', color: active ? color : 'var(--text-dim)' }}>{symbol}</span>
      <div>
        <div style={{ color: active ? color : 'var(--text-secondary)', fontSize: '13px', fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
          {active ? 'Detected' : 'None'}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ state, log }) {
  if (!state) return null;
  const { percepts, kb_stats, agent_pos, visited, safe_cells, game_over, alive } = state;

  const status = !game_over ? 'EXPLORING'
    : alive ? 'SUCCESS'
    : 'TERMINATED';

  const statusColor = !game_over ? 'var(--accent-green)'
    : alive ? 'var(--accent-cyan)'
    : 'var(--accent-red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Status banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid var(--border)`,
        borderLeft: `4px solid ${statusColor}`,
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>
            AGENT STATUS
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600, marginTop: '2px' }}>
            {status}
          </div>
        </div>
        {agent_pos && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 }}>Position</div>
            <div style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, marginTop: '2px' }}>
              ({agent_pos[0]}, {agent_pos[1]})
            </div>
          </div>
        )}
      </div>

      {/* Percepts */}
      <div>
        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          Active Percepts
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <PerceptBadge
            active={percepts?.breeze}
            label="BREEZE"
            color="var(--accent-cyan)"
            symbol="〜"
          />
          <PerceptBadge
            active={percepts?.stench}
            label="STENCH"
            color="var(--accent-amber)"
            symbol="☠"
          />
        </div>
      </div>

      {/* Stats */}
      <div>
        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          Inference Metrics
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <StatCard
            label="Inference Steps"
            value={kb_stats?.total_inference_steps ?? 0}
          />
          <StatCard
            label="KB Clauses"
            value={kb_stats?.num_clauses ?? 0}
          />
          <StatCard
            label="Cells Visited"
            value={visited?.length ?? 0}
          />
          <StatCard
            label="Safe Inferred"
            value={safe_cells?.length ?? 0}
          />
        </div>
      </div>

      {/* Event log */}
      <div>
        <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          Event Log
        </div>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px',
          height: '240px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: '8px',
          boxShadow: 'inner 0 1px 2px rgba(0,0,0,0.02)',
        }}>
          {(log || []).length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
              Awaiting agent activity...
            </div>
          ) : (
            [...(log || [])].reverse().map((entry, i) => (
              <div key={i} style={{
                color: entry.type === 'error' ? 'var(--accent-red)'
                  : entry.type === 'warn' ? 'var(--accent-amber)'
                  : 'var(--text-primary)',
                fontSize: '13px',
                padding: '4px 0',
                borderBottom: '1px solid var(--border)',
                lineHeight: 1.4,
              }}>
                <span style={{ color: 'var(--text-dim)', marginRight: '8px', fontSize: '11px' }}>{entry.time}</span>
                {entry.msg}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
