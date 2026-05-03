import random
from typing import List, Tuple, Dict, Set


class WumpusWorld:
    def __init__(self, rows: int, cols: int):
        self.rows = rows
        self.cols = cols
        self.pits: Set[Tuple[int, int]] = set()
        self.wumpus: Tuple[int, int] = None
        self.agent_pos: Tuple[int, int] = (0, 0)  # 0-indexed
        self.visited: Set[Tuple[int, int]] = set()
        self.alive = True
        self.game_over = False
        self.won = False
        self._place_hazards()
        self.visited.add((0, 0))

    def _place_hazards(self):
        """Randomly place pits and wumpus, never at start (0,0)."""
        all_cells = [
            (r, c)
            for r in range(self.rows)
            for c in range(self.cols)
            if (r, c) != (0, 0)
        ]
        random.shuffle(all_cells)

        # Place pits: ~20% of cells
        num_pits = max(1, int(self.rows * self.cols * 0.2))
        for i in range(num_pits):
            self.pits.add(all_cells[i])

        # Place wumpus: one cell, not in a pit
        for cell in all_cells[num_pits:]:
            if cell not in self.pits:
                self.wumpus = cell
                break

    def get_adjacent(self, r: int, c: int) -> List[Tuple[int, int]]:
        """Return valid adjacent cells (up, down, left, right)."""
        neighbors = []
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < self.rows and 0 <= nc < self.cols:
                neighbors.append((nr, nc))
        return neighbors

    def get_percepts(self, pos: Tuple[int, int]) -> Dict[str, bool]:
        """Return percepts at a given position."""
        r, c = pos
        adjacent = self.get_adjacent(r, c)
        breeze = any(cell in self.pits for cell in adjacent)
        stench = any(cell == self.wumpus for cell in adjacent)
        return {"breeze": breeze, "stench": stench}

    def move_agent(self, new_pos: Tuple[int, int]) -> Dict:
        """Move agent to new position, return result."""
        if not self.alive or self.game_over:
            return {"success": False, "reason": "Game is over"}

        r, c = new_pos
        if not (0 <= r < self.rows and 0 <= c < self.cols):
            return {"success": False, "reason": "Out of bounds"}

        # Check adjacency
        adj = self.get_adjacent(*self.agent_pos)
        if new_pos not in adj:
            return {"success": False, "reason": "Not adjacent"}

        self.agent_pos = new_pos
        self.visited.add(new_pos)

        # Check death
        if new_pos in self.pits:
            self.alive = False
            self.game_over = True
            return {
                "success": True,
                "died": True,
                "reason": "Fell into a pit!",
                "percepts": self.get_percepts(new_pos),
            }

        if new_pos == self.wumpus:
            self.alive = False
            self.game_over = True
            return {
                "success": True,
                "died": True,
                "reason": "Eaten by the Wumpus!",
                "percepts": self.get_percepts(new_pos),
            }

        percepts = self.get_percepts(new_pos)
        return {"success": True, "died": False, "percepts": percepts}

    def get_state(self) -> Dict:
        """Return full world state."""
        return {
            "rows": self.rows,
            "cols": self.cols,
            "agent_pos": list(self.agent_pos),
            "visited": [list(v) for v in self.visited],
            "alive": self.alive,
            "game_over": self.game_over,
            "percepts": self.get_percepts(self.agent_pos),
            # Reveal hazards only when game over
            "pits": [list(p) for p in self.pits] if self.game_over else [],
            "wumpus": list(self.wumpus) if self.game_over else [],
        }
