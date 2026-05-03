"""
Knowledge Base with Propositional Logic, CNF Conversion,
and Resolution Refutation for the Wumpus World Agent.
"""

from typing import List, Set, Tuple, FrozenSet, Dict
from itertools import combinations


# --------------------------------------------------------------------------- #
#  Literal helpers                                                             #
# --------------------------------------------------------------------------- #

def neg(lit: str) -> str:
    """Negate a literal. '¬P_1_1' -> 'P_1_1', 'P_1_1' -> '¬P_1_1'."""
    return lit[1:] if lit.startswith("¬") else f"¬{lit}"


def is_positive(lit: str) -> bool:
    return not lit.startswith("¬")


def base_var(lit: str) -> str:
    return lit[1:] if lit.startswith("¬") else lit


# --------------------------------------------------------------------------- #
#  CNF clause type alias:  frozenset of literal strings                        #
# --------------------------------------------------------------------------- #
Clause = FrozenSet[str]


# --------------------------------------------------------------------------- #
#  Knowledge Base                                                              #
# --------------------------------------------------------------------------- #

class KnowledgeBase:
    """
    Propositional Logic KB for the Wumpus World.

    Sentence schema
    ---------------
    Breeze at (r,c)  <=>  OR of P_(r')(c') for each adjacent (r',c')
    Stench at (r,c)  <=>  OR of W_(r')(c') for each adjacent (r',c')

    CNF encoding of  A <=> (B1 v B2 v ... v Bn)
    -----------------------------------------------
      Forward:  ¬A v B1 v B2 v ... v Bn        (one clause)
      Backward: (¬B1 v A), (¬B2 v A), ..., (¬Bn v A)   (n clauses)
    """

    def __init__(self, rows: int, cols: int):
        self.rows = rows
        self.cols = cols
        self.clauses: Set[Clause] = set()
        self.inference_steps = 0

        # Prior: start cell has no pit and no wumpus
        self.clauses.add(frozenset(["¬P_0_0"]))
        self.clauses.add(frozenset(["¬W_0_0"]))

    # ---------------------------------------------------------------------- #
    #  TELL                                                                   #
    # ---------------------------------------------------------------------- #

    def tell(self, pos: Tuple[int, int], percepts: Dict[str, bool],
             adjacent: List[Tuple[int, int]]):
        """
        Add sentences to the KB based on percepts at pos.
        Converts each sentence to CNF clauses immediately.
        """
        r, c = pos

        # --- Breeze biconditional ---
        b_var = f"B_{r}_{c}"
        pit_vars = [f"P_{ar}_{ac}" for ar, ac in adjacent]

        if percepts["breeze"]:
            # TELL  B_(r,c)  is TRUE
            self.clauses.add(frozenset([b_var]))
            # B => (P1 v P2 v ...)  i.e.  ¬B v P1 v P2 v ...
            self.clauses.add(frozenset([f"¬{b_var}"] + pit_vars))
        else:
            # TELL  ¬B_(r,c)
            self.clauses.add(frozenset([f"¬{b_var}"]))
            # ¬B => ¬P1 ^ ¬P2 ^ ...  (each neighbour has no pit)
            for pv in pit_vars:
                self.clauses.add(frozenset([f"¬{pv}"]))

        # Backward: each Pi => B  (i.e.  ¬Pi v B)
        for pv in pit_vars:
            self.clauses.add(frozenset([f"¬{pv}", b_var]))

        # --- Stench biconditional ---
        s_var = f"S_{r}_{c}"
        wumpus_vars = [f"W_{ar}_{ac}" for ar, ac in adjacent]

        if percepts["stench"]:
            self.clauses.add(frozenset([s_var]))
            self.clauses.add(frozenset([f"¬{s_var}"] + wumpus_vars))
        else:
            self.clauses.add(frozenset([f"¬{s_var}"]))
            for wv in wumpus_vars:
                self.clauses.add(frozenset([f"¬{wv}"]))

        for wv in wumpus_vars:
            self.clauses.add(frozenset([f"¬{wv}", s_var]))

        # At most one Wumpus: for every pair of wumpus vars, ¬Wi v ¬Wj
        all_w_vars = [
            f"W_{row}_{col}"
            for row in range(self.rows)
            for col in range(self.cols)
        ]
        for w1, w2 in combinations(all_w_vars, 2):
            self.clauses.add(frozenset([f"¬{w1}", f"¬{w2}"]))

    # ---------------------------------------------------------------------- #
    #  ASK  –  Resolution Refutation                                          #
    # ---------------------------------------------------------------------- #

    def ask_safe(self, r: int, c: int) -> Dict:
        """
        Use Resolution Refutation to check if cell (r,c) is safe.
        Returns dict with is_safe bool and steps taken.
        """
        steps_before = self.inference_steps

        no_pit    = self._resolve_refutation(f"P_{r}_{c}")   # prove ¬P
        no_wumpus = self._resolve_refutation(f"W_{r}_{c}")   # prove ¬W

        steps_taken = self.inference_steps - steps_before
        return {
            "is_safe": no_pit and no_wumpus,
            "no_pit": no_pit,
            "no_wumpus": no_wumpus,
            "steps": steps_taken,
        }

    def _resolve_refutation(self, positive_literal: str) -> bool:
        """
        Prove  ¬positive_literal  by refutation:
          1. Add  {positive_literal}  (negation of what we want to prove)
          2. Resolve until empty clause (contradiction) or fixpoint
        Returns True if contradiction found (meaning original is provably false).
        """
        # Start with KB clauses + negation of goal
        working: Set[Clause] = set(self.clauses)
        working.add(frozenset([positive_literal]))   # assume dangerous

        new: Set[Clause] = set()

        while True:
            clause_list = list(working)
            found_empty = False

            for i in range(len(clause_list)):
                for j in range(i + 1, len(clause_list)):
                    resolvents = self._resolve(clause_list[i], clause_list[j])
                    self.inference_steps += 1
                    for r_clause in resolvents:
                        if len(r_clause) == 0:
                            return True          # contradiction → proved safe
                        new.add(r_clause)

            if new.issubset(working):
                return False                     # fixpoint, cannot prove

            working |= new

    @staticmethod
    def _resolve(ci: Clause, cj: Clause) -> List[Clause]:
        """
        Standard resolution: for each complementary literal pair,
        produce the resolvent clause.
        """
        resolvents = []
        for lit in ci:
            complement = neg(lit)
            if complement in cj:
                resolvent = (ci - {lit}) | (cj - {complement})
                resolvents.append(frozenset(resolvent))
        return resolvents

    # ---------------------------------------------------------------------- #
    #  Diagnostics                                                            #
    # ---------------------------------------------------------------------- #

    def get_stats(self) -> Dict:
        return {
            "num_clauses": len(self.clauses),
            "total_inference_steps": self.inference_steps,
        }
