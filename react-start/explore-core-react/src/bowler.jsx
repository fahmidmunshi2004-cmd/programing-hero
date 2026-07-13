import { useMemo, useState } from "react";

const MAX_PLAYERS = 11;
const DEFAULT_PLAYERS = 5;
const MAX_OVERS = 50;
const DEFAULT_OVERS = 20;

const actionButtons = [
  { label: "Dot Ball", value: 0, tone: "neutral" },
  { label: "1 Run", value: 1, tone: "run" },
  { label: "2 Runs", value: 2, tone: "run" },
  { label: "3 Runs", value: 3, tone: "run" },
  { label: "Four", value: 4, tone: "boundary" },
  { label: "Six", value: 6, tone: "six" },
];

const extraButtons = [
  { label: "Wide +1", kind: "wide", runs: 1, tone: "wide" },
  { label: "Wide +2", kind: "wide", runs: 2, tone: "wide" },
  { label: "Wide +3", kind: "wide", runs: 3, tone: "wide" },
  { label: "Wide +4", kind: "wide", runs: 4, tone: "wide" },
  { label: "No Ball +1", kind: "noball", runs: 1, tone: "noball" },
  { label: "No Ball +2", kind: "noball", runs: 2, tone: "noball" },
  { label: "No Ball +3", kind: "noball", runs: 3, tone: "noball" },
  { label: "No Ball +4", kind: "noball", runs: 4, tone: "noball" },
];

const statColors = {
  runs: "#0f766e",
  wicket: "#e11d48",
  four: "#d97706",
  six: "#16a34a",
  extras: "#0284c7",
};

const createNames = (count, existing = []) =>
  Array.from({ length: count }, (_, index) => existing[index]?.trim() || `Player ${index + 1}`);

const createPlayers = (names) =>
  names.map((name, index) => ({
    id: index + 1,
    name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    dots: 0,
    out: false,
  }));

const createTeam = (teamName, playerNames) => ({
  name: teamName.trim() || "Team",
  players: createPlayers(playerNames),
  currentPlayerIndex: 0,
  runs: 0,
  extras: 0,
  wickets: 0,
  legalBalls: 0,
  four: 0,
  six: 0,
  dotBall: 0,
  wide: 0,
  noBall: 0,
  inningsOver: false,
});

const createMatch = (teams, oversLimit) => ({
  teams,
  activeTeamIndex: 0,
  oversLimit,
  targetRuns: null,
  winnerIndex: null,
  finished: false,
  message: "",
});

const getTotalRuns = (team) => team.runs + team.extras;

const getBallsLimit = (oversLimit) => oversLimit * 6;

const isInningsOver = (team, oversLimit) =>
  team.inningsOver || team.legalBalls >= getBallsLimit(oversLimit) || team.wickets >= team.players.length;

export default function Bowler() {
  const [teamCount] = useState(2);
  const [matchOvers, setMatchOvers] = useState(DEFAULT_OVERS);
  const [teamNames, setTeamNames] = useState(["Team 1", "Team 2"]);
  const [teamSizes, setTeamSizes] = useState([DEFAULT_PLAYERS, DEFAULT_PLAYERS]);
  const [teamPlayers, setTeamPlayers] = useState([
    createNames(DEFAULT_PLAYERS),
    createNames(DEFAULT_PLAYERS),
  ]);
  const [match, setMatch] = useState(() =>
    createMatch([
      createTeam("Team 1", createNames(DEFAULT_PLAYERS)),
      createTeam("Team 2", createNames(DEFAULT_PLAYERS)),
    ], DEFAULT_OVERS)
  );
  const [setupMessage, setSetupMessage] = useState("");

  const activeTeam = match.teams[match.activeTeamIndex];
  const opponentTeam = match.teams[match.activeTeamIndex === 0 ? 1 : 0];
  const totalBalls = activeTeam?.legalBalls ?? 0;
  const over = Math.floor(totalBalls / 6);
  const ball = totalBalls % 6;
  const totalRuns = activeTeam ? getTotalRuns(activeTeam) : 0;
  const runRate = totalBalls === 0 ? 0 : (totalRuns / (totalBalls / 6)).toFixed(2);
  const strikeRate = totalBalls === 0 ? 0 : ((activeTeam?.runs ?? 0) / totalBalls * 100).toFixed(2);
  const boundaryCount = (activeTeam?.four ?? 0) + (activeTeam?.six ?? 0);
  const currentPlayer = activeTeam?.players[activeTeam.currentPlayerIndex] ?? null;
  const currentTarget = match.targetRuns;

  const chartData = useMemo(
    () => [
      { label: "Runs", value: totalRuns, color: statColors.runs },
      { label: "Wkts", value: activeTeam?.wickets ?? 0, color: statColors.wicket },
      { label: "4s", value: activeTeam?.four ?? 0, color: statColors.four },
      { label: "6s", value: activeTeam?.six ?? 0, color: statColors.six },
      { label: "Extras", value: activeTeam?.extras ?? 0, color: statColors.extras },
    ],
    [totalRuns, activeTeam]
  );

  const maxValue = Math.max(...chartData.map((item) => item.value), 1);

  const updateTeamName = (index, value) => {
    setTeamNames((current) => current.map((name, i) => (i === index ? value : name)));
  };

  const updateTeamSize = (teamIndex, value) => {
    const nextSize = Math.max(1, Math.min(MAX_PLAYERS, Number(value) || 1));
    setTeamSizes((current) => current.map((size, index) => (index === teamIndex ? nextSize : size)));
    setTeamPlayers((current) =>
      current.map((players, index) =>
        index === teamIndex ? createNames(nextSize, players) : players
      )
    );
  };

  const updatePlayerName = (teamIndex, playerIndex, value) => {
    setTeamPlayers((current) =>
      current.map((players, index) =>
        index === teamIndex
          ? players.map((player, i) => (i === playerIndex ? value : player))
          : players
      )
    );
  };

  const buildTeams = () =>
    teamNames.map((teamName, teamIndex) =>
      createTeam(teamName, createNames(teamSizes[teamIndex], teamPlayers[teamIndex]))
    );

  const startMatch = () => {
    setMatch(createMatch(buildTeams(), matchOvers));
    setSetupMessage("Match started. First innings will begin with Team 1.");
  };

  const resetMatch = () => {
    setMatch(createMatch(buildTeams(), matchOvers));
  };

  const goToNextInnings = (currentMatch, currentTeamIndex) => {
    if (currentTeamIndex === 0) {
      const firstTeamTotal = getTotalRuns(currentMatch.teams[0]);
      const nextTeams = currentMatch.teams.map((team, index) =>
        index === 1
          ? { ...team, currentPlayerIndex: 0, inningsOver: false }
          : team
      );

      return {
        ...currentMatch,
        teams: nextTeams,
        activeTeamIndex: 1,
        targetRuns: firstTeamTotal + 1,
        message: `${nextTeams[1].name} need ${firstTeamTotal + 1} to win.`,
      };
    }

    const firstTeamTotal = getTotalRuns(currentMatch.teams[0]);
    const secondTeamTotal = getTotalRuns(currentMatch.teams[1]);

    let winnerIndex = null;
    let message = "Match tied.";

    if (secondTeamTotal > firstTeamTotal) {
      winnerIndex = 1;
      message = `Congratulations! ${currentMatch.teams[1].name} won by chasing the target.`;
    } else if (firstTeamTotal > secondTeamTotal) {
      winnerIndex = 0;
      message = `Congratulations! ${currentMatch.teams[0].name} won the match.`;
    } else {
      message = "Match tied. Good game!";
    }

    return {
      ...currentMatch,
      finished: true,
      winnerIndex,
      message,
    };
  };

  const finishIfNeeded = (currentMatch, teamIndex, updatedTeam) => {
    if (currentMatch.finished) {
      return currentMatch;
    }

    if (teamIndex === 1 && currentMatch.targetRuns && getTotalRuns(updatedTeam) >= currentMatch.targetRuns) {
      return {
        ...currentMatch,
        teams: currentMatch.teams,
        finished: true,
        winnerIndex: 1,
        message: `Congratulations! ${currentMatch.teams[1].name} won by chasing the target.`,
      };
    }

    if (isInningsOver(updatedTeam, currentMatch.oversLimit)) {
      return goToNextInnings(currentMatch, teamIndex);
    }

    return currentMatch;
  };

  const updateActiveTeam = (updater) => {
    setMatch((currentMatch) => {
      if (currentMatch.finished) {
        return currentMatch;
      }

      const teamIndex = currentMatch.activeTeamIndex;
      const currentTeam = currentMatch.teams[teamIndex];
      if (!currentTeam) {
        return currentMatch;
      }

      const updatedTeam = updater(currentTeam, currentMatch);
      const teams = currentMatch.teams.map((team, index) => (index === teamIndex ? updatedTeam : team));
      const nextMatch = { ...currentMatch, teams };

      return finishIfNeeded(nextMatch, teamIndex, updatedTeam);
    });
  };

  const addLegalDelivery = (run) => {
    updateActiveTeam((team) => {
      const playerIndex = team.currentPlayerIndex;
      const players = team.players.map((player, index) => {
        if (index !== playerIndex) {
          return player;
        }

        return {
          ...player,
          runs: player.runs + run,
          balls: player.balls + 1,
          fours: player.fours + (run === 4 ? 1 : 0),
          sixes: player.sixes + (run === 6 ? 1 : 0),
          dots: player.dots + (run === 0 ? 1 : 0),
        };
      });

      return {
        ...team,
        players,
        runs: team.runs + run,
        legalBalls: team.legalBalls + 1,
        four: team.four + (run === 4 ? 1 : 0),
        six: team.six + (run === 6 ? 1 : 0),
        dotBall: team.dotBall + (run === 0 ? 1 : 0),
      };
    });
  };

  const addWicket = () => {
    updateActiveTeam((team) => {
      const playerIndex = team.currentPlayerIndex;
      const players = team.players.map((player, index) =>
        index === playerIndex
          ? {
              ...player,
              balls: player.balls + 1,
              out: true,
            }
          : player
      );

      const nextAvailableIndex = players.findIndex(
        (player, index) => index > playerIndex && !player.out
      );

      return {
        ...team,
        players,
        wickets: team.wickets + 1,
        legalBalls: team.legalBalls + 1,
        currentPlayerIndex: nextAvailableIndex === -1 ? playerIndex : nextAvailableIndex,
        inningsOver: nextAvailableIndex === -1 || team.wickets + 1 >= team.players.length,
      };
    });
  };

  const addExtra = (kind, runs = 0) => {
    updateActiveTeam((team) => ({
      ...team,
      extras: team.extras + 1 + runs,
      wide: team.wide + (kind === "wide" ? 1 : 0),
      noBall: team.noBall + (kind === "noball" ? 1 : 0),
    }));
  };

  const ballsLimit = getBallsLimit(match.oversLimit);
  const activeProgress = Math.min((totalBalls / ballsLimit) * 100, 100);

  const styles = {
    wrapper: {
      minHeight: "100vh",
      width: "100%",
      padding: "24px 0 32px",
      background:
        "radial-gradient(circle at top left, rgba(251, 146, 60, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.16), transparent 24%), linear-gradient(135deg, #fffaf4 0%, #eef7ff 48%, #fff7ed 100%)",
      color: "#0f172a",
      boxSizing: "border-box",
      overflowX: "auto",
      overflowY: "hidden",
    },
    shell: {
      width: "min(1440px, calc(100vw - 24px))",
      minWidth: "1240px",
      margin: "0 auto",
      borderRadius: "28px",
      background: "rgba(255, 255, 255, 0.82)",
      border: "1px solid rgba(148, 163, 184, 0.2)",
      boxShadow: "0 30px 90px rgba(148, 163, 184, 0.22)",
      backdropFilter: "blur(18px)",
      overflow: "hidden",
    },
    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      padding: "24px 24px 0",
      flexWrap: "wrap",
    },
    badgeRow: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    badge: {
      padding: "10px 14px",
      borderRadius: "999px",
      background: "rgba(255, 255, 255, 0.9)",
      border: "1px solid rgba(148, 163, 184, 0.22)",
      color: "#0f172a",
      fontSize: "14px",
      fontWeight: 600,
    },
    resetButton: {
      border: "none",
      borderRadius: "999px",
      padding: "12px 16px",
      background: "linear-gradient(135deg, #fb7185, #f59e0b)",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 10px 24px rgba(251, 113, 133, 0.22)",
    },
    header: {
      padding: "16px 24px 8px",
      display: "grid",
      gap: "18px",
    },
    titleBlock: {
      display: "grid",
      gap: "10px",
    },
    eyebrow: {
      textTransform: "uppercase",
      letterSpacing: "0.24em",
      fontSize: "12px",
      color: "#b45309",
      fontWeight: 700,
      margin: 0,
    },
    title: {
      margin: 0,
      fontSize: "clamp(32px, 6vw, 56px)",
      lineHeight: 1,
      color: "#0f172a",
    },
    subtitle: {
      margin: 0,
      maxWidth: "820px",
      fontSize: "15px",
      lineHeight: 1.7,
      color: "#475569",
    },
    mainGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "18px",
      padding: "0 24px 24px",
    },
    card: {
      borderRadius: "24px",
      border: "1px solid rgba(148, 163, 184, 0.18)",
      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.96))",
      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.6)",
    },
    setupCard: {
      padding: "22px",
      display: "grid",
      gap: "18px",
      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.96))",
    },
    sectionHead: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
      alignItems: "center",
    },
    sectionTitle: {
      margin: 0,
      color: "#0f172a",
      fontSize: "20px",
    },
    sectionSub: {
      margin: 0,
      color: "#64748b",
      fontSize: "14px",
    },
    setupColumns: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "14px",
    },
    oversSetup: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
      alignItems: "end",
    },
    setupBlock: {
      borderRadius: "18px",
      padding: "14px",
      background: "rgba(255, 255, 255, 0.92)",
      border: "1px solid rgba(148, 163, 184, 0.18)",
      display: "grid",
      gap: "12px",
    },
    field: {
      display: "grid",
      gap: "8px",
    },
    label: {
      color: "#334155",
      fontSize: "13px",
      fontWeight: 700,
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      borderRadius: "14px",
      border: "1px solid rgba(148, 163, 184, 0.18)",
      background: "#fff",
      color: "#0f172a",
      padding: "12px 14px",
      fontSize: "15px",
      outline: "none",
    },
    smallTag: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "999px",
      padding: "8px 10px",
      background: "rgba(14, 165, 233, 0.12)",
      color: "#075985",
      fontSize: "13px",
      fontWeight: 700,
    },
    nameList: {
      display: "grid",
      gap: "10px",
    },
    nameRow: {
      display: "grid",
      gridTemplateColumns: "68px minmax(0, 1fr)",
      gap: "10px",
      alignItems: "center",
    },
    setupActions: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    },
    primaryButton: {
      border: "none",
      borderRadius: "16px",
      padding: "12px 16px",
      background: "linear-gradient(135deg, #0284c7, #14b8a6)",
      color: "#fff",
      fontWeight: 800,
      cursor: "pointer",
    },
    secondaryButton: {
      border: "1px solid rgba(148, 163, 184, 0.18)",
      borderRadius: "16px",
      padding: "12px 16px",
      background: "rgba(255, 255, 255, 0.9)",
      color: "#0f172a",
      fontWeight: 700,
      cursor: "pointer",
    },
    note: {
      margin: 0,
      color: "#64748b",
      fontSize: "13px",
      lineHeight: 1.6,
    },
    scoreCard: {
      padding: "22px",
      display: "grid",
      gap: "18px",
      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.96))",
    },
    scoreTop: {
      display: "flex",
      alignItems: "end",
      justifyContent: "space-between",
      gap: "16px",
      flexWrap: "wrap",
    },
    scoreText: {
      display: "grid",
      gap: "8px",
    },
    scoreLabel: {
      margin: 0,
      color: "#64748b",
      fontSize: "14px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    scoreValue: {
      margin: 0,
      fontSize: "clamp(44px, 7vw, 72px)",
      lineHeight: 1,
      color: "#0f172a",
      fontWeight: 800,
    },
    overPill: {
      padding: "14px 16px",
      borderRadius: "18px",
      background: "rgba(251, 191, 36, 0.14)",
      border: "1px solid rgba(251, 191, 36, 0.25)",
      color: "#92400e",
      fontWeight: 700,
      minWidth: "130px",
      textAlign: "center",
    },
    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "12px",
    },
    statCard: {
      borderRadius: "18px",
      padding: "14px 16px",
      background: "rgba(255, 255, 255, 0.92)",
      border: "1px solid rgba(148, 163, 184, 0.16)",
      display: "grid",
      gap: "6px",
    },
    statName: {
      margin: 0,
      color: "#64748b",
      fontSize: "13px",
    },
    statValue: {
      margin: 0,
      color: "#0f172a",
      fontSize: "24px",
      fontWeight: 800,
    },
    progressWrap: {
      display: "grid",
      gap: "8px",
    },
    progressBar: {
      height: "10px",
      borderRadius: "999px",
      background: "rgba(226, 232, 240, 0.9)",
      overflow: "hidden",
    },
    progressFill: (width) => ({
      width,
      height: "100%",
      borderRadius: "inherit",
      background: "linear-gradient(90deg, #0ea5e9, #22c55e)",
    }),
    matchBanner: {
      padding: "14px 16px",
      borderRadius: "18px",
      background: "rgba(251, 191, 36, 0.16)",
      border: "1px solid rgba(245, 158, 11, 0.22)",
      color: "#92400e",
      fontWeight: 700,
    },
    graphCard: {
      padding: "22px",
      display: "grid",
      gap: "18px",
      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.96))",
    },
    graphHeader: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    graphTitle: {
      margin: 0,
      fontSize: "18px",
      color: "#0f172a",
    },
    graphNote: {
      margin: 0,
      color: "#64748b",
      fontSize: "13px",
    },
    graph: {
      width: "100%",
      height: "260px",
      display: "block",
      borderRadius: "20px",
      background: "rgba(248, 250, 252, 0.98)",
      border: "1px solid rgba(148, 163, 184, 0.16)",
    },
    actionCard: {
      margin: "0 24px 24px",
      padding: "22px",
      borderRadius: "24px",
      border: "1px solid rgba(148, 163, 184, 0.18)",
      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.96))",
      display: "grid",
      gap: "18px",
    },
    actionGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "12px",
    },
    extraGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "12px",
    },
    actionButton: (tone) => ({
      border: "none",
      borderRadius: "18px",
      padding: "16px 14px",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: 800,
      color: "#fff",
      background:
        tone === "boundary"
          ? "linear-gradient(135deg, #f59e0b, #fb7185)"
          : tone === "six"
          ? "linear-gradient(135deg, #10b981, #14b8a6)"
          : tone === "wide"
          ? "linear-gradient(135deg, #06b6d4, #0ea5e9)"
          : tone === "noball"
          ? "linear-gradient(135deg, #ef4444, #fb7185)"
          : tone === "run"
          ? "linear-gradient(135deg, #0ea5e9, #14b8a6)"
          : "linear-gradient(135deg, #fde68a, #fcd34d)",
      boxShadow: "0 10px 24px rgba(148, 163, 184, 0.18)",
    }),
    footerInfo: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "12px",
    },
    footerStat: {
      padding: "16px",
      borderRadius: "18px",
      background: "rgba(255, 255, 255, 0.92)",
      border: "1px solid rgba(148, 163, 184, 0.16)",
      display: "grid",
      gap: "6px",
    },
    footerLabel: {
      margin: 0,
      color: "#64748b",
      fontSize: "13px",
    },
    footerValue: {
      margin: 0,
      color: "#0f172a",
      fontSize: "18px",
      fontWeight: 800,
    },
    playerBoard: {
      display: "grid",
      gap: "12px",
    },
    playerCard: (active, out) => ({
      borderRadius: "18px",
      padding: "14px 16px",
      background: active
        ? "linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(16, 185, 129, 0.16))"
        : "rgba(255, 255, 255, 0.92)",
      border: active
        ? "1px solid rgba(14, 165, 233, 0.2)"
        : "1px solid rgba(148, 163, 184, 0.16)",
      opacity: out ? 0.65 : 1,
      display: "grid",
      gap: "10px",
    }),
    playerRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    playerName: {
      margin: 0,
      color: "#0f172a",
      fontSize: "16px",
      fontWeight: 800,
    },
    playerMeta: {
      margin: 0,
      color: "#64748b",
      fontSize: "13px",
    },
    playerStats: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "8px",
    },
    playerStatBox: {
      borderRadius: "14px",
      padding: "10px 12px",
      background: "rgba(248, 250, 252, 0.95)",
      display: "grid",
      gap: "4px",
    },
    playerStatLabel: {
      margin: 0,
      color: "#64748b",
      fontSize: "12px",
    },
    playerStatValue: {
      margin: 0,
      color: "#0f172a",
      fontSize: "16px",
      fontWeight: 800,
    },
    playerStatus: {
      padding: "8px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 800,
      background: "rgba(255, 247, 237, 0.95)",
      color: "#92400e",
    },
    finishedBanner: {
      padding: "16px",
      borderRadius: "18px",
      background: "linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(14, 165, 233, 0.18))",
      border: "1px solid rgba(245, 158, 11, 0.25)",
      color: "#0f172a",
      fontWeight: 800,
      lineHeight: 1.6,
    },
    teamSummary: {
      display: "grid",
      gap: "12px",
      marginTop: "8px",
    },
    teamSummaryCard: (active) => ({
      borderRadius: "18px",
      padding: "16px",
      background: active ? "rgba(14, 165, 233, 0.08)" : "rgba(255, 255, 255, 0.92)",
      border: active ? "1px solid rgba(14, 165, 233, 0.2)" : "1px solid rgba(148, 163, 184, 0.16)",
      display: "grid",
      gap: "10px",
    }),
    teamSummaryTop: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    teamSummaryName: {
      margin: 0,
      color: "#0f172a",
      fontSize: "18px",
      fontWeight: 800,
    },
    teamSummaryScore: {
      margin: 0,
      color: "#0f172a",
      fontSize: "20px",
      fontWeight: 900,
    },
    teamSummaryMeta: {
      margin: 0,
      color: "#64748b",
      fontSize: "13px",
    },
    inningsStrip: {
      display: "grid",
      gap: "10px",
    },
    inningsStripCard: {
      borderRadius: "18px",
      padding: "16px",
      background: "rgba(255, 255, 255, 0.92)",
      border: "1px solid rgba(148, 163, 184, 0.16)",
      display: "grid",
      gap: "8px",
    },
    inningsStripTitle: {
      margin: 0,
      color: "#0f172a",
      fontSize: "16px",
      fontWeight: 800,
    },
    inningsStripText: {
      margin: 0,
      color: "#64748b",
      fontSize: "13px",
      lineHeight: 1.6,
    },
  };

  const teamBanner = match.finished
    ? match.message
    : currentTarget && match.activeTeamIndex === 1
    ? `${activeTeam.name} need ${currentTarget - totalRuns} more to win.`
    : match.activeTeamIndex === 0
    ? `${activeTeam.name} are batting first.`
    : "Match in progress.";

  const firstInningsTeam = match.teams[0];
  const secondInningsTeam = match.teams[1];
  const winnerTeam = match.winnerIndex !== null ? match.teams[match.winnerIndex] : null;
  const inningsIntro =
    match.activeTeamIndex === 1 && !match.finished
      ? `${firstInningsTeam?.name ?? "Team 1"} innings complete. Full summary is shown below and ${secondInningsTeam?.name ?? "Team 2"} is now chasing.`
      : match.finished
      ? `Full match summary is ready. ${winnerTeam ? `${winnerTeam.name} are the champions.` : "The match is complete."}`
      : `${activeTeam?.name ?? "Team 1"} are batting now.`;

  return (
    <div style={styles.wrapper}>
      <div style={styles.shell}>
        <div style={styles.topBar}>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>Teams: {teamCount}</span>
            <span style={styles.badge}>Active: {activeTeam?.name ?? "None"}</span>
            <span style={styles.badge}>Over: {over}.{ball}</span>
            <span style={styles.badge}>Balls: {totalBalls}</span>
          </div>
          <button type="button" onClick={resetMatch} style={styles.resetButton}>
            Reset Match
          </button>
        </div>

        <div style={styles.header}>
          <div style={styles.titleBlock}>
            <p style={styles.eyebrow}>Cricket Tracker</p>
            <h1 style={styles.title}>Cricket Score Board</h1>
            <p style={styles.subtitle}>
              Set two teams, enter player names, play the first innings, then the second team
              comes in automatically. At the end, the winner gets a congratulations banner.
            </p>
          </div>
        </div>

        <div style={styles.mainGrid}>
          <section style={{ ...styles.card, ...styles.setupCard }}>
            <div style={styles.sectionHead}>
              <div>
                <h3 style={styles.sectionTitle}>Match Setup</h3>
                <p style={styles.sectionSub}>Configure both teams before starting the match</p>
              </div>
              <div style={styles.badgeRow}>
                <span style={styles.badge}>1 to {MAX_PLAYERS} players</span>
              </div>
            </div>

            <div style={styles.oversSetup}>
              <div style={styles.field}>
                <label style={styles.label} htmlFor="match-overs">
                  Overs to play
                </label>
                <input
                  id="match-overs"
                  type="number"
                  min="1"
                  max={MAX_OVERS}
                  value={matchOvers}
                  onChange={(event) => setMatchOvers(Math.max(1, Math.min(MAX_OVERS, Number(event.target.value) || 1)))}
                  style={styles.input}
                />
              </div>

              <div style={styles.setupBlock}>
                <div style={styles.field}>
                  <label style={styles.label}>Current match length</label>
                  <div style={styles.smallTag}>{matchOvers} overs per innings</div>
                </div>
              </div>
            </div>

            <div style={styles.setupColumns}>
              {[0, 1].map((teamIndex) => (
                <div key={teamIndex} style={styles.setupBlock}>
                  <div style={styles.field}>
                    <label style={styles.label} htmlFor={`team-name-${teamIndex}`}>
                      Team {teamIndex + 1} Name
                    </label>
                    <input
                      id={`team-name-${teamIndex}`}
                      type="text"
                      value={teamNames[teamIndex]}
                      onChange={(event) => updateTeamName(teamIndex, event.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label} htmlFor={`team-size-${teamIndex}`}>
                      Number of players
                    </label>
                    <input
                      id={`team-size-${teamIndex}`}
                      type="number"
                      min="1"
                      max={MAX_PLAYERS}
                      value={teamSizes[teamIndex]}
                      onChange={(event) => updateTeamSize(teamIndex, event.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.nameList}>
                    {teamPlayers[teamIndex].map((name, playerIndex) => (
                      <div key={`${teamIndex}-${playerIndex}`} style={styles.nameRow}>
                        <span style={styles.smallTag}>P{playerIndex + 1}</span>
                        <input
                          type="text"
                          value={name}
                          onChange={(event) =>
                            updatePlayerName(teamIndex, playerIndex, event.target.value)
                          }
                          placeholder={`Player ${playerIndex + 1}`}
                          style={styles.input}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.setupActions}>
              <button type="button" onClick={startMatch} style={styles.primaryButton}>
                Start Match
              </button>
              <button type="button" onClick={() => setSetupMessage("Edit names or players, then start again.")} style={styles.secondaryButton}>
                Edit Team
              </button>
            </div>

            {setupMessage ? <p style={styles.note}>{setupMessage}</p> : null}
            <p style={styles.note}>
              Team 1 bats first. When Team 1 innings ends, Team 2 starts automatically.
            </p>
          </section>

          <section style={{ ...styles.card, ...styles.scoreCard }}>
            <div style={styles.scoreTop}>
              <div style={styles.scoreText}>
                <p style={styles.scoreLabel}>Current Score</p>
                <h2 style={styles.scoreValue}>
                  {totalRuns}/{activeTeam?.wickets ?? 0}
                </h2>
              </div>
              <div style={styles.overPill}>
                Overs <br />
                {over}.{ball}
              </div>
            </div>

            <div style={styles.statGrid}>
              <div style={styles.statCard}>
                <p style={styles.statName}>Runs</p>
                <p style={styles.statValue}>{totalRuns}</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statName}>Wickets</p>
                <p style={styles.statValue}>{activeTeam?.wickets ?? 0}</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statName}>Run Rate</p>
                <p style={styles.statValue}>{runRate}</p>
              </div>
              <div style={styles.statCard}>
                <p style={styles.statName}>Strike Rate</p>
                <p style={styles.statValue}>{strikeRate}</p>
              </div>
            </div>

            <div style={styles.progressWrap}>
              <div style={styles.chartMeta}>
                <span>Current innings progress</span>
                <span>{Math.min(Math.round(activeProgress), 100)}%</span>
              </div>
              <div style={styles.progressBar}>
                <div style={styles.progressFill(`${activeProgress}%`)} />
              </div>
            </div>

            <div style={styles.matchBanner}>{teamBanner}</div>
          </section>
        </div>

        <div style={styles.mainGrid}>
          <section style={{ ...styles.card, ...styles.graphCard }}>
            <div style={styles.graphHeader}>
              <div>
                <h3 style={styles.graphTitle}>Performance Graph</h3>
                <p style={styles.graphNote}>Live comparison of score events</p>
              </div>
              <p style={styles.graphNote}>Total balls: {totalBalls}</p>
            </div>

            <svg
              viewBox="0 0 100 220"
              preserveAspectRatio="none"
              style={styles.graph}
              aria-label="Scoreboard graph"
              role="img"
            >
              <defs>
                <linearGradient id="gridGlow" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="100" height="220" fill="url(#gridGlow)" opacity="0.15" />
              {chartData.map((item, index) => {
                const barWidth = 12;
                const gap = 6;
                const totalWidth = chartData.length * barWidth + (chartData.length - 1) * gap;
                const startX = (100 - totalWidth) / 2;
                const x = startX + index * (barWidth + gap);
                const height = (item.value / maxValue) * 150;
                const y = 180 - height;

                return (
                  <g key={item.label}>
                    <rect x={x} y={y} width={barWidth} height={height} rx="4" fill={item.color} />
                    <text x={x + barWidth / 2} y="202" textAnchor="middle" fill="#cbd5e1" fontSize="7">
                      {item.label}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={Math.max(y - 6, 12)}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="7"
                      fontWeight="700"
                    >
                      {item.value}
                    </text>
                  </g>
                );
              })}
            </svg>
          </section>

          <section style={styles.card}>
            <div style={styles.actionCard}>
              <div style={styles.sectionHead}>
                <div>
                  <h3 style={styles.sectionTitle}>Quick Actions</h3>
                  <p style={styles.sectionSub}>Tap a button to update the live scoreboard</p>
                </div>
                <div style={styles.badgeRow}>
                  <span style={styles.badge}>4s: {activeTeam?.four ?? 0}</span>
                  <span style={styles.badge}>6s: {activeTeam?.six ?? 0}</span>
                  <span style={styles.badge}>Dots: {activeTeam?.dotBall ?? 0}</span>
                  <span style={styles.badge}>Extras: {activeTeam?.extras ?? 0}</span>
                </div>
              </div>

              <div style={styles.actionGrid}>
                {actionButtons.map((button) => (
                  <button
                    key={button.label}
                    type="button"
                    onClick={() => addLegalDelivery(button.value)}
                    style={styles.actionButton(button.tone)}
                    disabled={match.finished}
                  >
                    {button.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addWicket}
                  style={styles.actionButton("neutral")}
                  disabled={match.finished}
                >
                  Wicket
                </button>
                <button
                  type="button"
                  onClick={() => addExtra("wide")}
                  style={styles.actionButton("wide")}
                  disabled={match.finished}
                >
                  Wide
                </button>
                <button
                  type="button"
                  onClick={() => addExtra("noball")}
                  style={styles.actionButton("noball")}
                  disabled={match.finished}
                >
                  No Ball
                </button>
              </div>

              <div style={styles.sectionHead}>
                <div>
                  <h3 style={styles.sectionTitle}>Wide / No Ball Runs</h3>
                  <p style={styles.sectionSub}>These do not count as legal balls</p>
                </div>
              </div>

              <div style={styles.extraGrid}>
                {extraButtons.map((button) => (
                  <button
                    key={button.label}
                    type="button"
                    onClick={() => addExtra(button.kind, button.runs)}
                    style={styles.actionButton(button.tone)}
                    disabled={match.finished}
                  >
                    {button.label}
                  </button>
                ))}
              </div>

              <div style={styles.footerInfo}>
                <div style={styles.footerStat}>
                  <p style={styles.footerLabel}>Total Balls</p>
                  <p style={styles.footerValue}>{totalBalls}</p>
                </div>
                <div style={styles.footerStat}>
                  <p style={styles.footerLabel}>Boundaries</p>
                  <p style={styles.footerValue}>{boundaryCount}</p>
                </div>
                <div style={styles.footerStat}>
                  <p style={styles.footerLabel}>Wide / No Ball</p>
                  <p style={styles.footerValue}>
                    {activeTeam?.wide ?? 0} / {activeTeam?.noBall ?? 0}
                  </p>
                </div>
                <div style={styles.footerStat}>
                  <p style={styles.footerLabel}>Target</p>
                  <p style={styles.footerValue}>{currentTarget ?? "-"}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section style={styles.actionCard}>
          <div style={styles.sectionHead}>
            <div>
              <h3 style={styles.sectionTitle}>Team Scorecards</h3>
              <p style={styles.sectionSub}>First innings finishes, then second innings starts automatically</p>
            </div>
            <div style={styles.badgeRow}>
              <span style={styles.badge}>Active: {activeTeam?.name ?? "None"}</span>
              <span style={styles.badge}>Opponent: {opponentTeam?.name ?? "None"}</span>
            </div>
          </div>

          {match.finished ? <div style={styles.finishedBanner}>{match.message}</div> : null}

          <div style={styles.inningsStrip}>
            <div style={styles.inningsStripCard}>
              <p style={styles.inningsStripTitle}>{inningsIntro}</p>
              <p style={styles.inningsStripText}>
                Overs to play: {match.oversLimit} | Legal balls per innings: {getBallsLimit(match.oversLimit)} | First team target: {match.targetRuns ?? "not set yet"}
              </p>
            </div>

            <div style={styles.inningsStripCard}>
              <p style={styles.inningsStripTitle}>Innings 1 summary</p>
              <p style={styles.inningsStripText}>
                {firstInningsTeam?.name ?? "Team 1"} scored {getTotalRuns(firstInningsTeam ?? { runs: 0, extras: 0 })}/{firstInningsTeam?.wickets ?? 0} in {Math.floor((firstInningsTeam?.legalBalls ?? 0) / 6)}.{(firstInningsTeam?.legalBalls ?? 0) % 6} overs.
                Extras {firstInningsTeam?.extras ?? 0}, 4s {firstInningsTeam?.four ?? 0}, 6s {firstInningsTeam?.six ?? 0}.
              </p>
            </div>

            <div style={styles.inningsStripCard}>
              <p style={styles.inningsStripTitle}>Innings 2 summary</p>
              <p style={styles.inningsStripText}>
                {secondInningsTeam?.name ?? "Team 2"} score {getTotalRuns(secondInningsTeam ?? { runs: 0, extras: 0 })}/{secondInningsTeam?.wickets ?? 0}.
                {match.targetRuns ? ` Target ${match.targetRuns}.` : " Target will appear after innings 1."}
                {match.finished ? ` ${match.message}` : " Second innings is live until the chase is completed."}
              </p>
            </div>
          </div>

          <div style={styles.teamSummary}>
            {match.teams.map((team, index) => {
              const active = index === match.activeTeamIndex && !match.finished;
              return (
                <div key={team.name + index} style={styles.teamSummaryCard(active)}>
                  <div style={styles.teamSummaryTop}>
                    <div>
                      <p style={styles.teamSummaryName}>{team.name}</p>
                      <p style={styles.teamSummaryMeta}>
                        {index === 0 ? "First innings" : "Second innings"}
                        {match.targetRuns && index === 1 ? ` - target ${match.targetRuns}` : ""}
                      </p>
                    </div>
                    <p style={styles.teamSummaryScore}>
                      {getTotalRuns(team)}/{team.wickets}
                    </p>
                  </div>

                  <div style={styles.footerInfo}>
                    <div style={styles.footerStat}>
                      <p style={styles.footerLabel}>Overs</p>
                      <p style={styles.footerValue}>
                        {Math.floor(team.legalBalls / 6)}.{team.legalBalls % 6}
                      </p>
                    </div>
                    <div style={styles.footerStat}>
                      <p style={styles.footerLabel}>Run Rate</p>
                      <p style={styles.footerValue}>
                        {team.legalBalls === 0
                          ? "0.00"
                          : ((getTotalRuns(team) / (team.legalBalls / 6))).toFixed(2)}
                      </p>
                    </div>
                    <div style={styles.footerStat}>
                      <p style={styles.footerLabel}>Extras</p>
                      <p style={styles.footerValue}>{team.extras}</p>
                    </div>
                    <div style={styles.footerStat}>
                      <p style={styles.footerLabel}>Balls Left</p>
                      <p style={styles.footerValue}>
                        {Math.max(getBallsLimit(match.oversLimit) - team.legalBalls, 0)}
                      </p>
                    </div>
                  </div>

                  <div style={styles.playerBoard}>
                    {team.players.map((player, playerIndex) => {
                      const isActivePlayer =
                        active && playerIndex === team.currentPlayerIndex && !player.out;
                      return (
                        <div key={player.id} style={styles.playerCard(isActivePlayer, player.out)}>
                          <div style={styles.playerRow}>
                            <div>
                              <p style={styles.playerName}>{player.name}</p>
                              <p style={styles.playerMeta}>
                                Player {playerIndex + 1}
                                {isActivePlayer ? " - batting now" : player.out ? " - out" : ""}
                              </p>
                            </div>
                            <span style={styles.playerStatus}>
                              {player.out ? "Out" : isActivePlayer ? "On Strike" : "Waiting"}
                            </span>
                          </div>

                          <div style={styles.playerStats}>
                            <div style={styles.playerStatBox}>
                              <p style={styles.playerStatLabel}>Runs</p>
                              <p style={styles.playerStatValue}>{player.runs}</p>
                            </div>
                            <div style={styles.playerStatBox}>
                              <p style={styles.playerStatLabel}>Balls</p>
                              <p style={styles.playerStatValue}>{player.balls}</p>
                            </div>
                            <div style={styles.playerStatBox}>
                              <p style={styles.playerStatLabel}>4s / 6s</p>
                              <p style={styles.playerStatValue}>
                                {player.fours} / {player.sixes}
                              </p>
                            </div>
                            <div style={styles.playerStatBox}>
                              <p style={styles.playerStatLabel}>Dots</p>
                              <p style={styles.playerStatValue}>{player.dots}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
