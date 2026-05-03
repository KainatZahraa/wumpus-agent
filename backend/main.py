"""
FastAPI backend for Wumpus World Logic Agent.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid

from agent import WumpusAgent

app = FastAPI(title="Wumpus World API", version="1.0.0")

# Allow React frontend (localhost:5173 for Vite dev, and production domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store: session_id -> WumpusAgent
sessions: dict[str, WumpusAgent] = {}


# --------------------------------------------------------------------------- #
#  Request / Response Models                                                  #
# --------------------------------------------------------------------------- #

class NewGameRequest(BaseModel):
    rows: int = 4
    cols: int = 4

class MoveRequest(BaseModel):
    session_id: str
    row: int
    col: int

class SessionRequest(BaseModel):
    session_id: str


# --------------------------------------------------------------------------- #
#  Endpoints                                                                  #
# --------------------------------------------------------------------------- #

@app.get("/")
def root():
    return {"message": "Wumpus World Agent API is running."}


@app.post("/new-game")
def new_game(req: NewGameRequest):
    """Start a new game session with a fresh world."""
    if req.rows < 2 or req.cols < 2 or req.rows > 8 or req.cols > 8:
        raise HTTPException(status_code=400, detail="Grid must be between 2x2 and 8x8.")

    session_id = str(uuid.uuid4())
    agent = WumpusAgent(req.rows, req.cols)
    sessions[session_id] = agent

    state = agent.get_full_state()
    return {
        "session_id": session_id,
        **state,
    }


@app.post("/move")
def move(req: MoveRequest):
    """Move the agent to a specified adjacent cell."""
    agent = _get_agent(req.session_id)
    result = agent.move(req.row, req.col)
    state = agent.get_full_state()
    return {**result, **state}


@app.post("/auto-move")
def auto_move(req: SessionRequest):
    """Let the agent autonomously pick the best safe move."""
    agent = _get_agent(req.session_id)
    if agent.world.game_over:
        raise HTTPException(status_code=400, detail="Game is already over.")
    result = agent.auto_move()
    state = agent.get_full_state()
    return {**result, **state}


@app.post("/infer")
def infer(req: SessionRequest):
    """Run inference on all cells and return safe cell set."""
    agent = _get_agent(req.session_id)
    safe_moves = agent.get_safe_moves()
    state = agent.get_full_state()
    return {
        "safe_moves": safe_moves,
        **state,
    }


@app.get("/state/{session_id}")
def get_state(session_id: str):
    """Get the current full game state."""
    agent = _get_agent(session_id)
    return agent.get_full_state()


# --------------------------------------------------------------------------- #
#  Helper                                                                     #
# --------------------------------------------------------------------------- #

def _get_agent(session_id: str) -> WumpusAgent:
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found. Start a new game.")
    return sessions[session_id]
