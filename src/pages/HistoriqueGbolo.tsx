import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useMatch } from "../context/MatchContext";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Calendar, Flame, Users, Shield, TrendingUp, BarChart3, Search, Trash2, Award } from "lucide-react";

export default function HistoriqueGbolo() {
  const { theme } = useTheme();
  const { historyMatchArchive, clearHistoryMatchArchive } = useMatch();
  const [searchTerm, setSearchTerm] = useState("");

  const handleClear = () => {
    if (confirm("Voulez-vous vraiment vider l'historique de tous les affrontements ? Cette opération effacera définitivement toutes les statistiques enregistrées.")) {
      clearHistoryMatchArchive();
    }
  };

  // 1. Math Statistics Calculations
  const totalMatches = historyMatchArchive.length;

  // Player Stats accumulator
  interface PlayerStats {
    name: string;
    wins: number;
    played: number;
    totalScore: number;
    maxStreak: number;
  }
  const playerStatsMap: Record<string, PlayerStats> = {};

  historyMatchArchive.forEach(match => {
    match.players.forEach(p => {
      if (!playerStatsMap[p.name]) {
        playerStatsMap[p.name] = { name: p.name, wins: 0, played: 0, totalScore: 0, maxStreak: 0 };
      }
      playerStatsMap[p.name].played += 1;
      playerStatsMap[p.name].totalScore += p.score;
    });

    const winner = match.winnerName;
    if (winner) {
      if (!playerStatsMap[winner]) {
        playerStatsMap[winner] = { name: winner, wins: 0, played: 0, totalScore: 0, maxStreak: 0 };
      }
      playerStatsMap[winner].wins += 1;
      if (match.kingStreak > playerStatsMap[winner].maxStreak) {
        playerStatsMap[winner].maxStreak = match.kingStreak;
      }
    }
  });

  const playerStatsList = Object.values(playerStatsMap).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins; // Primary sorting: wins
    return b.played - a.played; // Secondary: matches played
  });

  // Global Highest Score and King Streak
  let absoluteHighestScore = 0;
  let absoluteHighestScoreHolder = "N/A";
  let maxKingStreak = 0;
  let maxKingStreakHolder = "N/A";

  historyMatchArchive.forEach(match => {
    match.players.forEach(p => {
      if (p.score > absoluteHighestScore) {
        absoluteHighestScore = p.score;
        absoluteHighestScoreHolder = p.name;
      }
    });
    if (match.kingStreak > maxKingStreak) {
      maxKingStreak = match.kingStreak;
      maxKingStreakHolder = match.winnerName;
    }
  });

  // Filter match archives by search query
  const filteredMatches = historyMatchArchive.filter(match => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      match.winnerName.toLowerCase().includes(term) ||
      match.players.some(p => p.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header section */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className={`p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              theme === "dark" 
                ? "border-slate-800 text-slate-300 hover:bg-slate-900 bg-slate-950" 
                : "border-slate-200 text-slate-700 hover:bg-slate-100 bg-white shadow-xs"
            }`}
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight truncate">Historique Gbôlô 📊</h2>
            <p className="text-xs text-slate-500 font-sans truncate">
              Statistiques globales, performances de l'arène et classement des Roitelets.
            </p>
          </div>
        </div>

        {totalMatches > 0 && (
          <button
            onClick={handleClear}
            className="px-3 py-2 text-xs font-semibold rounded-xl text-red-500 hover:bg-red-500/10 border border-red-500/10 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Effacer Tout</span>
          </button>
        )}
      </div>

      {totalMatches > 0 ? (
        <div className="space-y-6">
          {/* Global Stats Widgets Bento-grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
              theme === "dark" ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-150 shadow-xs"
            }`}>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Défis Joués</span>
                <span className="text-lg font-black font-display text-amber-500">{totalMatches}</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
              theme === "dark" ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-150 shadow-xs"
            }`}>
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                <Flame className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Série Max (Roi)</span>
                <span className="text-sm font-bold font-display text-orange-400 block truncate" title={`${maxKingStreakHolder}: ${maxKingStreak} victoires`}>
                  {maxKingStreak} ({maxKingStreakHolder})
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
              theme === "dark" ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-150 shadow-xs"
            }`}>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Record Score</span>
                <span className="text-sm font-bold font-display text-emerald-400 block truncate" title={`${absoluteHighestScoreHolder}: ${absoluteHighestScore} pts`}>
                  {absoluteHighestScore} ({absoluteHighestScoreHolder})
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
              theme === "dark" ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-150 shadow-xs"
            }`}>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Participants</span>
                <span className="text-lg font-black font-display text-blue-500">{playerStatsList.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Box: Leaderboard / Ranking Section (7 Cols) */}
            <div className={`p-5 rounded-2xl border space-y-4 lg:col-span-7 ${
              theme === "dark" ? "bg-slate-900/80 border-slate-850" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-500/10">
                <BarChart3 className="h-4.5 w-4.5 text-amber-500" />
                <h3 className="font-bold font-display text-sm tracking-tight">Classement de l'Arène Gbôlô</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-500/10 text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                      <th className="py-2.5 px-2">Pos</th>
                      <th className="py-2.5 px-2">Pseudo</th>
                      <th className="py-2.5 px-2 text-center">Victoires</th>
                      <th className="py-2.5 px-2 text-center">Joués</th>
                      <th className="py-2.5 px-2 text-center">Taux %</th>
                      <th className="py-2.5 px-2 text-right">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-500/5 text-xs">
                    {playerStatsList.map((stat, index) => {
                      const winRate = stat.played > 0 ? Math.round((stat.wins / stat.played) * 100) : 0;
                      const averageScore = stat.played > 0 ? Math.round(stat.totalScore / stat.played) : 0;
                      
                      return (
                        <tr 
                          key={stat.name} 
                          className={`hover:bg-slate-500/[0.02] transition-colors ${
                            index === 0 ? "text-amber-500 font-semibold" : ""
                          }`}
                        >
                          <td className="py-3 px-2 font-mono font-bold flex items-center gap-1">
                            {index === 0 ? "👑" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`}
                          </td>
                          <td className="py-3 px-2 font-semibold truncate max-w-[120px]" title={stat.name}>
                            {stat.name}
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-sm">
                            {stat.wins}
                          </td>
                          <td className="py-3 px-2 text-center text-slate-500 font-mono">
                            {stat.played}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                              winRate >= 60 
                                ? "bg-emerald-500/10 text-emerald-500" 
                                : winRate >= 40 
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-slate-500/10 text-slate-400"
                            }`}>
                              {winRate}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-slate-500">
                            {averageScore} <span className="text-[10px]">pts</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Box: Match logs with search (5 Cols) */}
            <div className={`p-5 rounded-2xl border space-y-4 lg:col-span-5 flex flex-col ${
              theme === "dark" ? "bg-slate-900/80 border-slate-850" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="flex items-center gap-2 pb-1 justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-orange-500" />
                  <h3 className="font-bold font-display text-sm tracking-tight">Journal des chocs</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{filteredMatches.length} affichés</span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Chercher joueur..."
                  className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    theme === "dark"
                      ? "bg-slate-950 border-slate-805 text-white placeholder-slate-650"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                  }`}
                />
              </div>

              {/* Match list */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 flex-1">
                {filteredMatches.length > 0 ? (
                  filteredMatches.map((arch) => {
                    const p1 = arch.players[0];
                    const p2 = arch.players[1];
                    const isP1Winner = arch.winnerName === p1?.name;
                    const opponent = isP1Winner ? p2 : p1;
                    const winner = isP1Winner ? p1 : p2;

                    return (
                      <div
                        key={arch.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                          theme === "dark"
                            ? "bg-slate-950/60 border-slate-850 hover:border-slate-800"
                            : "bg-slate-50 border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                          {arch.isDraw ? (
                            <span className="flex items-center gap-0.5 text-blue-500 font-bold">
                              🤝 Match de parité
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-orange-500 font-bold">
                              <Flame className="h-2.5 w-2.5 fill-current" />
                              Série: {arch.kingStreak}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" />
                            {arch.timestamp}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2.5">
                          <div className="min-w-0">
                            {arch.isDraw ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-xs text-blue-500 truncate bg-blue-500/5 px-1.5 py-0.2 rounded border border-blue-500/10">
                                  {p1?.name}
                                </span>
                                <span className="text-[9px] text-slate-400">vs</span>
                                <span className="font-bold text-xs text-blue-500 truncate bg-blue-500/5 px-1.5 py-0.2 rounded border border-blue-500/10">
                                  {p2?.name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-bold text-xs text-emerald-500 truncate bg-emerald-500/5 px-1.5 py-0.2 rounded border border-emerald-500/10">
                                  {winner?.name} ⭐
                                </span>
                                <span className="text-[9px] text-slate-400">vs</span>
                                <span className="text-[11px] text-slate-500 font-medium truncate bg-slate-500/5 px-1.5 py-0.2 rounded border border-slate-500/10">
                                  {opponent?.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-black font-mono text-slate-700 dark:text-slate-300">
                              {arch.isDraw ? (
                                <>{p1?.score} - {p2?.score}</>
                              ) : (
                                <>{winner?.score} - {opponent?.score}</>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-[11px] text-slate-500 font-mono py-6">
                    Aucun match ne correspond.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`text-center py-16 rounded-2xl border space-y-4 max-w-xl mx-auto ${
          theme === "dark" ? "bg-slate-900/40 border-slate-850" : "bg-white border-slate-150 shadow-sm"
        }`}>
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-400 animate-pulse">
            <Shield className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold font-display text-sm">Arène Vierge 🏟️</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto px-4">
              L'historique des affrontements Scrabble Gbôlô est vide. Finissez un match de rotation dans la console d'arbitrage pour que les statistiques de vos joueurs apparaissent.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/setup-rotation"
              className="py-2.5 px-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl text-xs font-display hover:scale-[1.01] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-orange-500/10"
            >
              <Trophy className="h-4 w-4" />
              Lancer un match maintenant
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
