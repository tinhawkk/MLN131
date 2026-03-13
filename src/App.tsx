import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { io, Socket } from "socket.io-client";
import HostScreen from "./components/HostScreen";
import TeamScreen from "./components/TeamScreen";

export type Team = {
  id: string;
  socketId: string;
  score: number;
  joinedAt: number;
};

export type GameState = {
  step: number;
  teams: Record<string, Team>;
  answers: Record<number, Record<number, Record<string, any>>>;
  stepStartTime: number;
  activeQuestion?: number | null;
  activeQuestionIndex?: number | null;
  showConcept?: boolean;
};

const socketUrl = import.meta.env.VITE_SOCKET_URL || "";
const socket: Socket = io(socketUrl);

function MainApp() {
  const [role, setRole] = useState<"host" | "team" | "presentation" | null>(
    () => {
      return (sessionStorage.getItem("app_role") as any) || null;
    },
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [teamId, setTeamId] = useState<string | null>(() => {
    return sessionStorage.getItem("app_teamId") || null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (role) sessionStorage.setItem("app_role", role);
    else sessionStorage.removeItem("app_role");
  }, [role]);

  useEffect(() => {
    if (teamId) sessionStorage.setItem("app_teamId", teamId);
    else sessionStorage.removeItem("app_teamId");
  }, [teamId]);

  useEffect(() => {
    socket.on("state_update", (state: GameState) => {
      setGameState(state);
    });

    socket.on("join_success", (id: string) => {
      setTeamId(id);
      setRole("team");
      navigate("/team");
    });

    socket.on("connect", () => {
      if (role === "team" && teamId) {
        socket.emit("team_join", teamId);
      }
    });

    return () => {
      socket.off("state_update");
      socket.off("join_success");
      socket.off("connect");
    };
  }, [role, teamId, navigate]);

  // Routing logic
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
            <div className="bg-zinc-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-zinc-700">
              <h1 className="text-3xl font-bold text-white mb-2">
                HÀNH TRÌNH TÌM LẠI DÂN CHỦ
              </h1>
              <p className="text-zinc-400 mb-8">Chọn vai trò của bạn</p>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setRole("presentation");
                    navigate("/presentation");
                  }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Bài thuyết trình (Canva)
                </button>
                <button
                  onClick={() => {
                    setRole("host");
                    navigate("/host");
                  }}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Màn hình Host (Quản trò)
                </button>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-zinc-800 px-4 text-sm text-zinc-500">
                      HOẶC
                    </span>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get("teamName") as string;
                    if (name.trim()) {
                      socket.emit("team_join", name.trim());
                    }
                  }}
                  className="space-y-4"
                >
                  <input
                    type="text"
                    name="teamName"
                    placeholder="Tên tổ dân phố (VD: Tổ 1)"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
                  >
                    Vào chơi (Người chơi)
                  </button>
                </form>
              </div>
            </div>
          </div>
        }
      />
      <Route
        path="/presentation"
        element={
          <div className="min-h-screen bg-zinc-950 flex flex-col">
            <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
              <h1 className="text-xl font-bold text-emerald-400 tracking-tight">
                BÀI THUYẾT TRÌNH
              </h1>
              <button
                onClick={() => {
                  setRole(null);
                  navigate("/");
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
              >
                Quay lại
              </button>
            </header>
            <main className="flex-1 p-4 md:p-8 flex flex-col">
              <div className="flex-1 w-full max-w-6xl mx-auto bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col">
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    flex: 1,
                  }}
                >
                  <iframe
                    loading="lazy"
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      top: 0,
                      left: 0,
                      border: "none",
                      padding: 0,
                      margin: 0,
                    }}
                    src="https://www.canva.com/design/DAHDqDJ7VTo/TzWpzHvfnhv4feyZwGEQfQ/view?embed"
                    allowFullScreen
                    allow="fullscreen"
                  ></iframe>
                </div>
              </div>
              <div className="text-center mt-4">
                <a
                  href="https://www.canva.com/design/DAHDqDJ7VTo/TzWpzHvfnhv4feyZwGEQfQ/view?utm_content=DAHDqDJ7VTo&utm_campaign=designshare&utm_medium=embeds&utm_source=link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                >
                  Chương IV Dân chủ xã hội chủ nghĩa và nhà nước xã hội chủ
                  nghĩa
                </a>
              </div>
            </main>
          </div>
        }
      />
      <Route
        path="/host"
        element={<HostScreen gameState={gameState} socket={socket} />}
      />
      <Route
        path="/team"
        element={
          teamId ? (
            <TeamScreen gameState={gameState} socket={socket} teamId={teamId} />
          ) : null
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

// ...existing code ends after export default function App()
