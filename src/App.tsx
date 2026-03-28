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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("app_theme") === "dark";
  });
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [teamId, setTeamId] = useState<string | null>(() => {
    return sessionStorage.getItem("app_teamId") || null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("app_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("app_theme", "light");
    }
  }, [isDarkMode]);

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

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-white text-slate-900"}`}
    >
      {/* Nút chuyển đổi chế độ tối/sáng */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-6 right-6 z-[110] p-3 rounded-full shadow-xl transition-all hover:scale-110 active:scale-95 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200 dark:border-zinc-700 group"
      >
        {isDarkMode ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
          >
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#475569"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>

      {/* Container cho nội dung hiển thị */}
      <div
        className={`flex-1 overflow-y-auto transition-colors duration-500 ${isDarkMode ? "bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black" : "bg-white"}`}
      >
        <Routes>
          <Route
            path="/"
            element={
              <div className="min-h-full flex items-center justify-center p-6">
                <div className="w-full max-w-lg transition-all duration-500">
                  <div className="mb-10 flex flex-col items-center">
                    <div className="bg-red-600 p-4 rounded-3xl shadow-[0_10px_30px_rgba(220,38,38,0.3)] mb-8 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </div>
                    <h1 className="text-[clamp(2rem,6vw,3.5rem)] font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tighter leading-none text-balance text-center">
                      Hành trình
                    </h1>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
                      <span className="text-[clamp(1.5rem,5vw,2.5rem)] font-black text-red-600 uppercase tracking-tighter italic">
                        TÌM LẠI
                      </span>
                      <span className="text-[clamp(1.5rem,5vw,2.5rem)] font-black text-blue-700 dark:text-blue-500 uppercase tracking-tighter">
                        DÂN CHỦ
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium tracking-wide text-center">
                      Lan tỏa sức mạnh từ nhân dân, vì nhân dân
                    </p>
                  </div>

                  <div className="space-y-4 px-4 sm:px-0">
                    <button
                      onClick={() => {
                        setRole("presentation");
                        navigate("/presentation");
                      }}
                      className="group flex items-center justify-center gap-3 w-full py-5 bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-400 rounded-2xl font-black transition-all duration-300 border-2 border-blue-700/10 dark:border-blue-500/10 hover:border-blue-700 dark:hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-200 dark:hover:shadow-blue-900/40 uppercase tracking-widest text-sm"
                    >
                      Bài thuyết trình (Canva)
                    </button>

                    <button
                      onClick={() => {
                        setRole("host");
                        navigate("/host");
                      }}
                      className="flex items-center justify-center gap-3 w-full py-5 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-black transition-all duration-300 shadow-lg shadow-blue-700/20 hover:shadow-2xl hover:-translate-y-1 uppercase tracking-widest text-sm"
                    >
                      Màn hình Host (Quản trò)
                    </button>

                    <button
                      onClick={() => {
                        navigate("/video");
                      }}
                      className="flex items-center justify-center gap-3 w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black transition-all duration-300 shadow-lg shadow-red-600/20 hover:shadow-2xl hover:-translate-y-1 uppercase tracking-widest text-sm"
                    >
                      Sản phẩm Video (YouTube)
                    </button>

                    <div className="relative py-10">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300 dark:border-zinc-800"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-slate-100 dark:bg-zinc-800 px-6 py-1.5 rounded-full text-[11px] text-slate-700 dark:text-zinc-400 uppercase tracking-[0.25em] font-black shadow-sm">
                          DÀNH CHO NGƯỜI THAM GIA
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
                        placeholder="Nhập tên tổ dân phố..."
                        className="w-full px-8 py-5 bg-slate-50 dark:bg-zinc-900 border-2 border-transparent focus:border-emerald-500 dark:focus:border-emerald-500 rounded-2xl text-slate-900 dark:text-white font-bold transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-600 text-center text-lg shadow-inner"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 uppercase tracking-widest"
                      >
                        Vào chơi ngay
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
              <div className="h-full flex flex-col transition-colors duration-500">
                <header className="bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900 p-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-700/20">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="2"
                          y="3"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                      BÀI THUYẾT TRÌNH
                    </h1>
                  </div>
                  <button
                    onClick={() => navigate("/")}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl transition-all font-black text-xs uppercase tracking-widest"
                  >
                    QUAY LẠI
                  </button>
                </header>
                <main className="flex-1 p-4 md:p-8 flex flex-col overflow-hidden bg-slate-50 dark:bg-black/20">
                  <div className="flex-1 w-full max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white dark:border-zinc-800 transition-colors duration-500">
                    <iframe
                      loading="lazy"
                      className="w-full h-full border-none"
                      src="https://www.canva.com/design/DAHDqDJ7VTo/TzWpzHvfnhv4feyZwGEQfQ/view?embed"
                      allowFullScreen
                      allow="fullscreen"
                    ></iframe>
                  </div>
                </main>
              </div>
            }
          />
          <Route
            path="/host"
            element={
              <div className="h-full bg-white dark:bg-zinc-950 transition-colors duration-500">
                <HostScreen gameState={gameState} socket={socket} />
              </div>
            }
          />
          <Route
            path="/team"
            element={
              teamId ? (
                <div className="h-full bg-white dark:bg-zinc-950 transition-colors duration-500">
                  <TeamScreen
                    gameState={gameState}
                    socket={socket}
                    teamId={teamId}
                  />
                </div>
              ) : null
            }
          />
          <Route
            path="/video"
            element={
              <div className="h-full flex flex-col transition-colors duration-500">
                <header className="bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900 p-6 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33a29 29 0 0 0-.46-5.33z"></path>
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                      </svg>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter text-balance">
                      VIDEO SẢN PHẨM
                    </h1>
                  </div>
                  <button
                    onClick={() => navigate("/")}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl transition-all font-black text-xs uppercase tracking-widest"
                  >
                    QUAY LẠI
                  </button>
                </header>
                <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden bg-slate-50 dark:bg-black/20">
                  <div className="w-full max-w-5xl aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-[6px] border-white dark:border-zinc-800 transition-colors duration-500">
                    <iframe
                      width="100%"
                      height="100%"
                      src={import.meta.env.VITE_YOUTUBE_URL}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    ></iframe>
                  </div>
                </main>
              </div>
            }
          />
        </Routes>
      </div>

      {/* Footer chuyên nghiệp */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900 h-20 shrink-0 flex items-center z-[100] transition-colors duration-500 px-8">
        <div className="container mx-auto flex justify-between items-center w-full">
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[10px] font-black text-white">
                Hồ Tú Minh Triều - SE183846
              </div>
              <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[10px] font-black text-white">
                Hoàng Trung Tín - SE182892
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[10px] font-black text-white">
                Trần Đỗ Đăng Khoa - SE161408
              </div>
            </div>
            <p className="text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] font-black text-[10px]">
              Đội ngũ phát triển
            </p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-900 px-5 py-2.5 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-slate-900 dark:text-zinc-300 text-[10px] font-black tracking-widest uppercase">
              DÂN CHỦ SỐ
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}
