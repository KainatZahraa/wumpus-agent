"""
Wumpus World Agent — uses the KB to make safe decisions.
"""

from typing import Tuple, List, Dict, Optional
from world import WumpusWorld
from kb import KnowledgeBase


class WumpusAgent:
    def __init__(self, rows: int, cols: int):
        self.world = WumpusWorld(rows, cols)
        self.kb = KnowledgeBase(rows, cols)
        self.rows = rows
        self.cols = cols
        self.safe_cells: set = {(0, 0)}
        self.inferred_pits: set = set()
        self.inferred_wumpus: set = set()

        # Tell KB about starting cell (no percept danger at 0,0)
        start_percepts = self.world.get_percepts((0, 0))
        adjacent = self.world.get_adjacent(0, 0)
        self.kb.tell((0, 0), start_percepts, adjacent)

    def get_safe_moves(self) -> List[Dict]:
        """
        Return all adjacent unvisited cells with their safety inference results.
        """
        r, c = self.world.agent_pos
        adjacent = self.world.get_adjacent(r, c)
        results = []

        for cell in adjacent:
            cr, cc = cell
            if cell in self.world.visited:
                results.append({
                    "pos": [cr, cc],
                    "visited": True,
                    "is_safe": True,
                    "no_pit": True,
                    "no_wumpus": True,
                    "steps": 0,
                })
                continue

            inference = self.kb.ask_safe(cr, cc)
            if inference["is_safe"]:
                self.safe_cells.add(cell)

            results.append({
                "pos": [cr, cc],
                "visited": False,
                **inference,
            })

        return results

    def move(self, target_row: int, target_col: int) -> Dict:
        """Move agent to target cell and update KB."""
        target = (target_row, target_col)
        result = self.world.move_agent(target)

        if not result["success"]:
            return result

        if not result["died"]:
            # Update KB with new percepts
            percepts = result["percepts"]
            adjacent = self.world.get_adjacent(target_row, target_col)
            self.kb.tell(target, percepts, adjacent)

            # Re-infer safe cells from new knowledge
            self._infer_board()

        return {
            **result,
            "agent_pos": list(self.world.agent_pos),
            "kb_stats": self.kb.get_stats(),
            "safe_cells": [list(s) for s in self.safe_cells],
        }

    def _infer_board(self):
        """Run inference on all unvisited cells to update safe set."""
        for row in range(self.rows):
            for col in range(self.cols):
                cell = (row, col)
                if cell not in self.world.visited and cell not in self.safe_cells:
                    result = self.kb.ask_safe(row, col)
                    if result["is_safe"]:
                        self.safe_cells.add(cell)

    def auto_move(self) -> Dict:
        """
        Agent picks the best safe unvisited adjacent cell automatically.
        Priority: proven safe > unknown > (never unsafe confirmed)
        """
        r, c = self.world.agent_pos
        adjacent = self.world.get_adjacent(r, c)

        # Filter unvisited
        unvisited = [cell for cell in adjacent if cell not in self.world.visited]

        if not unvisited:
            # All adjacent visited — backtrack to a visited cell adjacent to unvisited safe
            for cell in self.world.visited:
                if cell != self.world.agent_pos:
                    cell_adj = self.world.get_adjacent(*cell)
                    if any(
                        ca not in self.world.visited and ca in self.safe_cells
                        for ca in cell_adj
                    ):
                        return self.move(*cell)
            return {"success": False, "reason": "No moves available"}

        # Prefer proven safe
        safe_unvisited = [cell for cell in unvisited if cell in self.safe_cells]
        if safe_unvisited:
            target = safe_unvisited[0]
        else:
            # Take a risk — pick first unknown
            target = unvisited[0]

        return self.move(*target)

    def get_full_state(self) -> Dict:
        """Return complete state for frontend rendering."""
        world_state = self.world.get_state()
        return {
            **world_state,
            "safe_cells": [list(s) for s in self.safe_cells],
            "kb_stats": self.kb.get_stats(),
        }
