import { config } from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { STORY_STAGES, normalizeAnswerText } from "./gameContent";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, ".env"), override: false });
const PORT = process.env.PORT || 3000;

type Team = {
  id: string; // unique team name
  socketId: string;
  score: number;
  joinedAt: number;
};

type PlayerState = {
  score: number;
  team: string;
};

type GameState = {
  step: number;
  teams: Record<string, Team>;
  answers: Record<number, Record<number, Record<string, any>>>;
  stepStartTime: number;
  activeQuestion: number | null;
  activeQuestionIndex: number | null;
  showConcept: boolean;
  players: Record<string, PlayerState>;
};

const state: GameState = {
  step: 0,
  teams: {},
  answers: {},
  stepStartTime: Date.now(),
  activeQuestion: null,
  activeQuestionIndex: null,
  showConcept: false,
  players: {},
};

// Game state management for multi-game
const games = new Map();
function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function shuffleArray(array: any[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getStage(step: number) {
  return STORY_STAGES.find((stage) => stage.step === step) || null;
}

function getQuestion(step: number, questionIndex: number) {
  return getStage(step)?.questions[questionIndex] || null;
}

function ensureStepAnswers(step: number) {
  if (!state.answers[step]) {
    state.answers[step] = {};
  }
}

function ensureQuestionAnswers(step: number, questionIndex: number) {
  ensureStepAnswers(step);
  if (!state.answers[step][questionIndex]) {
    state.answers[step][questionIndex] = {};
  }
}

function haveAllTeamsAnswered(step: number, questionIndex: number) {
  const teamIds = Object.keys(state.teams);
  if (teamIds.length === 0) return false;
  const answers = state.answers[step]?.[questionIndex] || {};
  return teamIds.every((teamId) => answers[teamId] !== undefined);
}

function hasQuestionTimedOut(step: number, questionIndex: number) {
  const question = getQuestion(step, questionIndex);
  if (!question) return false;
  const elapsedMs = Date.now() - state.stepStartTime;
  return elapsedMs >= question.durationSeconds * 1000;
}

function checkAnswer(
  step: number,
  questionIndex: number,
  answer: any,
): boolean {
  const correct = getQuestion(step, questionIndex)?.correctAnswer;
  if (correct === undefined) return false;

  if (Array.isArray(correct)) {
    if (correct.every((value) => typeof value === "number")) {
      const normalizedAnswer = Array.isArray(answer)
        ? answer
        : typeof answer === "number"
          ? [answer]
          : null;

      if (!normalizedAnswer) return false;

      return (
        correct.length === normalizedAnswer.length &&
        correct.every((value) => normalizedAnswer.includes(value))
      );
    }

    if (correct.every((value) => typeof value === "string")) {
      if (!Array.isArray(answer)) return false;
      const normalizedCorrect = correct
        .map((item) => normalizeAnswerText(String(item)))
        .filter(Boolean)
        .sort();
      const normalizedAnswer = answer
        .map((item) => normalizeAnswerText(String(item)))
        .filter(Boolean)
        .sort();

      return (
        normalizedCorrect.length === normalizedAnswer.length &&
        normalizedCorrect.every(
          (value, index) => value === normalizedAnswer[index],
        )
      );
    }

    return false;
  }

  if (typeof correct === "string" && typeof answer === "string") {
    return normalizeAnswerText(answer) === normalizeAnswerText(correct);
  }

  if (typeof correct === "number" && typeof answer === "number") {
    return answer === correct;
  }

  return false;
}

function calculateTimedScore(
  step: number,
  questionIndex: number,
  timeTaken?: number,
) {
  const question = getQuestion(step, questionIndex);
  const timeLimitSeconds = question?.durationSeconds ?? 15;
  const elapsedSeconds = Math.max(
    0,
    timeTaken !== undefined
      ? timeTaken / 1000
      : (Date.now() - state.stepStartTime) / 1000,
  );
  const remainingRatio = Math.max(
    0,
    (timeLimitSeconds - elapsedSeconds) / timeLimitSeconds,
  );
  const baseScore = 100;
  const speedBonus = Math.round(remainingRatio * 50);
  return baseScore + speedBonus;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });
  app.use(cors());
  app.use(bodyParser.json({ limit: "1mb" }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/state", (req, res) => {
    res.json(state);
  });

  // Professional RESTful routes
  app.get("/api/games", (req, res) => {
    // Return all games (multi-game mode)
    const allGames = Array.from(games.values());
    res.json({ games: allGames });
  });

  app.get("/api/questions", (req, res) => {
    res.json({ questions: [] });
  });

  app.get("/api/teams", (req, res) => {
    // Return all teams in current state
    res.json({ teams: state.teams });
  });

  app.get("/api/players", (req, res) => {
    // Return all players in all games
    const players = Array.from(games.values()).flatMap(
      (game) => game.players || [],
    );
    res.json({ players });
  });

  app.get("/api/info", (req, res) => {
    // Project info
    res.json({
      name: "Multi-game Example",
      version: "1.0.0",
      description:
        "A professional multi-game server with RESTful routes and socket.io.",
    });
  });

  // --- Socket.IO event handlers ---
  io.on("connection", (socket) => {
    // --- Logic from original server.ts ---
    console.log("Client connected:", socket.id);
    socket.emit("state_update", state);
    // Host bắt đầu câu hỏi
    socket.on("host_start_question", (step: number) => {
      const stage = getStage(step);
      if (!stage) return;
      state.activeQuestion = step;
      state.activeQuestionIndex = 0;
      state.showConcept = false;
      state.step = step;
      state.stepStartTime = Date.now();
      ensureQuestionAnswers(step, 0);
      io.emit("state_update", state);
    });
    socket.on("host_next_stage_question", () => {
      if (state.activeQuestion === null || state.activeQuestionIndex === null) {
        return;
      }
      const stage = getStage(state.activeQuestion);
      if (!stage) return;
      if (
        !haveAllTeamsAnswered(
          state.activeQuestion,
          state.activeQuestionIndex,
        ) &&
        !hasQuestionTimedOut(state.activeQuestion, state.activeQuestionIndex)
      ) {
        return;
      }
      if (state.activeQuestionIndex >= stage.questions.length - 1) {
        return;
      }
      state.activeQuestionIndex += 1;
      state.stepStartTime = Date.now();
      ensureQuestionAnswers(state.activeQuestion, state.activeQuestionIndex);
      io.emit("state_update", state);
    });
    socket.on("host_set_step", (step: number) => {
      state.step = step;
      state.activeQuestion = null;
      state.activeQuestionIndex = null;
      state.showConcept = false;
      state.stepStartTime = Date.now();
      ensureStepAnswers(step);
      io.emit("state_update", state);
    });
    // Host kết thúc câu hỏi, show khái niệm
    socket.on("host_show_concept", () => {
      if (state.activeQuestion === null || state.activeQuestionIndex === null) {
        return;
      }
      const stage = getStage(state.activeQuestion);
      if (!stage) return;
      const isLastQuestion =
        state.activeQuestionIndex === stage.questions.length - 1;
      if (
        !isLastQuestion ||
        (!haveAllTeamsAnswered(
          state.activeQuestion,
          state.activeQuestionIndex,
        ) &&
          !hasQuestionTimedOut(state.activeQuestion, state.activeQuestionIndex))
      ) {
        return;
      }
      state.showConcept = true;
      io.emit("state_update", state);
    });
    socket.on("host_reset", () => {
      state.step = 0;
      state.teams = {};
      state.answers = {};
      state.stepStartTime = Date.now();
      state.activeQuestion = null;
      state.activeQuestionIndex = null;
      state.showConcept = false;
      state.players = {};
      io.emit("state_update", state);
    });
    socket.on("team_join", (teamName: string) => {
      if (!state.teams[teamName]) {
        state.teams[teamName] = {
          id: teamName,
          socketId: socket.id,
          score: 0,
          joinedAt: Date.now(),
        };
      } else {
        state.teams[teamName].socketId = socket.id;
      }
      io.emit("state_update", state);
      socket.emit("join_success", teamName);
    });
    socket.on(
      "team_submit_answer",
      ({ teamId, step, questionIndex, answer, timeTaken }) => {
        if (!state.teams[teamId]) return;
        if (state.activeQuestion !== step || state.showConcept) return;
        if (state.activeQuestionIndex !== questionIndex) return;
        if (hasQuestionTimedOut(step, questionIndex)) return;
        ensureQuestionAnswers(step, questionIndex);
        if (state.answers[step][questionIndex][teamId] !== undefined) return;
        state.answers[step][questionIndex][teamId] = answer;
        let score = 0;
        const isCorrect = checkAnswer(step, questionIndex, answer);
        if (isCorrect) {
          score = calculateTimedScore(step, questionIndex, timeTaken);
        }
        // Cộng điểm cho team
        state.teams[teamId].score += score;
        if (!state.players[teamId])
          state.players[teamId] = { score: 0, team: teamId };
        state.players[teamId].score += score;

        // Get the question and explanation
        const question = getQuestion(step, questionIndex);
        const explanation = question?.explanation
          ? typeof question.explanation === "string"
            ? question.explanation
            : question.explanation.correct
          : null;

        socket.emit("team_answer_result", {
          step,
          questionIndex,
          isCorrect,
          points: score,
          explanation,
          correctAnswer: question?.correctAnswer,
        });
        io.emit("state_update", state);
      },
    );
    // --- Logic from index.js ---
    // ...existing code from index.js event handlers...
    // Sửa event submit-answer để tính điểm theo thời gian
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
        const seconds = timeTaken ? Math.floor(timeTaken) : timeLimit;
        const speedRatio = Math.max(0, (timeLimit - seconds) / timeLimit);
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
      // ...existing code...
    });
    // Sửa event update-score để tính điểm theo thời gian
    socket.on("update-score", ({ gameId, teamIndex, points, timeTaken }) => {
      const game = games.get(gameId);
      if (!game) return;
      const player = game.players.find((p) => p.id === socket.id);
      let actualPoints = points;
      if (typeof timeTaken === "number") {
        const seconds = Math.floor(timeTaken / 1000);
        const speedBonus = Math.max(0, 50 - seconds);
        actualPoints = 100 + speedBonus;
      }
      if (player) {
        if (!player.score) player.score = 0;
        player.score += actualPoints;
      }
      if (game.settings.gameMode === "team") {
        const team = game.teams[teamIndex];
        if (team) {
          const pointsPerPerson = actualPoints / team.players.length;
          team.score += pointsPerPerson;
        }
        io.to(gameId).emit("scores-updated", {
          teams: game.teams.map((t, idx) => ({
            name: t.name,
            index: idx,
            score: Math.round(t.score * 100) / 100,
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
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve built frontend if it exists (Production only)
    const staticPath = path.resolve(process.cwd(), "dist");
    try {
      await fs.access(staticPath);
      app.use(express.static(staticPath));
      app.get("/*", (req, res) => {
        res.sendFile(path.resolve(staticPath, "index.html"));
      });
    } catch {
      // No frontend build found
    }
  }

  // Serve index.html for root route if not handled by Vite/Static
  app.get("/", (req, res) => {
    const staticPath = path.resolve(process.cwd(), "dist");
    const indexPath = path.resolve(staticPath, "index.html");
    fs.access(indexPath)
      .then(() => res.sendFile(indexPath))
      .catch(() => res.status(404).send("Frontend not built yet."));
  });
  server.listen(PORT, "0.0.0.0" as any, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
