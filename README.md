# Wumpus Logic Agent 

A **Knowledge-Based AI Agent** that navigates a dynamic Wumpus World grid using **Propositional Logic** and **Resolution Refutation**. Built with Python (FastAPI) backend and React frontend.



---

## Architecture

```
React Frontend (Vite)          Python Backend (FastAPI)
─────────────────────          ────────────────────────
Grid Visualization       ←──→  world.py   — Grid & hazard placement
Dashboard & Metrics            kb.py      — Knowledge Base + CNF
Controls Panel                 resolution — Resolution Refutation
Event Log                      agent.py   — Decision-making agent
                               main.py    — REST API endpoints
```

---

## How It Works

### 1. Environment
- NxN grid with randomly placed **Pits** and one **Wumpus**
- Agent starts at `(0,0)` — always safe
- Agent receives **percepts** only from its current cell:
  - **Breeze** → a pit is adjacent
  - **Stench** → Wumpus is adjacent

### 2. Knowledge Base (KB)
The KB stores propositional logic sentences in **Conjunctive Normal Form (CNF)**. When the agent receives percepts at `(r,c)`, it `TELL`s the KB:

```
Breeze(r,c)  ⟺  Pit(r-1,c) ∨ Pit(r+1,c) ∨ Pit(r,c-1) ∨ Pit(r,c+1)
Stench(r,c)  ⟺  W(r-1,c) ∨ W(r+1,c) ∨ W(r,c-1) ∨ W(r,c+1)
```

### 3. Resolution Refutation
Before moving to cell `(r,c)`, the agent **ASK**s the KB:
> "Is ¬Pit(r,c) ∧ ¬Wumpus(r,c) provable?"

**Algorithm:**
1. Negate the query → assume `Pit(r,c)` is true
2. Add negation to KB clauses
3. Repeatedly resolve complementary clause pairs
4. If **empty clause** found → **contradiction** → cell is **SAFE** ✅
5. If fixpoint reached → cannot prove safety ⚠️

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Python + FastAPI |
| Logic Engine | Pure Python (kb.py, resolution.py) |
| Styling | CSS Variables + Google Fonts |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # starts at http://localhost:5173
```

Set `VITE_API_URL` in `frontend/.env` if backend URL differs:
```
VITE_API_URL=http://localhost:8000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/new-game` | Initialize new world session |
| POST | `/move` | Move agent to adjacent cell |
| POST | `/auto-move` | Agent autonomously picks best move |
| POST | `/infer` | Run resolution on all adjacent cells |
| GET | `/state/{session_id}` | Get full game state |

---

## CNF Conversion Logic

The biconditional `B ⟺ (P₁ ∨ P₂ ∨ P₃)` is split into:
- **Forward:** `¬B ∨ P₁ ∨ P₂ ∨ P₃`
- **Backward:** `(¬P₁ ∨ B)`, `(¬P₂ ∨ B)`, `(¬P₃ ∨ B)`

No-breeze `¬B ⟹ ¬P₁ ∧ ¬P₂ ∧ ¬P₃` gives unit clauses `{¬P₁}`, `{¬P₂}`, `{¬P₃}`.

---

## Project Structure

```
wumpus-agent/
├── backend/
│   ├── main.py          # FastAPI app + endpoints
│   ├── agent.py         # Agent decision logic
│   ├── kb.py            # Knowledge Base + CNF + Resolution
│   ├── world.py         # Grid world + percept generation
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main layout
│   │   ├── api.js           # API service layer
│   │   ├── components/
│   │   │   ├── Grid.jsx     # Visual grid board
│   │   │   ├── Dashboard.jsx # Metrics + percepts
│   │   │   └── Controls.jsx  # Game controls
│   │   └── index.css        # Global styles
│   └── package.json
└── README.md
```
