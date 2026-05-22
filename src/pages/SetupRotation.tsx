import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useMatch } from "../context/MatchContext";
import { ArrowLeft, Play, Plus, X, Users, Shuffle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function SetupRotation() {
  const { theme } = useTheme();
  const { registeredPlayers, setRegisteredPlayers } = useMatch();
  const navigate = useNavigate();

  // Local state for add input
  const [newPlayerName, setNewPlayerName] = useState("");

  // Add a player to the registered pool
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    if (registeredPlayers.includes(trimmed)) {
      alert("Ce pseudo de joueur existe déjà dans la liste !");
      return;
    }
    setRegisteredPlayers([...registeredPlayers, trimmed]);
    setNewPlayerName("");
  };

  // Remove player from list
  const handleRemovePlayer = (nameToRemove: string) => {
    setRegisteredPlayers(registeredPlayers.filter(p => p !== nameToRemove));
  };

  // Shuffle players list
  const handleShuffle = () => {
    const listCopy = [...registeredPlayers];
    for (let i = listCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [listCopy[i], listCopy[j]] = [listCopy[j], listCopy[i]];
    }
    setRegisteredPlayers(listCopy);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in mb-8 px-1 sm:px-0" id="setup-rotation-page">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            id="back-home-button"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              theme === "dark" 
                ? "border-slate-800 text-slate-300 hover:bg-slate-900 bg-slate-950" 
                : "border-slate-200 text-slate-700 hover:bg-slate-100 bg-white shadow-sm"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight truncate">Configuration des Participants 👑</h2>
            <p className={`text-[11px] sm:text-xs leading-tight sm:leading-inherit ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              Gérez la liste globale des joueurs enregistrés pour vos matchs.
            </p>
          </div>
        </div>
        <div className="flex items-center self-start sm:self-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 border border-orange-500/20">
          <Users className="h-3 w-3" />
          Arène Gbôlô
        </div>
      </div>

      {/* Main Players pool configuration card */}
      <div className={`p-4 sm:p-6 rounded-2xl border space-y-5 sm:space-y-6 transition-all ${
        theme === "dark" 
          ? "bg-slate-900/80 border-slate-800 shadow-xl shadow-slate-950/20" 
          : "bg-white border-slate-200 shadow-lg shadow-slate-250/20"
      }`} id="players-config-card">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-500/10 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Users className="h-4 sm:h-5 w-4 sm:w-5 text-orange-500 shrink-0" />
            <h3 className="font-semibold font-display text-xs sm:text-sm truncate">Joueurs inscrits ({registeredPlayers.length})</h3>
          </div>
          {registeredPlayers.length > 1 && (
            <button
              type="button"
              id="shuffle-players-button"
              onClick={handleShuffle}
              className={`p-1 px-2 rounded-lg border flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-semibold transition-all cursor-pointer shrink-0 ${
                theme === "dark" 
                  ? "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
              title="Mélanger l'ordre d'arrivée des joueurs"
            >
              <Shuffle className="h-3 w-3" /> <span className="hidden xs:inline">Mélanger l'ordre</span>
            </button>
          )}
        </div>

        {/* Add a player mini-form */}
        <form onSubmit={handleAddPlayer} className="flex gap-2" id="add-player-form">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Ex: Maître Des Mots"
            className={`flex-1 p-2 sm:p-2.5 rounded-xl border font-sans text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${
              theme === "dark"
                ? "bg-slate-950 border-slate-800 text-white placeholder-slate-650"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-404"
            }`}
          />
          <button
            type="submit"
            id="register-player-submit"
            className="py-2 sm:py-2.5 px-3.5 sm:px-4 bg-orange-500 text-white font-medium rounded-xl text-[11px] sm:text-xs font-display flex items-center gap-1 hover:bg-orange-600 active:scale-95 transition-all cursor-pointer shadow-md shadow-orange-500/10 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Inscrire</span>
          </button>
        </form>

        {/* Render Players stream */}
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1" id="players-list-container">
          {registeredPlayers.length > 0 ? (
            registeredPlayers.map((player, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all gap-2 ${
                  theme === "dark" 
                    ? "bg-slate-950 border-slate-850 hover:bg-slate-900/30" 
                    : "bg-slate-50 border-slate-100 hover:bg-slate-100/50"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="font-mono text-[10px] sm:text-xs text-slate-500 w-4 shrink-0">#{idx + 1}</span>
                  <span className="font-semibold text-xs sm:text-sm font-display truncate flex-1 block" title={player}>{player}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemovePlayer(player)}
                  className="p-1 rounded-lg transition-colors cursor-pointer hover:bg-red-500/10 text-slate-500 hover:text-red-500 shrink-0"
                  title="Retirer ce joueur de la liste"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[11px] sm:text-xs text-slate-500 font-mono">
              Aucun joueur enregistré. Veuillez inscrire au moins deux joueurs ci-dessus.
            </div>
          )}
        </div>
      </div>

      {/* Button to match preparation */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          id="go-to-match-button"
          onClick={() => {
            if (registeredPlayers.length < 2) {
              alert("Il faut au moins 2 joueurs inscrits pour pouvoir démarrer un match !");
              return;
            }
            navigate("/match");
          }}
          className="w-full sm:w-auto py-3 px-6 font-semibold font-display text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-[1.01] text-white shadow-md shadow-orange-500/20 font-bold"
        >
          <Play className="h-4 w-4" />
          Aller au Match 🎮
        </button>
      </div>
    </div>
  );
}
