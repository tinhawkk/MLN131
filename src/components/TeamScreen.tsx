import React, { useEffect, useState, useRef, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Clock, Send, AlertCircle } from "lucide-react";
import { GameState } from "../App";
import { STORY_STAGES } from "../../gameContent";

function getCurrentStage(step: number) {
  return STORY_STAGES.find((stage) => stage.step === step) || null;
}

export default function TeamScreen({
  gameState,
  socket,
  teamId,
}: {
  gameState: GameState | null;
  socket: Socket;
  teamId: string;
}) {
  const navigate = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [keywordAnswers, setKeywordAnswers] = useState<string[]>(
    Array(6).fill(""),
  );
  const keywordInputRefs = useRef<(HTMLInputElement | null)[]>(
    Array(6).fill(null),
  );
  const [answerFeedback, setAnswerFeedback] = useState<{
    step: number;
    questionIndex: number;
    isCorrect: boolean;
    points: number;
    explanation?: string;
    correctAnswer?: any;
  } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const stage = gameState ? getCurrentStage(gameState.step) : null;
  const currentQuestionIndex = gameState?.activeQuestionIndex ?? 0;
  const currentQuestion =
    stage && gameState?.activeQuestion === gameState?.step
      ? stage.questions[currentQuestionIndex]
      : null;
  const questionAnswers =
    gameState?.answers[gameState.step]?.[currentQuestionIndex] || {};
  const hasAnswered = questionAnswers[teamId] !== undefined;
  const myTeam = gameState?.teams[teamId];
  const isMultiSelect = Array.isArray(currentQuestion?.correctAnswer);
  const isSixKeywordQuestion = currentQuestion?.id === "4.5";
  const isActive = Boolean(
    stage &&
      gameState &&
      gameState.activeQuestion === gameState.step &&
      !gameState.showConcept &&
      currentQuestion,
  );

  useEffect(() => {
    setSelectedIdx(null);
    setSelectedOptions([]);
    setTextAnswer("");
    setKeywordAnswers(Array(6).fill(""));
    setAnswerFeedback(null);
    setShowExplanation(false);
  }, [gameState?.step, gameState?.activeQuestionIndex]);

  useEffect(() => {
    const handleAnswerResult = (payload: {
      step: number;
      questionIndex: number;
      isCorrect: boolean;
      points: number;
      explanation?: string;
      correctAnswer?: any;
    }) => {
      setAnswerFeedback(payload);
    };

    socket.on("team_answer_result", handleAnswerResult);

    return () => {
      socket.off("team_answer_result", handleAnswerResult);
    };
  }, [socket]);

  useEffect(() => {
    if (!gameState || !hasAnswered) return;

    // Track when all teams have answered or time is up
    const questionAnswers =
      gameState.answers[gameState.step]?.[currentQuestionIndex] || {};
    const teams = Object.values(gameState.teams);
    const allTeamsAnswered =
      teams.length > 0 &&
      teams.every((team) => questionAnswers[team.id] !== undefined);

    const question = stage?.questions[currentQuestionIndex];
    const timeLimitSeconds = question?.durationSeconds ?? 15;
    const elapsedSeconds = (Date.now() - gameState.stepStartTime) / 1000;
    const isTimeUp = elapsedSeconds >= timeLimitSeconds;

    if ((allTeamsAnswered || isTimeUp) && !showExplanation) {
      setShowExplanation(true);
    }
  }, [gameState, currentQuestionIndex, hasAnswered, showExplanation, stage]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Đang kết nối...
      </div>
    );
  }


  const submitAnswer = (answer: number | number[] | string | string[]) => {
    const timeTaken = Math.max(0, Date.now() - gameState.stepStartTime);
    socket.emit("team_submit_answer", {
      teamId,
      step: gameState.step,
      questionIndex: currentQuestionIndex,
      answer,
      timeTaken,
    });
  };

  const handleSelect = (idx: number) => {
    setSelectedIdx(idx);
    submitAnswer(idx);
  };

  const handleToggleOption = (idx: number) => {
    setSelectedOptions((current) =>
      current.includes(idx)
        ? current.filter((value) => value !== idx)
        : [...current, idx].sort((a, b) => a - b),
    );
  };

  const handleMultiSubmit = () => {
    if (selectedOptions.length === 0) return;
    submitAnswer(selectedOptions);
  };

  const handleTextSubmit = () => {
    if (!textAnswer.trim()) return;
    submitAnswer(textAnswer.trim());
  };

  const handleKeywordChange = (index: number, value: string) => {
    // Normalize: xóa khoảng trắng thừa, chuyển thường
    let normalizedValue = value.trim().toLowerCase();

    // Xử lý dấu phẩy hoặc enter - tách từ khóa
    const words = normalizedValue.split(/[,\n]/);

    setKeywordAnswers((current) => {
      const updated = [...current];

      if (words.length > 1) {
        // Người dùng nhập nhiều từ cách nhau bằng dấu phẩy/enter
        let currentIndex = index;
        for (let i = 0; i < words.length && currentIndex < 6; i++) {
          const word = words[i].trim();
          if (word) {
            updated[currentIndex] = word;
            currentIndex++;
          }
        }

        // Auto-focus vào ô input trống tiếp theo
        setTimeout(() => {
          for (let i = 0; i < 6; i++) {
            if (!updated[i] || updated[i].trim().length === 0) {
              keywordInputRefs.current[i]?.focus();
              return;
            }
          }
          // Nếu tất cả đầy đủ, gửi tự động
          if (updated.every((item) => item.trim().length > 0)) {
            submitAnswer(updated.map((item) => item.trim()));
          }
        }, 0);
      } else {
        // Nhập bình thường - chỉ một từ khóa
        updated[index] = normalizedValue;
      }

      return updated;
    });
  };

  const handleKeywordKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();

      // Validate từ khóa hiện tại
      const trimmedValue = keywordAnswers[index].trim();
      if (!trimmedValue) return;

      // Nếu đây là input cuối cùng và đã có 6 từ, gửi
      if (
        index === 5 ||
        (index < 5 &&
          keywordAnswers.slice(0, index + 1).every((item) => item.trim()))
      ) {
        if (keywordAnswers.every((item) => item.trim().length > 0)) {
          handleKeywordSubmit();
          return;
        }
      }

      // Chuyển focus sang ô tiếp theo
      if (index < 5) {
        keywordInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeywordSubmit = () => {
    const sanitized = keywordAnswers.map((item) => item.trim());
    if (sanitized.some((item) => item.length === 0)) return;
    submitAnswer(sanitized);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
            <span className="font-bold text-emerald-400">
              {teamId.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="font-bold text-white">{teamId}</h1>
            <p className="text-xs text-zinc-400 font-mono">
              Điểm: {myTeam?.score || 0}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          className="ml-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
        >
          Quay lại
        </button>
      </header>

      <main className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${gameState.step}-${currentQuestionIndex}-${isActive ? "active" : "idle"}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full"
          >
            {!isActive ? (
              <div className="text-center space-y-6 py-12">
                <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                  <Clock size={40} className="text-zinc-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-zinc-300">
                  Hãy chú ý lên màn hình chính!
                </h2>
                <p className="text-zinc-500">
                  Chờ host mở câu hỏi tiếp theo...
                </p>
              </div>
            ) : hasAnswered ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-center space-y-8 py-16 rounded-3xl p-10 border backdrop-blur-sm ${
                  answerFeedback?.isCorrect
                    ? "bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-black/20 border-emerald-800/50"
                    : "bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-black/20 border-amber-800/50"
                }`}
              >
                <AnimatePresence>
                  {answerFeedback?.isCorrect && (
                    <motion.div
                      key="confetti"
                      initial={{ scale: 0.7, rotate: -10, opacity: 0 }}
                      animate={{ scale: 1.15, rotate: 0, opacity: 1 }}
                      exit={{ scale: 0.7, rotate: 10, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="relative flex justify-center items-center"
                    >
                      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                        <svg
                          width="140"
                          height="140"
                          className="animate-spin-slow"
                        >
                          <circle
                            cx="70"
                            cy="70"
                            r="60"
                            stroke="#10b981"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray="12 12"
                          />
                        </svg>
                      </div>
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1.2 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                        }}
                        className="w-28 h-28 rounded-full flex items-center justify-center mx-auto border-2 bg-emerald-500/25 border-emerald-400/50 shadow-2xl shadow-emerald-500/20"
                      >
                        <CheckCircle2 size={56} className="text-emerald-300" />
                      </motion.div>
                    </motion.div>
                  )}
                  {!answerFeedback?.isCorrect && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-28 h-28 rounded-full flex items-center justify-center mx-auto border-2 bg-amber-500/25 border-amber-400/50 shadow-2xl shadow-amber-500/20"
                    >
                      <AlertCircle size={56} className="text-amber-300" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <h2
                    className={`text-4xl font-black tracking-tight ${
                      answerFeedback?.isCorrect
                        ? "text-emerald-300 animate-bounce"
                        : "text-amber-300"
                    }`}
                  >
                    {answerFeedback?.isCorrect
                      ? "Chính xác! Tuyệt vời!"
                      : "Đã gửi câu trả lời"}
                  </h2>
                  <p
                    className={`text-lg font-medium ${
                      answerFeedback?.isCorrect
                        ? "text-emerald-100/80"
                        : "text-amber-100/80"
                    }`}
                  >
                    {answerFeedback
                      ? answerFeedback.isCorrect
                        ? `+${answerFeedback.points} điểm! Bạn trả lời nhanh và chính xác.`
                        : "Câu này chưa chính xác, chưa có điểm cộng. Học hỏi thêm từ giải thích."
                      : "Hãy chờ host mở câu tiếp theo."}
                  </p>
                </motion.div>

                {showExplanation && answerFeedback?.explanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`mt-10 pt-8 border-t space-y-4 text-left rounded-2xl p-6 ${
                      answerFeedback?.isCorrect
                        ? "bg-emerald-900/20 border-emerald-700/50"
                        : "bg-amber-900/20 border-amber-700/50"
                    }`}
                  >
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className={`text-sm uppercase tracking-widest font-bold ${
                        answerFeedback?.isCorrect
                          ? "text-emerald-300"
                          : "text-amber-300"
                      }`}
                    >
                      📚 Giải thích & Tìm hiểu
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.45 }}
                      className="text-base leading-relaxed text-zinc-100 font-medium"
                    >
                      {answerFeedback.explanation}
                    </motion.p>
                  </motion.div>
                )}

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-zinc-400/70 text-sm"
                >
                  ⏳ Chờ host mở câu hỏi tiếp theo...
                </motion.p>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                  <AlertCircle size={16} />
                  <span className="font-semibold tracking-wide uppercase text-xs">
                    {stage?.focus} • Câu {currentQuestionIndex + 1}/5
                  </span>
                </div>

                {currentQuestion?.options ? (
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="space-y-3 flex flex-col items-center">
                      {currentQuestion.options.map((_, idx) => {
                        const isSelected = isMultiSelect
                          ? selectedOptions.includes(idx)
                          : selectedIdx === idx;

                        return (
                          <button
                            key={idx}
                            onClick={() =>
                              isMultiSelect
                                ? handleToggleOption(idx)
                                : handleSelect(idx)
                            }
                            disabled={
                              hasAnswered ||
                              (!isMultiSelect && selectedIdx !== null)
                            }
                            className={`w-32 h-16 rounded-2xl border-2 text-2xl font-bold transition-all duration-200 flex items-center justify-center ${
                              isSelected
                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-900/20"
                                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800"
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </button>
                        );
                      })}
                    </div>
                    {isMultiSelect && (
                      <button
                        onClick={handleMultiSubmit}
                        disabled={hasAnswered || selectedOptions.length === 0}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Send size={18} /> Gửi đáp án
                      </button>
                    )}
                  </div>
                ) : isSixKeywordQuestion ? (
                  <div className="space-y-5">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-purple-700/50 rounded-2xl"
                    >
                      <p className="text-sm leading-relaxed text-indigo-200">
                        💡 <strong>Cách nhập:</strong> Gõ từ khóa rồi nhấn{" "}
                        <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-600">
                          Enter
                        </kbd>{" "}
                        để chuyển sang ô tiếp theo. Hoặc nhập nhiều từ cách nhau
                        bằng dấu <strong>,</strong>
                      </p>
                    </motion.div>

                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold text-zinc-300">
                        Nhập 6 từ khóa theo thứ tự:
                      </h3>
                      <motion.span
                        key={keywordAnswers.filter((a) => a.trim()).length}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className={`text-sm font-bold px-3 py-1 rounded-full ${
                          keywordAnswers.filter((a) => a.trim()).length === 6
                            ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                            : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        }`}
                      >
                        {keywordAnswers.filter((a) => a.trim()).length}/6
                      </motion.span>
                    </div>

                    <motion.div layout className="space-y-2">
                      {keywordAnswers.map((value, index) => {
                        const isFilled = value.trim().length > 0;
                        const isActive =
                          index === keywordAnswers.findIndex((a) => !a.trim());

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative"
                          >
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                              Bước {index + 1}
                            </label>
                            <div
                              className={`relative transition-all ${isFilled ? "scale-105" : ""}`}
                            >
                              <input
                                ref={(el) => {
                                  keywordInputRefs.current[index] = el;
                                }}
                                type="text"
                                value={value}
                                onChange={(event) =>
                                  handleKeywordChange(index, event.target.value)
                                }
                                onKeyDown={(event) =>
                                  handleKeywordKeyDown(index, event)
                                }
                                placeholder={`Từ khóa của bước ${index + 1}`}
                                disabled={hasAnswered}
                                autoComplete="off"
                                className={`w-full px-4 py-3 bg-zinc-900 border-2 rounded-xl text-white focus:outline-none transition-all disabled:opacity-50 ${
                                  isFilled
                                    ? "border-emerald-500/60 bg-emerald-950/20 focus:border-emerald-400"
                                    : isActive
                                      ? "border-indigo-500 bg-indigo-950/20 focus:border-indigo-300 shadow-lg shadow-indigo-500/20"
                                      : "border-zinc-700 focus:border-indigo-500"
                                }`}
                              />
                              {isFilled && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400"
                                >
                                  ✓
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-xs text-zinc-400 text-center italic mt-3"
                    >
                      {keywordAnswers.filter((a) => a.trim()).length === 6
                        ? "🎉 Bạn đã hoàn thành! Nhấn gửi để nộp."
                        : keywordAnswers.filter((a) => a.trim()).length > 0
                          ? `📝 Còn ${6 - keywordAnswers.filter((a) => a.trim()).length} từ nữa...`
                          : "Hãy bắt đầu nhập từ khóa đầu tiên"}
                    </motion.p>

                    <button
                      onClick={handleKeywordSubmit}
                      disabled={
                        hasAnswered ||
                        keywordAnswers.some((item) => item.trim().length === 0)
                      }
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:from-zinc-700 disabled:to-zinc-700 shadow-lg shadow-emerald-900/50"
                    >
                      <Send size={18} /> Gửi 6 từ khóa
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={textAnswer}
                      onChange={(event) => setTextAnswer(event.target.value)}
                      placeholder="Nhập 6 từ khóa..."
                      disabled={hasAnswered}
                      className="w-full px-4 py-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                    <button
                      onClick={handleTextSubmit}
                      disabled={hasAnswered || !textAnswer.trim()}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Send size={18} /> Gửi đáp án
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
