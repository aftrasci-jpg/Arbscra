import React, { createContext, useContext, useState } from "react";

export type GameRule = "GBOLO";
export type MatchMode = "DUEL" | "ROTATION_ROI";

export interface Player {
  id: string;
  name: string;
  score: number;
  stats?: {
    wins: number;
    matchesPlayed: number;
  };
}

export interface MatchHistoryEntry {
  id: string;
  playerIndex: number; // 0 ou 1, ou arbitraire
  playerName: string;
  word: string;
  score: number;
  coordinates: string; // Ex: H8
  timestamp: string;
  breakdown?: string;
  isContested?: boolean;
}

interface MatchContextType {
  // Configuration State
  mode: MatchMode;
  rule: GameRule;
  rounds: number;
  players: Player[];
  
  // Game Play State
  isMatchStarted: boolean;
  activePlayerIndex: number;
  board: string[][]; // 15x15
  history: MatchHistoryEntry[];
  currentRound: number;
  
  // Rotation ROI specific state (retained/repurposed for compatibility)
  rotationPlayersQueue: string[]; // Liste d'attente des pseudos des challengers
  kingIndex: number; // Index du Roi actuel dans la liste des joueurs actifs
  kingStreak: number;
  historyMatchArchive: Array<{
    id: string;
    mode: MatchMode;
    players: Array<{ name: string; score: number }>;
    winnerName: string;
    timestamp: string;
    kingStreak: number;
    isDraw?: boolean;
  }>;

  // New persistent states for registering multiple players & managing round-robin style pairing selection
  registeredPlayers: string[];
  finishedMatch: { 
    winnerName: string; 
    winnerScore: number; 
    loserName: string; 
    loserScore: number;
    isDraw?: boolean;
    p1Name?: string;
    p2Name?: string;
    p1Score?: number;
    p2Score?: number;
  } | null;
  
  // Actions
  setupDuel: (p1: string, p2: string, rule: GameRule, rounds: number) => void;
  setupRotation: (initialPlayers: string[], autoMode: boolean) => void;
  startMatch: () => void;
  resetMatch: () => void;
  submitWord: (playerIndex: number, word: string, score: number, coords: string, breakdown?: string) => void;
  contestHistoryEntry: (id: string) => void;
  removeHistoryEntry: (id: string) => void;
  editHistoryEntry: (id: string, word: string, score: number, coords: string, breakdown?: string) => void;
  pivotRotationKing: () => void;
  clearHistoryMatchArchive: () => void;
  setRotationPlayersQueue: React.Dispatch<React.SetStateAction<string[]>>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;

  // New Actions
  setRegisteredPlayers: React.Dispatch<React.SetStateAction<string[]>>;
  setFinishedMatch: React.Dispatch<React.SetStateAction<{ 
    winnerName: string; 
    winnerScore: number; 
    loserName: string; 
    loserScore: number;
    isDraw?: boolean;
    p1Name?: string;
    p2Name?: string;
    p1Score?: number;
    p2Score?: number;
  } | null>>;
  startNewMatch: (p1: string, p2: string) => void;
  finishCurrentMatch: () => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

// Helper to parse coordinates like "H8V" or "A15H"
export function parseCoordinates(coordStr: string): { row: number, col: number, direction: "H" | "V" } | null {
  const match = coordStr.toUpperCase().match(/^([A-O])([0-9]{1,2})([HV])?$/);
  if (!match) return null;
  const colLetter = match[1];
  const rowNum = parseInt(match[2]);
  const dir = (match[3] as "H" | "V") || "H";

  const col = colLetter.charCodeAt(0) - 65;
  const row = rowNum - 1;

  if (row < 0 || row >= 15 || col < 0 || col >= 15) return null;
  return { row, col, direction: dir };
}

// Regenerates board array chronologically
export function regenerateBoard(historyList: MatchHistoryEntry[]): string[][] {
  const newBoard = Array(15).fill(null).map(() => Array(15).fill(""));
  // On doit appliquer les coups du plus ancien au plus récent
  const chronological = [...historyList].reverse();
  
  for (const entry of chronological) {
    if (entry.isContested) continue;
    if (entry.word === "PASSE" || entry.word === "PASSER") continue;

    const parsed = parseCoordinates(entry.coordinates);
    if (!parsed) continue;
    
    let { row, col, direction } = parsed;
    const word = entry.word;
    
    for (let i = 0; i < word.length; i++) {
      if (row >= 15 || col >= 15) break;
      newBoard[row][col] = word[i];
      if (direction === "H") {
        col++;
      } else {
        row++;
      }
    }
  }
  return newBoard;
}

export function MatchProvider({ children }: { children: React.ReactNode }) {
  const getSaved = (key: string, defaultValue: any) => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing key " + key, e);
        }
      }
    }
    return defaultValue;
  };

  // Config
  const [mode, setMode] = useState<MatchMode>(() => getSaved("scrabble_arena_mode", "ROTATION_ROI"));
  const [rule, setRule] = useState<GameRule>(() => getSaved("scrabble_arena_rule", "GBOLO"));
  const [rounds, setRounds] = useState<number>(() => getSaved("scrabble_arena_rounds", 1));
  const [players, setPlayers] = useState<Player[]>(() => getSaved("scrabble_arena_players", [
    { id: "1", name: "Joueur Hôte", score: 0 },
    { id: "2", name: "Challenger", score: 0 },
  ]));

  // Playback
  const [isMatchStarted, setIsMatchStarted] = useState<boolean>(() => getSaved("scrabble_arena_is_match_started", false));
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(() => getSaved("scrabble_arena_active_player_index", 0));
  const [board, setBoard] = useState<string[][]>(() => 
    regenerateBoard(getSaved("scrabble_arena_history", []))
  );
  const [history, setHistory] = useState<MatchHistoryEntry[]>(() => getSaved("scrabble_arena_history", []));
  const [currentRound, setCurrentRound] = useState<number>(() => getSaved("scrabble_arena_current_round", 1));

  // Rotation spécifique
  const [rotationPlayersQueue, setRotationPlayersQueue] = useState<string[]>(() => getSaved("scrabble_arena_rotation_players_queue", []));
  const [kingIndex, setKingIndex] = useState<number>(() => getSaved("scrabble_arena_king_index", 0));
  const [kingStreak, setKingStreak] = useState<number>(() => getSaved("scrabble_arena_king_streak", 0));

  // Registered players management pool
  const [registeredPlayers, setRegisteredPlayers] = useState<string[]>(() => getSaved("scrabble_arena_registered_players", [
    "Roi Scrabbleur",
    "Challenger Alpha",
    "Prétendant Beta",
    "Nouvel Invité"
  ]));
  const [finishedMatch, setFinishedMatch] = useState<{ 
    winnerName: string; 
    winnerScore: number; 
    loserName: string; 
    loserScore: number;
    isDraw?: boolean;
    p1Name?: string;
    p2Name?: string;
    p1Score?: number;
    p2Score?: number;
  } | null>(() => getSaved("scrabble_arena_finished_match", null));

  const [historyMatchArchive, setHistoryMatchArchive] = useState<Array<{
    id: string;
    mode: MatchMode;
    players: Array<{ name: string; score: number }>;
    winnerName: string;
    timestamp: string;
    kingStreak: number;
    isDraw?: boolean;
  }>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("scrabble_arena_history_archive");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse history match archive", e);
        }
      }
    }
    return [];
  });

  // Keep localStorage perfectly synced on state changes
  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_mode", JSON.stringify(mode));
  }, [mode]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_rule", JSON.stringify(rule));
  }, [rule]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_rounds", JSON.stringify(rounds));
  }, [rounds]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_players", JSON.stringify(players));
  }, [players]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_is_match_started", JSON.stringify(isMatchStarted));
  }, [isMatchStarted]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_active_player_index", JSON.stringify(activePlayerIndex));
  }, [activePlayerIndex]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_history", JSON.stringify(history));
  }, [history]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_current_round", JSON.stringify(currentRound));
  }, [currentRound]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_rotation_players_queue", JSON.stringify(rotationPlayersQueue));
  }, [rotationPlayersQueue]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_king_index", JSON.stringify(kingIndex));
  }, [kingIndex]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_king_streak", JSON.stringify(kingStreak));
  }, [kingStreak]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_history_archive", JSON.stringify(historyMatchArchive));
  }, [historyMatchArchive]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_registered_players", JSON.stringify(registeredPlayers));
  }, [registeredPlayers]);

  React.useEffect(() => {
    localStorage.setItem("scrabble_arena_finished_match", JSON.stringify(finishedMatch));
  }, [finishedMatch]);

  const finishCurrentMatch = () => {
    if (players.length < 2) return;
    const p1 = players[0];
    const p2 = players[1];

    const isDraw = p1.score === p2.score;

    if (isDraw) {
      // Archive this match to annals / history as a draw
      const newArchiveEntry = {
        id: Math.random().toString(36).substr(2, 9),
        mode,
        players: players.map(p => ({ name: p.name, score: p.score })),
        winnerName: "Match Nul",
        timestamp: new Date().toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        kingStreak: 0,
        isDraw: true
      };
      setHistoryMatchArchive(prev => [newArchiveEntry, ...prev]);

      // Save final match detail for draw handling UI
      setFinishedMatch({
        winnerName: "",
        winnerScore: p1.score,
        loserName: "",
        loserScore: p2.score,
        isDraw: true,
        p1Name: p1.name,
        p2Name: p2.name,
        p1Score: p1.score,
        p2Score: p2.score
      });

      // Unset match started back to choice screen
      setIsMatchStarted(false);
      return;
    }

    // Determine winner based on score
    let winnerIdx = 0;
    let loserIdx = 1;
    if (p2.score > p1.score) {
      winnerIdx = 1;
      loserIdx = 0;
    }

    const winnerName = players[winnerIdx].name;
    const winnerScore = players[winnerIdx].score;
    const loserName = players[loserIdx].name;
    const loserScore = players[loserIdx].score;

    // Calculate consecutive wins (streak) for this winner
    let nextStreak = 1;
    if (historyMatchArchive.length > 0 && historyMatchArchive[0].winnerName === winnerName) {
      nextStreak = (historyMatchArchive[0].kingStreak || 0) + 1;
    } else {
      nextStreak = 1;
    }
    setKingStreak(nextStreak);

    // Archive this match to annals / history
    const newArchiveEntry = {
      id: Math.random().toString(36).substr(2, 9),
      mode,
      players: players.map(p => ({ name: p.name, score: p.score })),
      winnerName,
      timestamp: new Date().toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      kingStreak: nextStreak,
      isDraw: false
    };
    setHistoryMatchArchive(prev => [newArchiveEntry, ...prev]);

    // Save final match detail for selection UI
    setFinishedMatch({
      winnerName,
      winnerScore,
      loserName,
      loserScore,
      isDraw: false
    });

    // Unset match started back to choice screen
    setIsMatchStarted(false);
  };

  const startNewMatch = (p1Name: string, p2Name: string) => {
    setPlayers([
      { id: "1", name: p1Name || "Joueur 1", score: 0 },
      { id: "2", name: p2Name || "Joueur 2", score: 0 }
    ]);
    
    // Clear plate and moves
    setBoard(Array(15).fill(null).map(() => Array(15).fill("")));
    setHistory([]);
    setActivePlayerIndex(0);
    setFinishedMatch(null);
    setIsMatchStarted(true);
  };

  const pivotRotationKing = () => {
    finishCurrentMatch();
  };

  const setupDuel = (p1: string, p2: string, selectedRule: GameRule, selectedRounds: number) => {
    setMode("DUEL");
    setRule(selectedRule);
    setRounds(selectedRounds);
    setPlayers([
      { id: "1", name: p1 || "Joueur 1", score: 0 },
      { id: "2", name: p2 || "Joueur 2", score: 0 },
    ]);
    setIsMatchStarted(false);
  };

  const setupRotation = (initialPlayers: string[], autoMode: boolean) => {
    // Kept for signature compatibility
    setMode("ROTATION_ROI");
    setRegisteredPlayers(initialPlayers);
    setIsMatchStarted(false);
  };

  const startMatch = () => {
    setBoard(Array(15).fill(null).map(() => Array(15).fill("")));
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    setHistory([]);
    setActivePlayerIndex(0);
    setFinishedMatch(null);
    setIsMatchStarted(true);
  };

  const resetMatch = () => {
    setIsMatchStarted(false);
    setHistory([]);
    setBoard(Array(15).fill(null).map(() => Array(15).fill("")));
    setFinishedMatch(null);
  };

  const submitWord = (playerIndex: number, word: string, score: number, coords: string, breakdown?: string) => {
    const entry: MatchHistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      playerIndex,
      playerName: players[playerIndex]?.name || `Joueur ${playerIndex + 1}`,
      word: word.toUpperCase(),
      score,
      coordinates: coords.toUpperCase(),
      timestamp: new Date().toLocaleTimeString(),
      breakdown,
    };

    const nextHistory = [entry, ...history];
    setHistory(nextHistory);
    
    // Regénérer le plateau avec le nouveau mot placé
    setBoard(regenerateBoard(nextHistory));
    
    setPlayers(prev => prev.map((p, idx) => idx === playerIndex ? { ...p, score: p.score + score } : p));
    
    // Alternance des joueurs
    setActivePlayerIndex(prev => (prev === 0 ? 1 : 0));
  };

  const contestHistoryEntry = (id: string) => {
    const nextHistory = history.map(h => {
      if (h.id === id) {
        return {
          ...h,
          score: 0,
          isContested: true,
          breakdown: `Faux mot contesté: ${h.word} à ${h.coordinates} annulé (0 point)`
        };
      }
      return h;
    });
    setHistory(nextHistory);
    setBoard(regenerateBoard(nextHistory));

    // Recalculer les scores
    const player0Score = nextHistory.filter(h => h.playerIndex === 0).reduce((sum, h) => sum + h.score, 0);
    const player1Score = nextHistory.filter(h => h.playerIndex === 1).reduce((sum, h) => sum + h.score, 0);
    setPlayers(prev => prev.map((p, idx) => {
      if (idx === 0) return { ...p, score: player0Score };
      if (idx === 1) return { ...p, score: player1Score };
      return p;
    }));
  };

  const removeHistoryEntry = (id: string) => {
    const nextHistory = history.filter(h => h.id !== id);
    setHistory(nextHistory);
    
    // Recalculer le plateau après retrait d'un mot
    setBoard(regenerateBoard(nextHistory));

    // Recalculer les scores pour éviter toute dérive
    const player0Score = nextHistory.filter(h => h.playerIndex === 0).reduce((sum, h) => sum + h.score, 0);
    const player1Score = nextHistory.filter(h => h.playerIndex === 1).reduce((sum, h) => sum + h.score, 0);
    setPlayers(prev => prev.map((p, idx) => {
      if (idx === 0) return { ...p, score: player0Score };
      if (idx === 1) return { ...p, score: player1Score };
      return p;
    }));
  };

  const editHistoryEntry = (id: string, word: string, score: number, coords: string, breakdown?: string) => {
    const nextHistory = history.map(h => {
      if (h.id === id) {
        return {
          ...h,
          word: word.toUpperCase(),
          score,
          coordinates: coords.toUpperCase(),
          breakdown: breakdown || ""
        };
      }
      return h;
    });
    setHistory(nextHistory);
    setBoard(regenerateBoard(nextHistory));

    // Recalculer les scores après modification
    const player0Score = nextHistory.filter(h => h.playerIndex === 0).reduce((sum, h) => sum + h.score, 0);
    const player1Score = nextHistory.filter(h => h.playerIndex === 1).reduce((sum, h) => sum + h.score, 0);
    setPlayers(prev => prev.map((p, idx) => {
      if (idx === 0) return { ...p, score: player0Score };
      if (idx === 1) return { ...p, score: player1Score };
      return p;
    }));
  };

  const clearHistoryMatchArchive = () => {
    setHistoryMatchArchive([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("scrabble_arena_history_archive");
    }
  };

  return (
    <MatchContext.Provider value={{
      mode,
      rule,
      rounds,
      players,
      isMatchStarted,
      activePlayerIndex,
      board,
      history,
      currentRound,
      rotationPlayersQueue,
      kingIndex,
      kingStreak,
      historyMatchArchive,
      setupDuel,
      setupRotation,
      startMatch,
      resetMatch,
      submitWord,
      contestHistoryEntry,
      removeHistoryEntry,
      editHistoryEntry,
      pivotRotationKing,
      clearHistoryMatchArchive,
      setRotationPlayersQueue,
      setPlayers,
      registeredPlayers,
      finishedMatch,
      setRegisteredPlayers,
      setFinishedMatch,
      startNewMatch,
      finishCurrentMatch
    }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error("useMatch must be used within a MatchProvider");
  }
  return context;
}
