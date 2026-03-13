import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Clock,
  Trophy,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  CircleDot,
} from "lucide-react";
import { GameState } from "../App";
import {
  STORY_STAGES,
  type StageQuestion,
  type StoryStage,
} from "../../gameContent";

const STATIC_STEPS = [
  { id: 0, title: "Lobby", type: "lobby" as const },
  {
    id: 1,
    title: "Mở đầu - Hành trình dân chủ ở cơ sở",
    type: "story" as const,
    content:
      "Chào mừng các tổ dân phố đến với làng Yên Bình. Hôm nay, các bạn sẽ trải qua 4 chặng đặc biệt, mỗi chặng với 5 câu hỏi thử thách. Từ việc 'Dân biết' đến 'Dân thụ hưởng', các bạn sẽ khám phá bản chất thực sự của quyền làm chủ - nơi nhân dân không chỉ quyết định mà còn thực hiện, giám sát và thụ hưởng thành quả của chính mình.",
  },
  {
    id: 5,
    title: "TỔNG KẾT HÀNH TRÌNH DÂN CHỦ",
    type: "summary" as const,
    content: `Chúc mừng các bạn đã hoàn thành hành trình đầy ý nghĩa qua 4 chặng nền tảng của dân chủ xã hội chủ nghĩa!

CHẶNG 1: DÂN BIẾT
Tiền đề của mọi quyền làm chủ là thông tin. Người dân có quyền tiếp cận thông tin một cách rộng rãi, công khai. Chính quyền phải công bố minh bạch tất cả các chủ trương, kế hoạch - không bỏ sót bất kỳ nhóm người nào. Khi người dân được biết, họ mới có thể bàn bạc, quyết định được những vấn đề liên quan đến cuộc sống của mình.

CHẶNG 2: DÂN BÀN
Sau khi tiếp cận thông tin, người dân tham gia thảo luận và bàn bạc các vấn đề quan trọng của cộng đồng. Điều này xảy ra qua hội nghị, lấy ý kiến công khai. Lợi ích cốt lõi là: quyết định được thông qua theo người dân (đa số), nhưng quyền lợi hợp pháp của thiểu số vẫn bị bảo vệ. Đó là nguyên tắc tập trung dân chủ - hiệp lực giữa đa số và thiểu số.

CHẶNG 3: DÂN LÀM & DÂN KIỂM TRA, GIÁM SÁT
Người dân không chỉ quyết định, mà còn tham gia trực tiếp thực hiện dự án, công trình. Quan trọng hơn cả, họ có quyền kiểm tra, giám sát từng bước thực hiện - phát hiện sai phạm, tham nhũng, lãng phí. Giám sát của nhân dân chính là công cụ sắc bén nhất chống lại "giặc nội xâm" (tham ô, nhũng nhiễu, tha hóa quyền lực). Qua đó, nhân dân buộc bộ máy chính quyền phải chịu trách nhiệm.

CHẶNG 4: DÂN THỤ HƯỞNG
Mục tiêu cuối cùng của mọi chủ trương dân chủ là để nhân dân thụ hưởng. Không chỉ thụ hưởng công trình vật chất - con đường, công sở, trường học - mà còn thụ hưởng tinh thần: cảm nhận sự công bằng, minh bạch, được tôn trọng tiếng nói, được bảo vệ quyền lợi chính đáng.

BẢN CHẤT CỦA DÂN CHỦ XÃ HỘI CHỦ NGHĨA
"Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng"

Quyền lực thực sự thuộc về nhân dân lao động. Chỉ một nhà nước thực từ dân, do dân, vì dân mới có thể bền vững và phục vụ lợi ích thực sự của nhân dân. Hành trình của các bạn hôm nay là chứng minh cho điều đó - khi người dân không thụ động chờ đợi, mà chủ động tham gia làm chủ, quyền lực thực sự mới được thực thi.`,
  },
  {
    id: 6,
    title: "Kết thúc",
    type: "end" as const,
    content:
      "Các bạn đã khám phá toàn bộ hành trình dân chủ ở cơ sở: từ ' Dân biết' đến 'Dân thụ hưởng'. Quyền lực nhà nước bắt nguồn từ nhân dân - không phải từ trên xuống áp đặt, mà từ dưới lên từ ý chí tập thể của người dân. Chỉ khi nhân dân thực sự làm chủ, bảo vệ, kiểm tra và thụ hưởng - thì dân chủ mới bền vững và phát triển.",
  },
];

type HostStep =
  | {
      id: number;
      title: string;
      type: "lobby" | "story" | "summary" | "end";
      content?: string;
    }
  | StoryStage;

function getHostStep(step: number): HostStep | undefined {
  return (
    STATIC_STEPS.find((item) => item.id === step) ||
    STORY_STAGES.find((item) => item.step === step)
  );
}

function formatTimer(seconds: number) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function parseOutroContent(outro: string) {
  const svgStart = outro.indexOf("<svg");
  const svgEnd = outro.indexOf("</svg>");

  if (svgStart === -1 || svgEnd === -1 || svgEnd < svgStart) {
    return { svgMarkup: null as string | null, text: outro.trim() };
  }

  const endIndex = svgEnd + "</svg>".length;
  return {
    svgMarkup: outro.slice(svgStart, endIndex).trim(),
    text: `${outro.slice(0, svgStart)} ${outro.slice(endIndex)}`.trim(),
  };
}

function getQuestionExplanation(question: StageQuestion) {
  if (!question.explanation) return null;
  if (typeof question.explanation === "string") {
    return question.explanation;
  }
  return question.explanation.correct;
}

function getCorrectAnswerLabel(question: StageQuestion) {
  const formatOption = (index: number) => {
    const optionText = question.options?.[index] ?? `Lựa chọn ${index + 1}`;
    return `${String.fromCharCode(65 + index)}. ${optionText}`;
  };

  if (Array.isArray(question.correctAnswer)) {
    if (question.correctAnswer.every((item) => typeof item === "number")) {
      return question.correctAnswer
        .map((item) => formatOption(item as number))
        .join(" | ");
    }
    return question.correctAnswer.map((item) => String(item)).join(", ");
  }

  if (typeof question.correctAnswer === "number") {
    return formatOption(question.correctAnswer);
  }

  return question.correctAnswer;
}

function renderStageVisual(step: number) {
  if (step === 2) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            Quyết định thu hồi đất
          </span>
          <div className="px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 font-mono text-lg">
            00:15
          </div>
        </div>
        <div className="relative rounded-3xl border border-zinc-700 bg-stone-200 text-zinc-800 p-8 min-h-80">
          <div className="absolute inset-0 bg-linear-to-br from-white/55 via-stone-200/75 to-stone-400/40 backdrop-blur-[5px]" />
          <div className="relative space-y-4 opacity-70 blur-[2px] select-none">
            <div className="h-4 w-48 bg-zinc-700/50 rounded" />
            <div className="h-3 w-full bg-zinc-700/35 rounded" />
            <div className="h-3 w-11/12 bg-zinc-700/35 rounded" />
            <div className="h-3 w-10/12 bg-zinc-700/35 rounded" />
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="space-y-3">
                <div className="h-3 w-40 bg-zinc-700/35 rounded" />
                <div className="h-24 bg-zinc-700/25 rounded-2xl" />
              </div>
              <div className="space-y-3">
                <div className="h-3 w-32 bg-zinc-700/35 rounded" />
                <div className="h-24 bg-zinc-700/25 rounded-2xl" />
              </div>
            </div>
            <div className="pt-6 flex justify-end">
              <div className="w-28 h-28 rounded-full border-4 border-red-600/40" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-6 py-3 rounded-full bg-zinc-950/80 text-white border border-white/10 text-xl font-semibold tracking-wide">
              Tờ quyết định đang bị làm mờ
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-8 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            Thanh cân bằng lợi ích
          </span>
          <div className="px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 font-mono text-lg">
            00:10
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          <div className="rounded-3xl border border-emerald-700/30 bg-emerald-500/10 p-6 min-h-44 flex flex-col justify-between">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
              Lựa chọn A
            </p>
            <h3 className="text-3xl font-bold text-white leading-tight">
              Bảo vệ cây đa
            </h3>
            <p className="text-zinc-300 text-lg">Nguy cơ chậm tiến độ</p>
          </div>
          <div className="hidden md:flex flex-col items-center gap-3">
            {/* Bập bênh chuyển động */}
            <motion.div
              animate={{ rotate: [-12, 12, -12] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-40 h-3 rounded-full bg-linear-to-r from-emerald-400 via-amber-300 to-red-400"
              style={{ transformOrigin: "50% 50%" }}
            />
            <div className="w-5 h-24 rounded-full bg-zinc-700" />
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-8 h-8 rounded-full bg-white shadow-lg shadow-white/20"
            />
          </div>
          <div className="rounded-3xl border border-red-700/30 bg-red-500/10 p-6 min-h-44 flex flex-col justify-between">
            <p className="text-sm uppercase tracking-[0.25em] text-red-300">
              Lựa chọn B
            </p>
            <h3 className="text-3xl font-bold text-white leading-tight">
              Chặt cây đa
            </h3>
            <p className="text-zinc-300 text-lg">Xong sớm, được nhận thưởng</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            Đối chiếu chứng cứ công trường
          </span>
          <div className="px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold">
            Cảnh báo gian lận
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-emerald-700/30 bg-emerald-500/10 p-6 space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-emerald-300">
              Chứng từ
            </p>
            <h3 className="text-3xl font-bold text-white">Hóa đơn vật tư</h3>
            <div className="rounded-2xl bg-zinc-950/70 border border-zinc-700 p-5 space-y-3">
              <p className="text-zinc-300">Loại hàng: Xi măng chất lượng cao</p>
              <p className="text-zinc-300">
                Mác bê tông:{" "}
                <span className="text-emerald-300 font-bold">Mác 400</span>
              </p>
              <p className="text-zinc-300">Giá trị hợp đồng: Đúng định mức</p>
            </div>
          </div>
          <div className="rounded-3xl border border-red-700/30 bg-red-500/10 p-6 space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-red-300">
              Hiện trường
            </p>
            <h3 className="text-3xl font-bold text-white">
              Bao xi măng tại công trường
            </h3>
            <div className="rounded-2xl bg-zinc-950/70 border border-zinc-700 p-5 space-y-3">
              <p className="text-zinc-300">Loại hàng: Xi măng giá rẻ</p>
              <p className="text-zinc-300">
                Mác bê tông:{" "}
                <span className="text-red-300 font-bold">Mác 200</span>
              </p>
              <p className="text-zinc-300">
                Dấu hiệu: Bớt xén vật tư, sai chủng loại
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            Cổng khánh thành
          </span>
          <div className="px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-semibold">
            Hoàn tất chặng cuối
          </div>
        </div>
        <div className="rounded-4xl border border-emerald-700/30 bg-linear-to-br from-emerald-500/10 via-zinc-900 to-amber-500/10 p-10 text-center space-y-6">
          <div className="mx-auto w-52 h-52 rounded-full border-14 border-emerald-300/40 flex items-center justify-center bg-zinc-950/40">
            <div className="w-36 h-36 rounded-full border-4 border-dashed border-amber-300/40 flex items-center justify-center text-4xl font-black text-emerald-200">
              4.5
            </div>
          </div>
          <h3 className="text-4xl font-bold text-white">Cánh cổng thụ hưởng</h3>
          <p className="text-xl text-zinc-200 max-w-2xl mx-auto leading-relaxed">
            Các nhóm cần nhập thật nhanh 6 từ khóa cuối cùng để hoàn tất phương
            châm dân chủ ở cơ sở và mở cổng khánh thành.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function renderStageResolution(step: number, questionIndex: number) {
  if (step === 2 && questionIndex === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8">
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [0, 2, 0, -2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="#E5E7EB"
              stroke="#10B981"
              strokeWidth="4"
            />
            {/* Người que */}
            <circle
              cx="90"
              cy="60"
              r="18"
              fill="#fff"
              stroke="#374151"
              strokeWidth="3"
            />
            <rect x="85" y="78" width="10" height="40" rx="5" fill="#374151" />
            <line
              x1="90"
              y1="98"
              x2="70"
              y2="120"
              stroke="#374151"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="90"
              y1="98"
              x2="110"
              y2="120"
              stroke="#374151"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="90"
              y1="118"
              x2="80"
              y2="150"
              stroke="#374151"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="90"
              y1="118"
              x2="100"
              y2="150"
              stroke="#374151"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Tờ giấy quyết định */}
            <rect
              x="112"
              y="110"
              width="28"
              height="36"
              rx="4"
              fill="#fff"
              stroke="#F59E42"
              strokeWidth="3"
            />
            <line
              x1="116"
              y1="120"
              x2="136"
              y2="120"
              stroke="#F59E42"
              strokeWidth="2"
            />
            <line
              x1="116"
              y1="128"
              x2="136"
              y2="128"
              stroke="#F59E42"
              strokeWidth="2"
            />
            <line
              x1="116"
              y1="136"
              x2="136"
              y2="136"
              stroke="#F59E42"
              strokeWidth="2"
            />
          </svg>
        </motion.div>
        <div className="text-xl text-zinc-700 font-semibold">
          Người dân đang cầm tờ quyết định thu hồi đất
        </div>
      </div>
    );
  }

  return null;
}

export default function HostScreen({
  gameState,
  socket,
}: {
  gameState: GameState | null;
  socket: Socket;
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!gameState) return;
    const step = getHostStep(gameState.step);
    const activeStage = STORY_STAGES.find(
      (stage) => stage.step === gameState.activeQuestion,
    );
    const activeQuestion =
      activeStage &&
      gameState.activeQuestionIndex !== null &&
      gameState.activeQuestionIndex !== undefined
        ? activeStage.questions[gameState.activeQuestionIndex]
        : null;
    const duration = activeQuestion?.durationSeconds ?? 0;

    const updateTimeLeft = () => {
      if (!duration || !step || !("questions" in step)) {
        setTimeLeft(0);
        return;
      }

      const elapsed = Math.floor((Date.now() - gameState.stepStartTime) / 1000);
      setTimeLeft(Math.max(0, duration - elapsed));
    };

    updateTimeLeft();

    const interval = setInterval(() => {
      updateTimeLeft();
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        Đang kết nối...
      </div>
    );
  }

  const currentStep = getHostStep(gameState.step);
  const teams = Object.values(gameState.teams).sort(
    (a, b) => b.score - a.score,
  );

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        Không tìm thấy bước hiện tại.
      </div>
    );
  }

  const isStage = "questions" in currentStep;
  const isStaticStep = "type" in currentStep;
  const currentStepId = isStage ? currentStep.step : currentStep.id;
  const isStageActive =
    isStage && gameState.activeQuestion === currentStep.step;
  const currentQuestionIndex = gameState.activeQuestionIndex ?? 0;
  const currentQuestion =
    isStage && isStageActive
      ? currentStep.questions[currentQuestionIndex]
      : null;
  const questionDuration = currentQuestion?.durationSeconds ?? 0;
  const questionProgress = questionDuration
    ? Math.max(0, Math.min(100, (timeLeft / questionDuration) * 100))
    : 0;
  const questionAnswers =
    isStage && isStageActive
      ? gameState.answers[currentStep.step]?.[currentQuestionIndex] || {}
      : {};
  const allTeamsAnswered =
    teams.length > 0 &&
    teams.every((team) => questionAnswers[team.id] !== undefined);
  const isLastQuestion =
    isStage && isStageActive
      ? currentQuestionIndex === currentStep.questions.length - 1
      : false;
  const isTimeUp = Boolean(
    isStage &&
    isStageActive &&
    currentQuestion &&
    questionDuration > 0 &&
    timeLeft === 0,
  );
  const canResolveQuestion = allTeamsAnswered || isTimeUp;
  const canShowConcept = Boolean(
    isStage &&
    isStageActive &&
    canResolveQuestion &&
    isLastQuestion &&
    !gameState.showConcept,
  );
  const canAdvanceQuestion = Boolean(
    isStage &&
    isStageActive &&
    (allTeamsAnswered || isTimeUp) &&
    !isLastQuestion,
  );
  const stageResolution =
    isStage && isStageActive && canResolveQuestion
      ? renderStageResolution(currentStep.step, currentQuestionIndex)
      : null;
  const canContinueStep = !isStage
    ? currentStep.id < 6
    : Boolean(gameState.showConcept && allTeamsAnswered);

  const handleStartStage = () => {
    if (!isStage) return;
    socket.emit("host_start_question", currentStep.step);
  };

  const handleNextQuestion = () => {
    if (!canAdvanceQuestion) return;
    socket.emit("host_next_stage_question");
  };

  const handleShowConcept = () => {
    if (!canShowConcept) return;
    socket.emit("host_show_concept");
  };

  const handleNextStep = () => {
    if (!canContinueStep) return;
    socket.emit("host_set_step", currentStepId + 1);
  };

  const handlePrevStep = () => {
    if (currentStepId === 0) return;
    socket.emit("host_set_step", currentStepId - 1);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-emerald-400 tracking-tight">
            HÀNH TRÌNH TÌM LẠI DÂN CHỦ
          </h1>
          <span className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-400 font-mono">
            Bước {currentStepId}/6
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-zinc-400">
            <Users size={20} />
            <span className="font-mono">{teams.length} Tổ dân phố</span>
          </div>
          {currentQuestion && (
            <div
              className={`flex items-center gap-2 font-mono text-xl ${timeLeft < 10 ? "text-red-400" : "text-emerald-400"}`}
            >
              <Clock size={24} />
              {formatTimer(timeLeft)}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-12 overflow-y-auto flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentStepId}-${gameState.activeQuestionIndex}-${gameState.showConcept ? "concept" : "main"}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="max-w-5xl mx-auto w-full"
            >
              {isStaticStep && currentStep.type === "lobby" && (
                <div className="text-center space-y-8">
                  <h2 className="text-6xl font-black tracking-tighter text-white">
                    ESCAPE ROOM
                  </h2>
                  <h3 className="text-4xl font-light text-emerald-400 italic">
                    Hành trình tìm lại dân chủ
                  </h3>
                  <p className="text-xl text-zinc-400 mt-8">
                    Các tổ dân phố hãy truy cập vào đường link và nhập tên để
                    tham gia.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12">
                    {teams.map((team) => (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={team.id}
                        className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 flex items-center gap-3"
                      >
                        <CheckCircle2 className="text-emerald-500" />
                        <span className="font-semibold text-lg">{team.id}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {isStaticStep && currentStep.type === "story" && (
                <div className="space-y-8">
                  <h2 className="text-5xl font-bold text-white mb-12">
                    {currentStep.title}
                  </h2>
                  <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    {currentStep.content?.split("\n").map((line, index) => (
                      <p
                        key={index}
                        className="text-2xl leading-relaxed text-zinc-300 mb-4"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {isStaticStep && currentStep.type === "summary" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-10"
                >
                  <div className="space-y-4">
                    <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 tracking-tight">
                      {currentStep.title}
                    </h2>
                    <div className="h-1 w-24 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"></div>
                  </div>

                  <div className="border border-emerald-600/40 bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-transparent rounded-3xl p-12 shadow-2xl space-y-8">
                    {currentStep.content
                      ?.split("\n\n")
                      .map((paragraph, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          {paragraph.split("\n").map((line, lineIndex) => {
                            const isChapter = line.includes("CHẶNG");
                            const isCore = line.includes("BẢN CHẤT");
                            const isBold =
                              line.includes(":") &&
                              (line.includes("CHẶNG") ||
                                line.includes("Tiền đề"));

                            return (
                              <p
                                key={lineIndex}
                                className={`leading-relaxed mb-3 transition-colors ${
                                  isChapter
                                    ? "text-emerald-100 font-black text-xl tracking-wide"
                                    : isCore
                                      ? "text-emerald-50 font-bold text-lg italic border-l-4 border-emerald-400 pl-4 py-1"
                                      : isBold
                                        ? "text-emerald-100 font-bold text-base"
                                        : "text-emerald-50/90 text-base"
                                }`}
                              >
                                {line}
                              </p>
                            );
                          })}
                        </motion.div>
                      ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["Dân biết", "Dân bàn", "Dân làm", "Dân thụ hưởng"].map(
                      (stage, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: idx * 0.1 + 0.6 }}
                          className="p-4 bg-gradient-to-br from-emerald-900/40 to-emerald-950/20 border border-emerald-600/30 rounded-2xl text-center hover:border-emerald-500/60 transition-all"
                        >
                          <span className="text-emerald-200 font-bold text-sm">
                            {stage}
                          </span>
                        </motion.div>
                      ),
                    )}
                  </div>
                </motion.div>
              )}

              {isStage && !isStageActive && !gameState.showConcept && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-10"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-4"
                  >
                    <div className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 rounded-full border border-amber-500/40 backdrop-blur-sm">
                      <AlertCircle size={22} className="animate-pulse" />
                      <span className="font-bold tracking-widest uppercase text-sm">
                        {currentStep.focus}
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    <h2 className="text-6xl font-black text-white mb-2 leading-tight tracking-tight">
                      {currentStep.title}
                    </h2>
                    <div className="h-1.5 w-32 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="bg-gradient-to-br from-zinc-800/60 via-zinc-900/40 to-black/40 border border-zinc-700/50 p-10 rounded-3xl shadow-2xl backdrop-blur-sm space-y-5"
                  >
                    {currentStep.intro.split("\n").map((line, index) => (
                      <motion.p
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.3 + index * 0.05,
                          duration: 0.4,
                        }}
                        className="text-xl leading-relaxed text-zinc-100 font-medium"
                      >
                        {line}
                      </motion.p>
                    ))}
                  </motion.div>

                  {renderStageVisual(currentStep.step)}

                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartStage}
                    className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-bold text-xl transition-all shadow-xl hover:shadow-2xl flex items-center gap-3 w-full justify-center"
                  >
                    <span>BẮT ĐẦU CHẶNG</span>
                    <ArrowRight size={24} />
                  </motion.button>
                </motion.div>
              )}

              {isStage &&
                isStageActive &&
                !gameState.showConcept &&
                currentQuestion && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between gap-4">
                      <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20">
                        <CircleDot size={18} />
                        <span className="font-semibold tracking-wide uppercase text-sm">
                          {currentStep.focus} • Câu {currentQuestionIndex + 1}/
                          {currentStep.questions.length}
                        </span>
                      </div>
                      <div
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-base ${timeLeft <= 5 ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}
                      >
                        <Clock size={18} />
                        {formatTimer(timeLeft)} / {questionDuration}s
                      </div>
                    </div>

                    <h2 className="text-5xl font-bold text-white">
                      {currentStep.title}
                    </h2>
                    <div className="bg-indigo-950/30 border border-indigo-800/50 p-8 rounded-3xl shadow-2xl space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm font-mono text-zinc-300">
                          <span>Thời gian còn lại</span>
                          <span>{formatTimer(timeLeft)}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-zinc-900/80 border border-indigo-900/50">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-red-400" : "bg-emerald-400"}`}
                            style={{ width: `${questionProgress}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-3xl leading-tight text-white font-semibold">
                        {currentQuestion.prompt}
                      </p>
                      {currentQuestion.options ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentQuestion.options.map((option, index) => (
                            <div
                              key={option}
                              className="rounded-2xl border border-indigo-700/40 bg-zinc-950/70 p-5"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-black flex items-center justify-center shrink-0">
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <p className="text-xl leading-relaxed text-zinc-100">
                                  {option}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-indigo-700/40 bg-zinc-950/70 p-6">
                          <p className="text-xl text-zinc-200">
                            Các nhóm nhập trực tiếp đáp án trên màn hình của
                            mình.
                          </p>
                        </div>
                      )}
                      {(isTimeUp || allTeamsAnswered) && (
                        <div className="rounded-2xl border border-emerald-500/35 bg-emerald-950/25 p-6 space-y-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-semibold uppercase tracking-wide">
                            <CheckCircle2 size={16} />
                            {isTimeUp
                              ? "Hết giờ"
                              : "Tất cả các tổ đã trả lời"}{" "}
                            - công bố đáp án
                          </div>
                          <div>
                            <p className="text-sm uppercase tracking-wide text-emerald-300/80 mb-1">
                              Đáp án đúng
                            </p>
                            <p className="text-2xl font-semibold text-emerald-100">
                              {getCorrectAnswerLabel(currentQuestion)}
                            </p>
                          </div>
                          {getQuestionExplanation(currentQuestion) && (
                            <div>
                              <p className="text-sm uppercase tracking-wide text-emerald-300/80 mb-1">
                                Giải thích
                              </p>
                              <p className="text-lg leading-relaxed text-zinc-100">
                                {getQuestionExplanation(currentQuestion)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-5">
                      {stageResolution}

                      <div className="flex gap-4">
                        {canAdvanceQuestion && (
                          <button
                            onClick={handleNextQuestion}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-colors"
                          >
                            {stageResolution
                              ? `Tiếp tục sang câu ${currentQuestionIndex + 2}`
                              : "Sang câu tiếp theo"}
                          </button>
                        )}
                        {canShowConcept && (
                          <button
                            onClick={handleShowConcept}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg transition-colors"
                          >
                            Chốt chặng
                          </button>
                        )}
                      </div>

                      <h3 className="text-xl text-zinc-500 uppercase tracking-widest font-semibold">
                        Trạng thái các tổ
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {teams.map((team) => {
                          const hasAnswered =
                            questionAnswers[team.id] !== undefined;
                          return (
                            <div
                              key={team.id}
                              className={`px-6 py-3 rounded-xl border flex items-center gap-3 transition-colors ${hasAnswered ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}
                            >
                              {hasAnswered ? (
                                <CheckCircle2 size={20} />
                              ) : (
                                <Clock size={20} className="animate-pulse" />
                              )}
                              <span className="font-medium">{team.id}</span>
                            </div>
                          );
                        })}
                      </div>
                      {!allTeamsAnswered && !isTimeUp && (
                        <p className="text-sm text-amber-400">
                          Chờ tất cả các tổ trả lời hoặc hết giờ để công bố kết
                          quả.
                        </p>
                      )}
                      {!allTeamsAnswered && isTimeUp && (
                        <p className="text-sm text-amber-300">
                          Đã hết thời gian trả lời. Host có thể sang câu tiếp
                          theo để giữ nhịp chương trình.
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {isStage && gameState.showConcept && (
                <div className="space-y-10 text-center">
                  {(() => {
                    const outroContent = parseOutroContent(currentStep.outro);

                    return (
                      <>
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 text-emerald-300 rounded-full border border-emerald-500/20">
                          <CheckCircle2 size={18} />
                          <span className="font-semibold tracking-wide uppercase text-sm">
                            {currentStep.focus}
                          </span>
                        </div>
                        <h2 className="text-5xl font-bold text-emerald-400">
                          {currentStep.title}
                        </h2>
                        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
                          {outroContent.svgMarkup && (
                            <div
                              className="mb-6 flex justify-center"
                              dangerouslySetInnerHTML={{
                                __html: outroContent.svgMarkup,
                              }}
                            />
                          )}
                          {outroContent.text && (
                            <p className="text-2xl leading-relaxed text-zinc-200">
                              {outroContent.text}
                            </p>
                          )}
                        </div>
                        <div className="bg-gradient-to-br from-blue-950/40 to-blue-900/20 border border-blue-800/60 p-10 rounded-3xl shadow-2xl space-y-5 backdrop-blur-sm">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="inline-flex items-center gap-3 px-5 py-3 bg-blue-500/15 text-blue-300 rounded-full border border-blue-500/40"
                          >
                            <CheckCircle2 size={20} />
                            <span className="font-bold tracking-widest uppercase text-sm">
                              Chốt kiến thức
                            </span>
                          </motion.div>
                          <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl leading-relaxed text-blue-100 font-medium"
                          >
                            {currentStep.knowledgeSummary}
                          </motion.p>
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="bg-gradient-to-br from-emerald-950/50 via-emerald-900/30 to-black/20 border border-emerald-800/50 p-12 rounded-3xl shadow-2xl backdrop-blur-sm"
                        >
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-3 px-5 py-3 bg-emerald-500/15 text-emerald-300 rounded-full border border-emerald-500/40 mb-8"
                          >
                            <CheckCircle2 size={20} />
                            <span className="font-bold tracking-widest uppercase text-sm">
                              Khái niệm chặng
                            </span>
                          </motion.div>
                          <div className="space-y-6">
                            {currentStep.concept
                              .split("\n")
                              .map((line, index) => (
                                <motion.p
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.35 + index * 0.08 }}
                                  className={`leading-relaxed ${
                                    line.includes("Nguồn:")
                                      ? "text-emerald-50/70 text-base pt-6 border-t border-emerald-700/30"
                                      : "text-emerald-100 text-lg font-medium"
                                  }`}
                                >
                                  {line}
                                </motion.p>
                              ))}
                          </div>
                        </motion.div>
                      </>
                    );
                  })()}
                </div>
              )}

              {isStaticStep && currentStep.type === "end" && (
                <div className="text-center space-y-12">
                  <h2 className="text-6xl font-black text-emerald-400 mb-8">
                    CHÚC MỪNG!
                  </h2>
                  <div className="prose prose-invert prose-2xl max-w-none mx-auto">
                    {currentStep.content?.split("\n").map((line, index) => (
                      <p key={index} className="text-zinc-300">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col">
          <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
            <Trophy className="text-amber-400" size={24} />
            <h2 className="text-xl font-bold text-white tracking-wide">
              BẢNG XẾP HẠNG
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {teams.map((team, index) => (
              <motion.div
                layout
                key={team.id}
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  index === 0
                    ? "bg-amber-500/10 border-amber-500/30"
                    : index === 1
                      ? "bg-zinc-300/10 border-zinc-300/30"
                      : index === 2
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-zinc-800 border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`text-2xl font-black ${
                      index === 0
                        ? "text-amber-400"
                        : index === 1
                          ? "text-zinc-300"
                          : index === 2
                            ? "text-orange-400"
                            : "text-zinc-500"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <span className="font-semibold text-lg text-zinc-100">
                    {team.id}
                  </span>
                </div>
                <span className="font-mono text-xl text-emerald-400">
                  {team.score}
                </span>
              </motion.div>
            ))}
            {teams.length === 0 && (
              <div className="text-center text-zinc-500 py-12">
                Chưa có tổ nào tham gia
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-zinc-900 border-t border-zinc-800 p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            Quay lại
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  "Bạn có chắc chắn muốn làm lại từ đầu? Mọi điểm số sẽ bị xóa.",
                )
              ) {
                socket.emit("host_reset");
              }
            }}
            className="px-6 py-3 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded-xl font-medium transition-colors"
          >
            Làm lại từ đầu
          </button>
        </div>
        <button
          onClick={handleNextStep}
          disabled={currentStepId === 6 || !canContinueStep}
          className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-lg flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
        >
          Tiếp theo <ArrowRight size={24} />
        </button>
      </footer>
    </div>
  );
}
