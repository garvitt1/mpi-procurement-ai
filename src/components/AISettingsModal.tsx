import { useState } from "react"
import {
  getGeminiApiKey,
  setGeminiApiKey,
  getGeminiModel,
  testGeminiConnection,
  hasLiveAIConfigured,
} from "../services/aiService"
import { Icons, MPIButton } from "./design-system/MPIDesignSystem"

interface AISettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export default function AISettingsModal({
  isOpen,
  onClose,
  onSave,
}: AISettingsModalProps) {
  const [keyInput, setKeyInput] = useState(getGeminiApiKey())
  const [modelInput, setModelInput] = useState(getGeminiModel())
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  if (!isOpen) return null

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    const res = await testGeminiConnection(keyInput)
    setIsTesting(false)
    setTestResult(res)
  }

  const handleSave = () => {
    setGeminiApiKey(keyInput)
    if (typeof window !== "undefined") {
      localStorage.setItem("mpi_gemini_model", modelInput)
    }
    if (onSave) onSave()
    onClose()
  }

  const isLive = hasLiveAIConfigured()

  const getModelDisplayName = (model: string) => {
    if (model.includes("3.6")) return "MPI Neural-3.6"
    if (model.includes("3.1")) return "MPI Fast Neural v3.1"
    if (model.includes("pro")) return "MPI Deep Reasoning Pro"
    if (model.includes("3.8")) return "MPI NextGen Neural"
    return "MPI AI Engine (Active)"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0B1F4B] text-[#F97316] flex items-center justify-center shadow-xs">
              <Icons.Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                MPI AI Engine & API Configuration
              </h3>
              <p className="text-[11px] text-slate-500">
                Institutional MPI AI intelligence for real-time generative procurement decisions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Icons.Close className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Status Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isLive
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span className="font-semibold text-[11px]">
                {isLive
                  ? "Live MPI AI Connected"
                  : "Running in MPI AI Simulation Mode"}
              </span>
            </div>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200 font-semibold text-slate-700">
              {getModelDisplayName(modelInput)}
            </span>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              MPI AI Engine API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="MPI AI API Key..."
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B1F4B] focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Securely connects workspace workflows to MPI AI neural models. Key is encrypted and stored locally in your browser.
            </p>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target MPI AI Model
            </label>
            <select
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0B1F4B] outline-none bg-white cursor-pointer"
            >
              <option value="gemini-3.6-flash">
                MPI Neural v3.6 (Recommended: Ultra-fast institutional reasoning)
              </option>
              <option value="gemini-3.1-flash-lite">
                MPI Fast Neural v3.1 (High-throughput & low latency)
              </option>
              <option value="gemini-flash-latest">
                MPI Adaptive Neural (Production auto-updating)
              </option>
              <option value="gemini-pro-latest">
                MPI Deep Reasoning Pro (Institutional audit & complex compliance)
              </option>
              <option value="gemini-3.8-flash">
                MPI NextGen Neural (Advanced multimodal)
              </option>
            </select>
          </div>

          {/* Test Status Message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-[11px] ${
                testResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {testResult.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !keyInput.trim()}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isTesting ? "Testing…" : "Test API Connection"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <MPIButton variant="primary" size="sm" onClick={handleSave}>
              Save & Apply
            </MPIButton>
          </div>
        </div>
      </div>
    </div>
  )
}
