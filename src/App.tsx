import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from './store/store';
import { setProjectName, increment, decrement, resetProject } from './store/projectSlice';

export default function App() {
  const dispatch = useDispatch();
  const { projectName, isInitialized, counter } = useSelector((state: RootState) => state.project);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#080809] text-zinc-100 font-sans p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900/50 border border-white/[0.06] backdrop-blur-md shadow-2xl space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <span className="text-xl font-bold">P</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">PromptPilot Skeleton</h1>
          <p className="text-xs text-zinc-500">React + TS + RTK + CodeGraph Template</p>
        </div>

        {/* Info */}
        <div className="space-y-3 pt-4 border-t border-white/[0.04] text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Tên dự án:</span>
            <span className="font-semibold text-white">{projectName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Trạng thái:</span>
            <span className="text-emerald-400 font-mono text-xs">
              {isInitialized ? 'ĐÃ KHỞI TẠO' : 'CHƯA KHỞI TẠO'}
            </span>
          </div>
        </div>

        {/* Counter demo */}
        <div className="space-y-4 pt-4 border-t border-white/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Redux Counter Demo:</span>
            <span className="text-lg font-mono font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-3 py-1 rounded-lg">
              {counter}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch(decrement())}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
            >
              - Giảm
            </button>
            <button
              onClick={() => dispatch(increment())}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-all active:scale-95 cursor-pointer"
            >
              + Tăng
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Đổi tên dự án..."
            onChange={(e) => dispatch(setProjectName(e.target.value))}
            className="flex-1 bg-zinc-950 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-all"
          />
          <button
            onClick={() => dispatch(resetProject())}
            className="px-4 py-2.5 rounded-xl border border-white/[0.06] hover:bg-white/[0.02] text-zinc-400 hover:text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            Đặt lại
          </button>
        </div>
      </div>
    </div>
  );
}
