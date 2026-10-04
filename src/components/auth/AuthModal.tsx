import React, { useState } from "react"
import { Screen } from "../../App"
import { RoleKey, mockLogin, mockGoogleAuth, setAdminSession, detectRoleFromLoginId } from "../../lib/mockAuth"
import { CATALOG_CATEGORIES } from "../../lib/mpiCatalog"

interface AuthModalProps {
  isOpen: boolean
  initialMode?: "login" | "signin"
  onClose: () => void
  navigate: (screen: Screen) => void
}

export default function AuthModal({
  isOpen,
  initialMode = "login",
  onClose,
  navigate,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signin">(initialMode)
  const [role, setRole] = useState<RoleKey>("startup")

  // Login form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Sign In / Registration: Step 2 details state
  // Step 1 = Google auth or credentials; Step 2 = Details asked
  const [step, setStep] = useState<1 | 2>(1)
  const [authGoogleUser, setAuthGoogleUser] = useState<{
    name: string
    email: string
    avatar?: string
  } | null>(null)

  const [companyName, setCompanyName] = useState("")
  const [city, setCity] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>(CATALOG_CATEGORIES[0])

  if (!isOpen) return null

  // ─── LOGIN HANDLERS ──────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email/username and password")
      return
    }

    // Automatically detect role according to login ID
    const detectedRole = detectRoleFromLoginId(email)
    setRole(detectedRole)

    setSubmitting(true)
    const result = await mockLogin(detectedRole, { email, password })
    setSubmitting(false)

    if (!result.success) {
      setErrorMsg(result.error || "Authentication failed. Check your credentials.")
      return
    }

    const user = {
      name: email.split("@")[0] || (detectedRole === "admin" ? "Admin" : "Founder"),
      email: email.trim(),
      role: detectedRole,
    }
    try {
      localStorage.setItem("mpi_active_user", JSON.stringify(user))
      localStorage.setItem("mpi_user_role", detectedRole)
    } catch {}

    if (detectedRole === "admin") {
      setAdminSession(true)
      onClose()
      navigate("admin.home")
    } else if (detectedRole === "msme") {
      onClose()
      navigate("msme.home")
    } else {
      onClose()
      navigate("startup.home")
    }
  }

  const handleGoogleLogin = async () => {
    setSubmitting(true)
    setErrorMsg("")
    const detectedRole = email.trim() ? detectRoleFromLoginId(email) : "startup"
    setRole(detectedRole)
    const result = await mockGoogleAuth(detectedRole)
    setSubmitting(false)

    if (result.success) {
      const userRole = result.user?.role || detectedRole
      if (userRole === "admin") {
        setAdminSession(true)
        onClose()
        navigate("admin.home")
      } else if (userRole === "msme") {
        onClose()
        navigate("msme.home")
      } else {
        onClose()
        navigate("startup.home")
      }
    }
  }

  // ─── SIGN IN (NEW ACCOUNT) HANDLERS ──────────────────────────────────────────
  // After signing in, user is directly taken to the complete onboarding flow
  // where complete details, requirements, category & current business details are asked!
  const handleGoogleSignInStep1 = async () => {
    setSubmitting(true)
    setErrorMsg("")
    const result = await mockGoogleAuth(role)
    setSubmitting(false)

    if (result.success) {
      onClose()
      if (role === "msme") {
        navigate("msme.onboarding")
      } else {
        navigate("startup.onboarding")
      }
    }
  }

  const handleCredentialSignInStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMsg("Please enter your email and a password")
      return
    }
    const user = {
      name: email.split("@")[0] || "New User",
      email: email.trim(),
      role,
    }
    try {
      localStorage.setItem("mpi_active_user", JSON.stringify(user))
      localStorage.setItem("mpi_user_role", role)
    } catch {}

    onClose()
    if (role === "msme") {
      navigate("msme.onboarding")
    } else {
      navigate("startup.onboarding")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-sm">
              M
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B1F4B] tracking-tight">
                {mode === "login" ? "Login to MPI" : step === 1 ? "Sign In to MPI" : "Complete Your Profile"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === "login"
                  ? "Access your verified procurement dashboard"
                  : step === 1
                  ? "Sign in with Google to get started"
                  : "Tell us a bit about your business"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Toggle (Login vs Sign In) when on Step 1 */}
        {step === 1 && (
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setErrorMsg("")
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white text-[#0B1F4B] shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signin")
                setErrorMsg("")
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-white text-[#0B1F4B] shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In (New User)
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ─────────── MODE 1: LOGIN ─────────── */}
          {mode === "login" && (
            <div className="space-y-4">
              {/* Google Authentication for Login */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Or with email / username
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Standard Email / Password Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address or Username
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email or username (e.g. admin)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-12 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-2.5 rounded-xl bg-[#0B1F4B] hover:bg-[#123B7A] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Authenticating..." : "Login"}
                </button>
              </form>
            </div>
          )}

          {/* ─────────── MODE 2: SIGN IN (STEP 1: AUTH) ─────────── */}
          {mode === "signin" && step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  I want to join MPI as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("startup")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      role === "startup"
                        ? "bg-[#0B1F4B] text-white border-[#0B1F4B] shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>🚀 Startup (Buyer)</span>
                    <span className="text-[10px] opacity-75 font-normal">Source custom goods</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("msme")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      role === "msme"
                        ? "bg-[#EA580C] text-white border-[#EA580C] shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>🏭 MSME (Supplier)</span>
                    <span className="text-[10px] opacity-75 font-normal">Fulfill manufacturing</span>
                  </button>
                </div>
              </div>

              {/* Primary Google Auth for Sign In */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleGoogleSignInStep1}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/30 text-slate-800 text-sm font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Or sign in with email
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <form onSubmit={handleCredentialSignInStep1} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Create Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-blue-900 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
                >
                  Continue to Complete Details & Requirements →
                </button>
              </form>

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-[11px] text-[#0B1F4B] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span>📋</span>
                  <span>Full Onboarding & Requirement Profile</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Upon signing in, you will be guided to set your exact procurement categories, technical specs, budget, stage, and statutory business credentials.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

