import React, { useState, useCallback } from 'react';
import Grid from './components/Grid';
import Dashboard from './components/Dashboard';
import Controls from './components/Controls';
import { api } from './api';

function timestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [state, setState] = useState(null);
  const [safeMoves, setSafeMoves] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);

  const addLog = useCallback((msg, type = 'info') => {
    setLog(prev => [...prev, { msg, type, time: timestamp() }]);
  }, []);

  const handleNewGame = async () => {
    setLoading(true);
    setSafeMoves([]);
    try {
      const data = await api.newGame(rows, cols);
      setSessionId(data.session_id);
      setState(data);
      setLog([]);
      addLog(`New ${rows}×${cols} world initialized. Agent at (0,0).`, 'success');
      addLog('No breeze or stench detected. Start cell is safe.', 'info');
    } catch (e) {
      addLog(`Error: ${e.message}`, 'error');
    }
    setLoading(false);
  };

  const handleCellClick = async (r, c) => {
    if (!sessionId || !state || state.game_over) return;
    setLoading(true);
    try {
      const data = await api.move(sessionId, r, c);
      setState(data);
      setSafeMoves([]);
      if (data.died) {
        addLog(`💀 Agent died at (${r},${c}): ${data.reason}`, 'error');
      } else {
        const p = data.percepts;
        addLog(`Moved to (${r},${c}). ${p.breeze ? 'BREEZE detected!' : ''} ${p.stench ? 'STENCH detected!' : ''} ${!p.breeze && !p.stench ? 'No percepts.' : ''}`.trim(), 'info');
      }
    } catch (e) {
      addLog(`Move failed: ${e.message}`, 'warn');
    }
    setLoading(false);
  };

  const handleInfer = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await api.infer(sessionId);
      setState(data);
      setSafeMoves(data.safe_moves || []);
      const safeCnt = (data.safe_moves || []).filter(m => m.is_safe && !m.visited).length;
      addLog(`Inference complete. ${safeCnt} adjacent safe cell(s) proven. Steps: ${data.kb_stats?.total_inference_steps}.`, 'success');
    } catch (e) {
      addLog(`Inference error: ${e.message}`, 'error');
    }
    setLoading(false);
  };

  const handleAutoMove = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await api.autoMove(sessionId);
      setState(data);
      setSafeMoves([]);
      if (data.died) {
        addLog(`💀 Auto-agent died: ${data.reason}`, 'error');
      } else if (!data.success) {
        addLog(`Agent stuck: ${data.reason}`, 'warn');
      } else {
        const pos = data.agent_pos;
        const p = data.percepts;
        addLog(`Auto-moved to (${pos[0]},${pos[1]}). ${p.breeze ? 'BREEZE! ' : ''}${p.stench ? 'STENCH! ' : ''}${!p.breeze && !p.stench ? 'Clear.' : ''}`.trim(), 'info');
      }
    } catch (e) {
      addLog(`Auto-move error: ${e.message}`, 'error');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        padding: '16px 32px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '36px', height: '36px', border: '2px solid var(--accent-blue)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-blue)', fontSize: '18px', fontWeight: 'bold'
          }}>W</div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
              Knowledge-Based Agent
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600 }}>
              Wumpus Logic Agent
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 500 }}>Engine</div>
            <div style={{ color: 'var(--accent-blue)', fontSize: '13px', fontWeight: 500 }}>Resolution Refutation</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 500 }}>Logic</div>
            <div style={{ color: 'var(--accent-blue)', fontSize: '13px', fontWeight: 500 }}>Propositional CNF</div>
          </div>
          {loading && (
            <div style={{ color: 'var(--accent-amber)', fontSize: '12px', fontWeight: 500, animation: 'blink 1.5s infinite' }}>
              Processing...
            </div>
          )}
        </div>
      </header>

      {/* Main layout */}
      <main style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: '280px 1fr 320px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        padding: '24px',
        gap: '24px',
      }}>

        {/* Left: Controls */}
        <aside>
          <Controls
            onNewGame={handleNewGame}
            onAutoMove={handleAutoMove}
            onInfer={handleInfer}
            loading={loading}
            gameOver={state?.game_over || false}
            rows={rows}
            cols={cols}
            onRowsChange={setRows}
            onColsChange={setCols}
          />
        </aside>

        {/* Center: Grid */}
          <section style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '32px',
          minHeight: '500px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
        }}>
          {!state ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--border)' }}>⊞</div>
              <div style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 500 }}>
                Initialize World to Begin
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
                Configure grid dimensions and click Initialize
              </div>
            </div>
          ) : (
            <>
              {state.game_over && (
                <div style={{
                  background: state.alive ? 'var(--cell-safe)' : 'var(--cell-danger)',
                  border: `1px solid ${state.alive ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                  borderRadius: '8px', padding: '12px 24px',
                  marginBottom: '20px', textAlign: 'center',
                  color: state.alive ? 'var(--accent-green)' : 'var(--accent-red)',
                  fontSize: '15px', fontWeight: 500,
                }}>
                  {state.alive ? '✓ Mission Complete' : '✕ Agent Terminated — Hazards Revealed'}
                </div>
              )}
              <Grid state={state} onCellClick={handleCellClick} safeMoves={safeMoves} />
            </>
          )}
        </section>

        {/* Right: Dashboard */}
        <aside>
          <Dashboard state={state} log={log} />
        </aside>
      </main>
    </div>
  );
}
