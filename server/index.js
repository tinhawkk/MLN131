import { config } from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "../.env"), override: false });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));

// Serve built frontend if it exists
const staticPath = path.resolve(__dirname, "../dist");
fs.access(staticPath)
  .then(() => {
    console.log(
      "Found frontend build at",
      staticPath,
      "— serving static files.",
    );
    app.use(express.static(staticPath));
    app.get("/*", (req, res) => {
      res.sendFile(path.resolve(staticPath, "index.html"));
    });
  })
  .catch(() => {
    console.log("No frontend build found at", staticPath);
  });

// Game state management
const games = new Map();

function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Fetch questions from Google Sheet with support for custom column names
const GOOGLE_SHEET_ID =
  process.env.GOOGLE_SHEET_ID || "14Zid-qM_4-UpjowzlauzrEo6B5buIbU_VC9Pj_7yLuA";
const GOOGLE_SHEET_NAME = process.env.GOOGLE_SHEET_NAME || "Quiz_Sheet";
const GOOGLE_SHEET_BASE_URL = "https://docs.google.com/spreadsheets/d/";
const QUIZ_SHEET_URL = `${GOOGLE_SHEET_BASE_URL}${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${GOOGLE_SHEET_NAME}`;

let allQuestions = [];

async function loadQuestionsFromGoogleSheet() {
  try {
    console.log(`📥 Fetching questions from Google Sheet: ${QUIZ_SHEET_URL}`);
    const response = await fetch(QUIZ_SHEET_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const csvText = await response.text();

    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    // Debug: Log headers found
    if (parseResult.meta && parseResult.meta.fields) {
      console.log("📋 CSV Headers:", parseResult.meta.fields);

      // Check for duplicate headers
      const headerSet = new Set();
      const duplicates = [];
      for (const header of parseResult.meta.fields) {
        if (headerSet.has(header)) {
          duplicates.push(header);
        }
        headerSet.add(header);
      }
      if (duplicates.length > 0) {
        console.error("⚠️ Duplicate headers found:", duplicates);
      }
    }

    allQuestions = [];

    parseResult.data.forEach((row, index) => {
      const getField = (row, ...names) => {
        for (const name of names) {
          const value = row[name];
          if (value !== undefined && value !== null) {
            return typeof value === "string" ? value.trim() : value;
          }
        }
        return "";
      };

      const question = {
        number: getField(row, "Number", "No", "no", "STT") || index + 1,
        id: getField(row, "ID", "Id", "id") || `q${index + 1}`,
        question: getField(row, "Question", "Câu hỏi"),
        options: [
          getField(row, "OptionA", "Option A", "Option_A", "A"),
          getField(row, "OptionB", "Option B", "Option_B", "B"),
          getField(row, "OptionC", "Option C", "Option_C", "C"),
          getField(row, "OptionD", "Option D", "Option_D", "D"),
        ],
        correctAnswer: getField(
          row,
          "CorrectAnswer",
          "Correct Answer",
          "Correct_Answer",
          "Đáp án",
        ),
        explanation: getField(row, "Explanation", "Giải thích"),
      };

      const correctLetter = question.correctAnswer.toUpperCase().trim();
      let correctIndex = -1;
      if (correctLetter === "A" || correctLetter === "OPTIONA")
        correctIndex = 0;
      else if (correctLetter === "B" || correctLetter === "OPTIONB")
        correctIndex = 1;
      else if (correctLetter === "C" || correctLetter === "OPTIONC")
        correctIndex = 2;
      else if (correctLetter === "D" || correctLetter === "OPTIOND")
        correctIndex = 3;

      question.correctAnswerIndex = correctIndex;

      if (question.question && question.options.some((opt) => opt)) {
        allQuestions.push(question);
      }
    });

    console.log(`✅ Loaded ${allQuestions.length} questions from Google Sheet`);

    // Debug: Log first question
    if (allQuestions.length > 0) {
      console.log("📌 Sample question:", {
        number: allQuestions[0].number,
        question: allQuestions[0].question.substring(0, 60) + "...",
        correctAnswerIndex: allQuestions[0].correctAnswerIndex,
        hasExplanation: !!allQuestions[0].explanation,
      });
    }
  } catch (err) {
    console.error(
      "❌ Failed to load questions from Google Sheet:",
      err.message,
    );
    allQuestions = [];
  }
}

loadQuestionsFromGoogleSheet();

const escapeGroupsProgress = new Map();
const escapeGlobalState = {
  activeQuestion: { stageIdx: 0, questionIdx: 0 },
};

// Initialize 5 groups
for (let i = 1; i <= 5; i++) {
  escapeGroupsProgress.set(i.toString(), {
    groupId: i.toString(),
    groupName: `Tổ ${i}`,
    currentStage: 1,
    currentQuestion: 0,
    score: 0,
    finished: false,
  });
}

// Socket.IO event handlers
io.on("connection", (socket) => {
  socket.on("create-game", ({ hostName, gameSettings }) => {
    const gameId = generateGameId();

    const {
      teamCount,
      questionCount,
      timePerQuestion,
      gameMode = "team",
    } = gameSettings;

    const teams =
      gameMode === "team"
        ? Array.from({ length: teamCount }, (_, i) => ({
            name: `Nhóm ${i + 1}`,
            index: i,
            score: 0,
            players: [],
          }))
        : [];

    const game = {
      id: gameId,
      host: socket.id,
      hostName,
      teams,
      players: [],
      phase: "lobby",
      settings: {
        teamCount,
        questionCount,
        timePerQuestion,
        gameMode,
      },
      currentQuestion: 0,
      questions: [],
      answeredPlayers: new Set(),
    };

    games.set(gameId, game);
    socket.join(gameId);
    socket.emit("game-created", { gameId, game });
  });

  socket.on("join-game", ({ gameId, playerName }) => {
    const game = games.get(gameId);

    if (!game) {
      socket.emit("error", { message: "Sai mã game! Phòng không tồn tại." });
      return;
    }

    if (game.phase === "playing") {
      socket.emit("error", {
        message: "Game đang diễn ra, không thể tham gia!",
      });
      return;
    }

    if (game.phase === "finished") {
      socket.emit("error", { message: "Game đã kết thúc!" });
      return;
    }

    const existingPlayer = game.players.find((p) => p.name === playerName);
    if (existingPlayer) {
      socket.emit("error", { message: "Tên này đã được sử dụng trong phòng!" });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
      teamIndex: -1,
      score: 0,
    };

    game.players.push(player);

    socket.join(gameId);
    io.to(gameId).emit("game-updated", game);
  });

  socket.on("delete-game", ({ gameId }) => {
    const game = games.get(gameId);
    if (!game || game.host !== socket.id) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    // Thông báo tất cả thành viên phòng bị xóa
    io.to(gameId).emit("game-deleted", {
      message: "Chủ phòng đã xóa phòng chơi",
    });
    games.delete(gameId);
  });

  socket.on("start-game", ({ gameId }) => {
    const game = games.get(gameId);
    if (!game || game.host !== socket.id) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    if (allQuestions.length === 0) {
      socket.emit("error", {
        message:
          "Chưa load được câu hỏi từ Google Sheet. Vui lòng thử lại sau.",
      });
      return;
    }

    const requestedCount = game.settings.questionCount;
    const availableCount = allQuestions.length;
    const actualCount = Math.min(requestedCount, availableCount);

    const selectedQuestions = shuffleArray([...allQuestions]).slice(
      0,
      actualCount,
    );
    game.questions = selectedQuestions;

    const waitingPlayers = game.players.filter((p) => p.teamIndex === -1);
    const shuffledPlayers = [...waitingPlayers].sort(() => Math.random() - 0.5);

    if (game.settings.gameMode === "team") {
      shuffledPlayers.forEach((player, index) => {
        const teamIndex = index % game.settings.teamCount;
        player.teamIndex = teamIndex;

        if (!game.teams[teamIndex]) {
          return;
        }

        game.teams[teamIndex].players.push(player);
      });
    } else {
      shuffledPlayers.forEach((player) => {
        player.teamIndex = 0;
      });
    }

    game.phase = "playing";
    game.currentQuestion = 0;

    io.to(gameId).emit("game-started", game);
  });

  socket.on("update-score", ({ gameId, teamIndex, points }) => {
    const game = games.get(gameId);
    if (!game) return;

    const player = game.players.find((p) => p.id === socket.id);
    if (player) {
      if (!player.score) player.score = 0;
      player.score += points;
    }

    if (game.settings.gameMode === "team") {
      const team = game.teams[teamIndex];
      if (team) {
        // Chuẩn hóa điểm dựa trên số người trong đội
        // Mỗi người đóng góp bằng nhau cho điểm tổng của đội
        const pointsPerPerson = points / team.players.length;
        team.score += pointsPerPerson;
      }

      io.to(gameId).emit("scores-updated", {
        teams: game.teams.map((t, idx) => ({
          name: t.name,
          index: idx,
          score: Math.round(t.score * 100) / 100, // Làm tròn đến 2 chữ số thập phân
          playerCount: t.players.length,
          players: t.players.map((p) => {
            const actualPlayer = game.players.find((gp) => gp.id === p.id);
            return { name: p.name, score: actualPlayer?.score || 0 };
          }),
        })),
      });
    } else {
      const sortedPlayers = [...game.players]
        .map((p) => ({ name: p.name, score: p.score || 0 }))
        .sort((a, b) => b.score - a.score);

      io.to(gameId).emit("scores-updated", {
        teams: [
          {
            name: "Individual",
            index: 0,
            score: 0,
            playerCount: game.players.length,
            players: sortedPlayers,
          },
        ],
      });
    }
  });

  socket.on("rejoin-as-host", ({ gameId, hostName }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    game.host = socket.id;
    socket.join(gameId);
    socket.emit("rejoined", { game, isHost: true });
  });

  socket.on("rejoin-as-player", ({ gameId, playerName }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit("error", { message: "Game not found" });
      return;
    }

    const player = game.players.find((p) => p.name === playerName);
    if (player) {
      player.id = socket.id;
      socket.join(gameId);
      socket.emit("rejoined", { game, isHost: false });
    } else {
      socket.emit("error", { message: "Player not found in game" });
    }
  });

  socket.on("leave-room", ({ gameId }) => {
    if (gameId) {
      socket.leave(gameId);
    }
  });

  socket.on("next-question", ({ gameId }) => {
    const game = games.get(gameId);
    if (!game) return;

    const player = game.players.find((p) => p.id === socket.id);
    const isHost = game.host === socket.id;
    const hasAnswered = game.answeredPlayers.has(socket.id);

    if (!isHost && (!player || !hasAnswered)) {
      return;
    }

    game.answeredPlayers.clear();
    game.currentQuestion++;

    if (game.currentQuestion >= game.questions.length) {
      game.phase = "finished";

      game.teams.forEach((team) => {
        team.players = team.players.map((playerInfo) => {
          const actualPlayer = game.players.find(
            (p) => p.name === playerInfo.name,
          );
          return {
            name: playerInfo.name,
            score: actualPlayer ? actualPlayer.score : playerInfo.score,
          };
        });
      });

      io.to(gameId).emit("game-finished", game);
    } else {
      io.to(gameId).emit("question-changed", {
        currentQuestion: game.currentQuestion,
        question: game.questions[game.currentQuestion],
      });
    }
  });

  socket.on("submit-answer", ({ gameId, answerIndex, timeTaken }) => {
    const game = games.get(gameId);
    if (!game) return;

    const player = game.players.find((p) => p.id === socket.id);
    if (!player) return;

    if (game.answeredPlayers.has(socket.id)) {
      return;
    }

    const question = game.questions[game.currentQuestion];
    if (!question) {
      return;
    }

    const isCorrect = answerIndex === question.correctAnswerIndex;

    let finalPoints = 0;
    if (isCorrect) {
      const timeLimit = game.settings.timePerQuestion || 30;
      const speedRatio = Math.max(0, (timeLimit - timeTaken) / timeLimit);
      const speedBonus = Math.floor(speedRatio * 50);
      finalPoints = 100 + speedBonus;

      const team = game.teams[player.teamIndex];
      if (team) {
        team.score += finalPoints;
      }

      if (!player.score) player.score = 0;
      player.score += finalPoints;
    }

    game.answeredPlayers.add(socket.id);

    const correctAnswerText = question.options?.[question.correctAnswerIndex];

    socket.emit("answer-result", {
      isCorrect,
      points: finalPoints,
      correctAnswer: correctAnswerText,
    });

    if (game.settings.gameMode === "team") {
      io.to(gameId).emit("scores-updated", {
        teams: game.teams.map((t) => ({
          name: t.name,
          index: t.index,
          score: t.score,
          playerCount: t.players.length,
          players: t.players.map((p) => {
            const actualPlayer = game.players.find((gp) => gp.id === p.id);
            return { name: p.name, score: actualPlayer?.score || 0 };
          }),
        })),
      });
    } else {
      const sortedPlayers = [...game.players]
        .map((p) => ({ name: p.name, score: p.score || 0 }))
        .sort((a, b) => b.score - a.score);

      io.to(gameId).emit("scores-updated", {
        teams: [
          {
            name: "Individual",
            index: 0,
            score: 0,
            playerCount: game.players.length,
            players: sortedPlayers,
          },
        ],
      });
    }
  });

  socket.on(
    "player-finished",
    ({ gameId, playerId, finalScore, teamIndex }) => {
      const game = games.get(gameId);
      if (!game) return;

      const player = game.players.find((p) => p.id === socket.id);
      if (!player) return;

      console.log(
        `[player-finished] Player ${player.name} finished with finalScore: ${finalScore}, current server score: ${player.score || 0}`,
      );

      const serverScore = player.score || 0;
      const clientScore = finalScore || 0;

      player.score = clientScore;

      if (
        game.settings.gameMode === "team" &&
        teamIndex >= 0 &&
        teamIndex < game.teams.length
      ) {
        const scoreDiff = clientScore - serverScore;
        game.teams[teamIndex].score += scoreDiff;
      }

      if (game.settings.gameMode === "team") {
        io.to(gameId).emit("scores-updated", {
          teams: game.teams.map((t, idx) => ({
            name: t.name,
            index: idx,
            score: t.score,
            playerCount: t.players.length,
            players: t.players.map((p) => {
              const actualPlayer = game.players.find((gp) => gp.id === p.id);
              return { name: p.name, score: actualPlayer?.score || 0 };
            }),
          })),
        });
      } else {
        const sortedPlayers = [...game.players]
          .map((p) => ({ name: p.name, score: p.score || 0 }))
          .sort((a, b) => b.score - a.score);

        io.to(gameId).emit("scores-updated", {
          teams: [
            {
              name: "Individual",
              index: 0,
              score: 0,
              playerCount: game.players.length,
              players: sortedPlayers,
            },
          ],
        });
      }
    },
  );

  socket.on("end-game", ({ gameId }) => {
    const game = games.get(gameId);
    if (!game || game.host !== socket.id) return;

    game.phase = "finished";

    const gameData = {
      ...game,
      teams: game.teams.map((t) => ({
        name: t.name,
        index: t.index,
        score: t.score,
        playerCount: t.players.length,
        players: t.players.map((p) => {
          const actualPlayer = game.players.find((pl) => pl.name === p.name);
          return {
            name: p.name,
            score: actualPlayer ? actualPlayer.score : p.score,
          };
        }),
      })),
    };

    io.to(gameId).emit("game-finished", gameData);
    console.log(`Game ${gameId} ended by host`);
  });

  socket.on(
    "submit-escape-answer",
    ({ groupId, username, stageId, questionId, isCorrect }) => {
      const group = escapeGroupsProgress.get(groupId?.toString());
      if (group) {
        if (isCorrect) {
          group.score += 20; // 20 points per correct answer
        }

        console.log(
          `[EscapeRoom] ${group.groupName} (${username}) submitted answer for Stage ${stageId}: ${isCorrect ? "Correct" : "Incorrect"}. Total Score: ${group.score}`,
        );

        // Broadcast the updated progress of ALL groups to EVERYONE
        const allProgress = Array.from(escapeGroupsProgress.values());
        io.emit("group-progress-update", {
          groups: allProgress,
          activeQuestion: escapeGlobalState.activeQuestion,
        });
      }
    },
  );

  socket.on("get-escape-progress", () => {
    const allProgress = Array.from(escapeGroupsProgress.values());
    socket.emit("group-progress-update", {
      groups: allProgress,
      activeQuestion: escapeGlobalState.activeQuestion,
    });
  });

  socket.on("sync-escape-question", ({ stageIdx, questionIdx }) => {
    // Only trust synchronization from the host (logic handled by client to determine who sends this)
    escapeGlobalState.activeQuestion = { stageIdx, questionIdx };

    console.log(
      `[EscapeRoom] Host synced active question to Stage ${stageIdx}, Question ${questionIdx}`,
    );

    io.emit("escape-question-updated", escapeGlobalState.activeQuestion);
  });

  socket.on("reset-escape-game", () => {
    for (let i = 1; i <= 5; i++) {
      escapeGroupsProgress.set(i.toString(), {
        groupId: i.toString(),
        groupName: `Tổ ${i}`,
        currentStage: 1,
        currentQuestion: 0,
        score: 0,
        finished: false,
      });
    }
    escapeGlobalState.activeQuestion = { stageIdx: 0, questionIdx: 0 };
    const allProgress = Array.from(escapeGroupsProgress.values());
    io.emit("group-progress-update", {
      groups: allProgress,
      activeQuestion: escapeGlobalState.activeQuestion,
    });
    io.emit("escape-question-updated", escapeGlobalState.activeQuestion);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
