import { useState, useMemo, useEffect } from "react"
import { NavProps, Screen } from "../App"
import { useProcurement } from "../context/ProcurementContext"
import {
  MPI_CATALOG,
  CATALOG_CATEGORIES,
  CatalogCategory,
  CatalogService,
  searchCatalog,
} from "../lib/mpiCatalog"
import {
  Icons,
  MPIButton,
  MPIVerifiedBadge,
} from "../components/design-system/MPIDesignSystem"
import { hasLiveAIConfigured, type ExtractedProcurementSpecs } from "../services/aiService"
import AuthModal from "../components/auth/AuthModal"
import LanguageTranslatorButton from "../components/navigation/LanguageTranslatorButton"

export function formatScopeDisplay(category: CatalogCategory, qty: number): string {
  if (category === "Packaging & Printing") {
    return `${qty.toLocaleString("en-IN")} units`
  }
  if (category === "Prototyping & Product Development") {
    return qty > 1 ? `${qty.toLocaleString("en-IN")} prototype units` : "1 Prototype Unit"
  }
  if (category === "IT & Digital Services") {
    return qty > 1 ? `${qty} Tech Modules` : "1 Project Scope"
  }
  if (category === "Compliance & Legal Support") {
    return qty > 1 ? `${qty} Filings / Audits` : "1 Audit Mandate"
  }
  if (category === "Business & Finance Services") {
    return qty > 1 ? `${qty} Advisory Reports` : "1 Advisory Mandate"
  }
  if (category === "Marketing & Sales Support") {
    return qty > 1 ? `${qty} Campaigns` : "1 GTM Campaign"
  }
  if (category === "Specialized Startup Support") {
    return qty > 1 ? `${qty} Scale Programs` : "1 Startup Mandate"
  }
  return qty > 0 ? `${qty.toLocaleString("en-IN")} units` : "1 Mandate"
}

export default function Home({ navigate }: NavProps) {
  const {
    requirementText,
    setRequirementText,
    setSelectedCategory,
    setQuantity,
    setTargetBudget,
    quantity,
    targetBudget,
    aiConfidenceScore,
    runAIExtraction,
    publicStartupSuppliers,
    isExtractingSpecs,
    specifications,
    selectedCategory,
    schemes,
  } = useProcurement()

  // Auth modal state for Login and Sign In
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: "login" | "signin" }>({
    open: false,
    mode: "login",
  })

  const openSignInModal = (role: "startup" | "msme" | "admin" = "startup") => {
    void role
    setAuthModal({ open: true, mode: "signin" })
  }

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Command palette & search modal
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState("")

  // AI Intake prompt simulator state
  const [activePromptIndex, setActivePromptIndex] = useState(0)
  const [hasSimulatedExtraction, setHasSimulatedExtraction] = useState(false)
  const [extractionResult, setExtractionResult] = useState<ExtractedProcurementSpecs | null>(null)

  // Voice Assistant states
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [voiceStatusText, setVoiceStatusText] = useState("")
  const [audioLevel, setAudioLevel] = useState(0)

  // AI writing style & citation toggles
  const [selectedWritingStyle, setSelectedWritingStyle] = useState<"Default" | "Institutional" | "Technical" | "Lean Startup">("Institutional")
  const [showStyleDropdown, setShowStyleDropdown] = useState(false)
  const [enableCitation, setEnableCitation] = useState(true)


  // Marketplace explorer state
  const [selectedMarketCategory, setSelectedMarketCategory] =
    useState<string>("All")
  const [marketSearchQuery, setMarketSearchQuery] = useState("")

  // Product detail modal state
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<CatalogService | null>(null)

  // Government Schemes Calculator state
  const [calcBudget, setCalcBudget] = useState<number>(150000)
  const [calcCategory, setCalcCategory] = useState<CatalogCategory>(
    "Packaging & Printing",
  )
  const [showSchemeDetailModal, setShowSchemeDetailModal] =
    useState<boolean>(false)
  // Interactive 5-Step Journey active index
  const [activeJourneyStep, setActiveJourneyStep] = useState(0)

  // Platform Workspace 3D Flip Card state
  const [isStartupCardFlipped, setIsStartupCardFlipped] = useState(false)
  const [isMsmeCardFlipped, setIsMsmeCardFlipped] = useState(false)

  // MPI Catalogue expandable section state
  const [isCatalogExpanded, setIsCatalogExpanded] = useState(false)

  // Sample prompt chips
  const samplePrompts = [
    {
      label: "Rigid Skincare Boxes",
      text: "Need 500 custom rigid printed boxes for our D2C organic skincare launch by next month, budget under ₹80k with EVA foam inserts",
      cat: "Packaging & Printing" as CatalogCategory,
      qty: 500,
      budget: 75000,
    },
    {
      label: "Rapid SLS 3D Prototyping",
      text: "Require 50 units SLS 3D printed nylon PA12 enclosure prototypes with CNC milled aluminium plates within 10 days, budget ₹65k",
      cat: "Prototyping & Product Development" as CatalogCategory,
      qty: 50,
      budget: 65000,
    },
    {
      label: "Startup Scale & Incubation",
      text: "Need specialized startup support for DPIIT seed fund compliance, MSME incubation readiness, and go-to-market mentorship, budget ₹50k",
      cat: "Specialized Startup Support" as CatalogCategory,
      qty: 1,
      budget: 50000,
    },
    {
      label: "Next.js & Cloud ERP Setup",
      text: "Need an agency to set up custom ERP inventory workflow and Supabase database integration for 100 users, budget ₹1.8 Lakh",
      cat: "IT & Digital Services" as CatalogCategory,
      qty: 1,
      budget: 180000,
    },
  ]

  // Keyboard shortcut for Command Palette (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setShowSearchModal((prev) => !prev)
      }
      if (e.key === "Escape") {
        setShowSearchModal(false)
        setSelectedProductDetail(null)
        setShowSchemeDetailModal(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Filter catalog items
  const filteredCatalog = useMemo(() => {
    return searchCatalog(MPI_CATALOG, marketSearchQuery, selectedMarketCategory)
  }, [marketSearchQuery, selectedMarketCategory])

  // Command palette results
  const paletteResults = useMemo(() => {
    if (!paletteQuery.trim()) {
      return MPI_CATALOG.slice(0, 6)
    }
    return searchCatalog(MPI_CATALOG, paletteQuery, "All").slice(0, 8)
  }, [paletteQuery])

  // Handle AI spec generation in hero
  const handleGenerateSpecs = async (textToExtract?: string) => {
    const text = typeof textToExtract === "string" ? textToExtract : requirementText
    const res = await runAIExtraction(text)
    setExtractionResult(res)
    setHasSimulatedExtraction(true)
  }

  // Voice Assistant: Web Speech API Recognition + Interactive Fallback
  const toggleVoiceRecording = () => {
    if (isVoiceRecording) {
      setIsVoiceRecording(false)
      setVoiceStatusText("Voice recording stopped.")
      return
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      // Graceful fallback simulation if browser doesn't have webkitSpeechRecognition
      setIsVoiceRecording(true)
      setVoiceStatusText("Listening to your voice requirement...")
      const sampleVoiceText =
        "Require 2000 units food-grade biodegradable paper pouches with zip lock for specialty tea packaging, delivery in 14 days, budget 45000"
      
      let charIdx = 0
      const interval = setInterval(() => {
        charIdx += 8
        const currentSlice = sampleVoiceText.slice(0, charIdx)
        setRequirementText(currentSlice)
        setAudioLevel(Math.random() * 80 + 20)
        if (charIdx >= sampleVoiceText.length) {
          clearInterval(interval)
          setIsVoiceRecording(false)
          setVoiceStatusText("Voice requirement captured successfully!")
          setAudioLevel(0)
          handleGenerateSpecs(sampleVoiceText)
        }
      }, 150)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = "en-IN"

      recognition.onstart = () => {
        setIsVoiceRecording(true)
        setVoiceStatusText("Listening... Speak your procurement requirement now.")
      }

      recognition.onresult = (event: any) => {
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          setRequirementText(transcript)
          setVoiceTranscript(transcript)
        }
      }

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error)
        setIsVoiceRecording(false)
        setVoiceStatusText(`Voice input: ${event.error || "Unable to access microphone"}`)
      }

      recognition.onend = () => {
        setIsVoiceRecording(false)
        setVoiceStatusText("Voice captured. Analyzing requirement...")
        if (requirementText.trim().length > 5) {
          handleGenerateSpecs()
        }
      }

      recognition.start()
    } catch (e) {
      console.error("Speech recognition could not be started", e)
      setIsVoiceRecording(false)
      setVoiceStatusText("Could not access microphone.")
    }
  }

  // Select sample prompt chip
  const handleSelectPromptChip = (index: number) => {
    setActivePromptIndex(index)
    const item = samplePrompts[index]
    setRequirementText(item.text)
    setSelectedCategory(item.cat)
    setQuantity(item.qty)
    setTargetBudget(item.budget)
    setExtractionResult(null)
    setHasSimulatedExtraction(false)
  }

  // Launch into Startup Workspace
  const handleContinueToStartupWorkspace = () => {
    navigate("startup.procurement")
  }

  // Calculate potential scheme assistance
  const calculatedSchemeBenefit = useMemo(() => {
    let rate = 0.6 // default 60%
    if (calcCategory === "Compliance & Legal Support") rate = 0.8 // ZED up to 80%
    if (calcCategory === "Prototyping & Product Development") rate = 0.7
    const est = Math.round(calcBudget * rate)
    return {
      rate: Math.round(rate * 100),
      amount: Math.min(est, 500000),
      netCost: Math.max(calcBudget - est, 0),
    }
  }, [calcBudget, calcCategory])

  const journeySteps = [
    {
      num: "01",
      title: "Describe & Specify",
      subtitle: "Plain Language → Institutional RFQ",
      desc: "Type your sourcing requirement in plain English. MPI AI instantly extracts manufacturing tolerances, material grades, quantities, and delivery constraints into a structured, institutional-grade RFQ specification.",
      metric: "99.2% Spec Completeness",
      highlights: ["Natural language intake", "Auto-extracted BOMs & tolerances", "< 60 seconds to initiate"],
      icon: "📝",
      gradient: "from-[#0B1F4B] to-[#162D63]",
      accentColor: "deepBlue",
    },
    {
      num: "02",
      title: "Match & Compare",
      subtitle: "Verified MSMEs → Transparent Landed Costs",
      desc: "Our engine cross-checks Udyam registration, machine capacity, and ISO certifications to surface vetted suppliers, then delivers itemized quotes with full cost transparency across tooling, fabrication, logistics, GST, and subsidies.",
      metric: "Avg 38% Landed Savings",
      highlights: ["1,240+ audited MSME suppliers", "Reverse margin cost breakdown", "Zero hidden fees"],
      icon: "🔍",
      gradient: "from-[#F97316] to-[#EA580C]",
      accentColor: "orange",
    },
    {
      num: "03",
      title: "Order & Deliver",
      subtitle: "Escrow PO → QC-Gated Milestone Release",
      desc: "Digitally generate Purchase Orders, track 10 order milestones with QC inspection gates, and release payment only upon certified passes. Fully escrow-backed for zero advance risk.",
      metric: "10-Milestone Protection",
      highlights: ["Digital PO generation", "Escrow-backed milestones", "Certified QC gate sign-offs"],
      icon: "🚀",
      gradient: "from-[#0B1F4B] via-[#123B7A] to-[#F97316]",
      accentColor: "deepBlueOrange",
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1220] flex flex-col font-sans selection:bg-[#F97316] selection:text-white">
      {/* ─── 1. TOP ANNOUNCEMENT BANNER ────────────────────────────────────────── */}
      <div className="bg-[#0B1F4B] text-white text-xs py-2 px-4 border-b border-[#123B7A] flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-[#F97316] text-white font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
              MSME Bharat
            </span>
            <span className="text-slate-200 hidden sm:inline">
              Empowering Indian Startups with DPIIT & MSME Ministry Verified
              Sourcing Hub.
            </span>
            <span className="text-slate-200 sm:hidden">
              MPI Procurement Support for Startups.
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <button
              onClick={() => setShowSearchModal(true)}
              className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Icons.Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Quick Search</span>
              <kbd className="hidden md:inline bg-[#123B7A] px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700">
                ⌘K
              </kbd>
            </button>
            <button
              onClick={() => navigate("login.admin")}
              className="hover:text-white transition-colors cursor-pointer text-[11px]"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN NAVIGATION ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("home")}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 14L8 8L12 12L16 6L20 14" />
                  <circle cx="12" cy="4" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span
                  className="font-extrabold text-2xl tracking-tight text-[#0B1F4B] leading-none"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  MPI
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1 hidden sm:inline">
                  Market Procurement Intelligence
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700">
            <a
              href="#marketplace"
              onClick={() => setIsCatalogExpanded(true)}
              className="hover:text-[#0B1F4B] transition-colors"
            >
              MPI Catalogue
            </a>
            <a
              href="#government-schemes"
              className="hover:text-[#0B1F4B] transition-colors"
            >
              Government Schemes
            </a>
            <button
              onClick={() => navigate("analytics.detail.ai-insights")}
              className="hover:text-[#0B1F4B] transition-colors text-slate-600 cursor-pointer"
            >
              Analytics Studio
            </button>
          </div>

          {/* CTA Buttons - Language Translator, Login & Sign In (Google Auth) & Start Procurement */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language Translator Button (Matching User's Reference: Globe + EN) */}
            <LanguageTranslatorButton variant="default" />

            <button
              onClick={() => setAuthModal({ open: true, mode: "login" })}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0B1F4B] hover:bg-slate-100 transition-all cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => setAuthModal({ open: true, mode: "signin" })}
              className="group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0B1F4B] bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
              <span>Sign In</span>
            </button>
            <button
              onClick={() => navigate("startup.procurement")}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-linear-to-r from-[#0B1F4B] via-[#0F2D6B] to-[#123B7A] hover:from-[#0F2D6B] hover:to-[#174691] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer border border-blue-800/40"
            >
              <Icons.Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Start Procurement</span>
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageTranslatorButton variant="default" />
            <button
              onClick={() => setAuthModal({ open: true, mode: "login" })}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => setAuthModal({ open: true, mode: "signin" })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/80 text-xs font-bold text-[#0B1F4B] cursor-pointer"
            >
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
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
              <span>Sign In</span>
            </button>
            <button
              onClick={() => navigate("startup.procurement")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0B1F4B]/88 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)] hover:bg-[#123B7A]/94 hover:border-white/35 transition-all cursor-pointer"
            >
              <Icons.Sparkles className="w-3 h-3 text-amber-300" />
              <span>Start</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <Icons.Close className="w-5 h-5" />
              ) : (
                <Icons.Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 animate-fade-in shadow-lg">
            <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-800">
              <a
                href="#marketplace"
                onClick={() => {
                  setIsCatalogExpanded(true)
                  setMobileMenuOpen(false)
                }}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 flex items-center justify-between"
              >
                <span>MPI Catalogue</span>
                <Icons.ArrowRight className="w-4 h-4 text-slate-400" />
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate("government-schemes.match")
                }}
                className="py-2 px-3 text-left rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>📜</span>
                  <span>Government Schemes</span>
                </div>
                <Icons.ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate("analytics.detail.ai-insights")
                }}
                className="py-2 px-3 text-left rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>📊</span>
                  <span>Analytics Studio</span>
                </div>
                <Icons.ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate("login.admin")
                }}
                className="py-2 px-3 text-left rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Admin Control Center</span>
                </div>
                <Icons.ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAuthModal({ open: true, mode: "login" })
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-center"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAuthModal({ open: true, mode: "signin" })
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50/80 text-xs font-bold text-[#0B1F4B] hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
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
                  <span>Sign In</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate("startup.procurement")
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-linear-to-r from-[#0B1F4B] to-[#123B7A] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Icons.Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Start Procurement</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── 3. HERO SECTION WITH INTERACTIVE AI INTAKE SIMULATOR ──────────────── */}
      <section className="relative overflow-hidden pt-8 pb-14 lg:pt-12 lg:pb-20 bg-linear-to-b from-white via-slate-50 to-[#F7F9FC] border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Block: Value Proposition (Centered above AI Engine) */}
          <div className="max-w-4xl mx-auto text-center space-y-5 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0B1F4B]">
              <Icons.Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Next-Gen B2B Sourcing Infrastructure</span>
            </div>

            <h1
              className="text-xl sm:text-2xl md:text-3xl lg:text-[34px] xl:text-[38px] font-extrabold text-[#0B1F4B] tracking-tight leading-[1.25]"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              <span className="block whitespace-nowrap">
                Your MPI Procurement Support from
              </span>
              <span className="block whitespace-nowrap mt-1">
                <span className="text-[#F97316]">Plain Requirement</span> to Verified MSME Delivery.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Empowering Indian startups to source packaging, prototyping,
              compliance, digital, and specialized services with
              institutional-grade RFQ generation, real-time quote comparison,
              and 100% verified MSME suppliers.
            </p>

            {/* Trust Badges Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                <Icons.ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Udyam Registered MSMEs
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                <Icons.Award className="w-3.5 h-3.5 text-amber-600" />
                ZED & ISO Certified
              </span>
              <span className="inline-flex items-center gap-1.5 bg-blue-50/80 border border-blue-200/80 text-[#0B1F4B] px-3 py-1.5 rounded-lg font-bold">
                <Icons.Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                Reverse Margin Verified
              </span>
            </div>

            {/* Direct Workspace Action Links */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-1">
              <MPIButton
                variant="primary"
                size="lg"
                onClick={() => navigate("startup.procurement")}
                icon={<Icons.ArrowRight className="w-4 h-4" />}
              >
                Launch MPI Procurement Support
              </MPIButton>
              <MPIButton
                variant="outline"
                size="lg"
                onClick={() => navigate("register.msme")}
              >
                Register as MSME Supplier
              </MPIButton>
            </div>
          </div>

          {/* Bottom Block: Next-Gen Conversational AI Engine & Voice Assistant (Horizontal Layout) */}
          <div className="mt-10 max-w-5xl mx-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-[0_20px_50px_rgba(11,31,75,0.08)] relative overflow-hidden">
              {/* 1. Header with Glowing MPI Brand Sphere Orb */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-4 text-left">
                  {/* MPI Glowing Sphere Orb */}
                  <div className="relative group cursor-pointer shrink-0" onClick={toggleVoiceRecording}>
                    <div className="w-13 h-13 rounded-full bg-linear-to-tr from-[#0B1F4B] via-[#123B7A] to-[#F97316] shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center">
                        <Icons.Sparkles className="w-4.5 h-4.5 text-white" />
                      </div>
                    </div>
                    {isVoiceRecording && (
                      <span className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping opacity-75 pointer-events-none" />
                    )}
                  </div>
                  <div>
                    <h3
                      className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
                      style={{ fontFamily: "Plus Jakarta Sans" }}
                    >
                      Good Afternoon, Founder
                    </h3>
                    <div
                      className="text-sm sm:text-base font-bold text-slate-600 mt-0.5"
                      style={{ fontFamily: "Plus Jakarta Sans" }}
                    >
                      What's on <span className="bg-linear-to-r from-[#0B1F4B] via-[#123B7A] to-[#F97316] bg-clip-text text-transparent">your procurement mind?</span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Interactive RFQ Engine • Voice & Specs</span>
                </div>
              </div>

              {/* 2. Main Conversational AI Input Box */}
              <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xs focus-within:border-[#F97316] focus-within:ring-4 focus-within:ring-orange-100/70 transition-all">
                {/* Input area */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <Icons.Sparkles className="w-4 h-4 text-[#F97316] shrink-0 mt-1" />
                    <textarea
                      rows={2}
                      value={requirementText}
                      onChange={(e) => {
                        setRequirementText(e.target.value)
                        setHasSimulatedExtraction(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && requirementText.trim()) {
                          e.preventDefault()
                          handleGenerateSpecs()
                        }
                      }}
                      placeholder="Ask AI a question or describe your procurement requirement (quantity, material, tolerances, target budget)..."
                      className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent border-0 outline-none resize-none font-medium leading-relaxed"
                    />
                  </div>
                </div>

                {/* Voice recording live indicator strip if active */}
                {isVoiceRecording && (
                  <div className="mx-4 mb-2 p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 flex items-center justify-between text-xs animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="font-semibold">Recording voice requirement... Speak clearly.</span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className="px-2.5 py-1 rounded-md bg-[#F97316] text-white font-bold hover:bg-orange-600 text-[11px] cursor-pointer"
                    >
                      Stop & Send
                    </button>
                  </div>
                )}

                {/* Bottom Controls Bar: Attach, Writing Styles, Voice Mic, Citation, Send Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50/60 rounded-b-2xl border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {/* Attach button */}
                    <button
                      type="button"
                      onClick={() => navigate("startup.procurement")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      title="Attach CAD drawings, die-lines, or technical RFQ documents"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span>Attach</span>
                    </button>

                    {/* Writing Styles Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowStyleDropdown((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      >
                        <span>{selectedWritingStyle}</span>
                        <span className="text-[10px] text-slate-400">▼</span>
                      </button>
                      {showStyleDropdown && (
                        <div className="absolute left-0 bottom-full mb-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 animate-fade-in text-xs font-medium">
                          {(["Institutional", "Technical", "Lean Startup", "Default"] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                setSelectedWritingStyle(st)
                                setShowStyleDropdown(false)
                              }}
                              className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 cursor-pointer ${
                                selectedWritingStyle === st ? "text-[#F97316] font-bold bg-orange-50" : "text-slate-700"
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interactive Voice Assistant Mic Button */}
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        isVoiceRecording
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-white border border-slate-200 text-slate-700 hover:border-orange-400 hover:text-[#F97316]"
                      }`}
                      title="Record requirement via Voice Assistant"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span>{isVoiceRecording ? "Listening..." : "Voice"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Citation / Schemes Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => setEnableCitation((prev) => !prev)}
                      className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-medium"
                    >
                      <div
                        className={`w-8 h-4.5 rounded-full transition-colors relative flex items-center px-0.5 ${
                          enableCitation ? "bg-[#0B1F4B]" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                            enableCitation ? "translate-x-3.5" : "translate-x-0"
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600">Citation</span>
                    </button>

                    {/* Submit / Send Arrow Button */}
                    <button
                      type="button"
                      disabled={isExtractingSpecs || !requirementText.trim()}
                      onClick={() => handleGenerateSpecs()}
                      className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-[#F97316] disabled:bg-slate-300 text-white flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs"
                      title="Send requirement to AI Spec Engine"
                    >
                      {isExtractingSpecs ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Icons.ArrowRight className="w-4 h-4 -rotate-90" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. "GET STARTED WITH AN EXAMPLE BELOW" 4 CARDS (Horizontal 4-column layout) */}
              <div className="mt-6">
                <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-3 text-left">
                  Get started with an example below:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      title: "Rigid Skincare Boxes",
                      category: "Packaging & Printing",
                      text: "Need 500 custom rigid printed boxes for our D2C organic skincare launch by next month, budget under ₹80k with EVA foam inserts",
                      icon: "📦",
                    },
                    {
                      title: "Rapid SLS Prototyping",
                      category: "Prototyping & Product",
                      text: "Require 50 units SLS 3D printed nylon PA12 enclosure prototypes with CNC milled aluminium plates within 10 days, budget ₹65k",
                      icon: "⚙️",
                    },
                    {
                      title: "Cloud ERP & Supabase",
                      category: "IT & Digital Services",
                      text: "Need an agency to set up custom ERP inventory workflow and Supabase database integration for 100 users, budget ₹1.8 Lakh",
                      icon: "💻",
                    },
                    {
                      title: "DPIIT Seed Compliance",
                      category: "Specialized Startup",
                      text: "Need specialized startup support for DPIIT seed fund compliance, MSME incubation readiness, and go-to-market mentorship, budget ₹50k",
                      icon: "📜",
                    },
                  ].map((example) => (
                    <button
                      key={example.title}
                      type="button"
                      onClick={() => {
                        setRequirementText(example.text)
                        handleGenerateSpecs(example.text)
                      }}
                      className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/90 hover:border-orange-300 hover:shadow-sm text-left transition-all cursor-pointer flex flex-col justify-between group h-28"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{example.icon}</span>
                          <span className="text-[10px] text-slate-400 font-semibold group-hover:text-[#F97316]">Use →</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-[#F97316]">
                          {example.title}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate font-medium">
                        {example.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Live Extraction Output Preview (if generated) */}
              {hasSimulatedExtraction && extractionResult && (
                <div className="mt-6 pt-5 border-t border-slate-200 space-y-3 animate-fade-in bg-slate-50/90 p-5 rounded-2xl text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0B1F4B] flex items-center gap-1.5">
                      <Icons.Check className="w-4 h-4 text-emerald-600" />
                      AI Extraction Succeeded ({aiConfidenceScore || 96}% Confidence)
                    </span>
                    <span className="text-[11px] bg-orange-100 text-orange-900 font-semibold px-2.5 py-0.5 rounded-full">
                      {selectedCategory}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Category</div>
                      <div className="font-semibold text-slate-800 truncate" title={selectedCategory}>
                        {selectedCategory}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Qty / Scope</div>
                      <div className="font-semibold text-slate-800 truncate" title={formatScopeDisplay(selectedCategory, quantity)}>
                        {formatScopeDisplay(selectedCategory, quantity)}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Est. Savings</div>
                      <div className="font-semibold text-emerald-600 truncate">
                        ₹{Math.max(1500, Math.round(targetBudget * 0.24)).toLocaleString("en-IN")} (24%)
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      Auto-Extracted Technical Specs:
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700 text-[11px]">
                      {specifications.slice(0, 3).map((spec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#F97316] font-bold">•</span>
                          <span className="truncate">{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500">
                      Structured RFQ ready for verified MSME bidding.
                    </span>
                    <MPIButton
                      variant="primary"
                      size="sm"
                      onClick={handleContinueToStartupWorkspace}
                      icon={<Icons.ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Refine in Workspace
                    </MPIButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── PROMINENT GOVERNMENT SCHEMES CALLOUT (Under MPI AI Engine) ──────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="bg-linear-to-r from-[#0B1F4B] to-[#123B7A] rounded-2xl p-6 text-white shadow-xl border border-blue-400/20 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#F97316] text-white px-2.5 py-0.5 rounded-full">
                  Government Schemes Intelligence
                </span>
                <span className="text-xs text-[#FFF7D6] font-semibold">
                  All Government Schemes · Up to 80% Reimbursement
                </span>
              </div>
              <h3
                className="text-lg sm:text-xl font-extrabold text-white"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Find Central Government Schemes Fitted to Your Business
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Unlock statutory subsidies across DC-MSME, DPIIT, MeitY, BIRAC,
                and SIDBI for packaging tooling, 3D prototyping, quality
                testing, and working capital.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <MPIButton
                variant="primary"
                size="md"
                onClick={() => navigate("government-schemes.match" as Screen)}
              >
                Find Schemes for My Business →
              </MPIButton>
              <button
                onClick={() => navigate("government-schemes.browse" as Screen)}
                className="text-xs font-bold text-white hover:text-[#FFF7D6] underline underline-offset-4 cursor-pointer px-2"
              >
                Browse All Schemes
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. ECOSYSTEM METRICS STRIP ────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B] tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                ₹48.6 Cr+
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Sourced Volume
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                Across 18 States
              </div>
            </div>

            <div className="space-y-1">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B] tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                1,240+
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Verified MSME Suppliers
              </div>
              <div className="text-[11px] text-blue-600 font-medium">
                100% Udyam & GST Audited
              </div>
            </div>

            <div className="space-y-1">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-[#F97316] tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                38.4%
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Average Landed Savings
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Via Reverse Margin AI
              </div>
            </div>

            <div className="space-y-1">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B] tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                99.4%
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                On-Time Delivery SLA
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">
                Escrow-backed Milestones
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DUAL PLATFORM WORKSPACE GATEWAYS (3D FLIPPING CARDS) ──────────────── */}
      <section className="py-20 bg-gradient-to-b from-[#0B1F4B] via-[#0E275E] to-[#0B1F4B] text-white relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-white/10 text-orange-400 border border-white/15 backdrop-blur-md mb-3">
              ⚡ Tailored Operating Systems
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Choose Your Platform Workspace
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3">
              Whether you are an emerging startup seeking manufacturing or an established MSME seeking high-intent purchase orders. Hover or click to flip & inspect modules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* 1. STARTUP GATEWAY FLIPPING CARD */}
            <div className="perspective-1000 h-125">
              <div
                className={`relative w-full h-full duration-700 transform-style-preserve-3d transition-transform ${
                  isStartupCardFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* FRONT FACE */}
                <div
                  className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-slate-900/90 backdrop-blur-xl border-2 border-blue-400/40 p-8 sm:p-9 flex flex-col justify-between shadow-[0_12px_40px_rgba(11,31,75,0.4)] ${
                    isStartupCardFlipped ? "pointer-events-none" : "pointer-events-auto"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold tracking-wide">
                        <span>For Buyers & Founders</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsStartupCardFlipped(true)}
                        className="text-xs text-blue-300 hover:text-white bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1 rounded-full border border-blue-400/30 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Flip to see features"
                      >
                        <span>🔄 Flip to Deep Dive</span>
                      </button>
                    </div>

                    <h3
                      className="text-2xl font-black text-white mb-3"
                      style={{ fontFamily: "Plus Jakarta Sans" }}
                    >
                      Startup Procurement Command Center
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6">
                      Intake plain requirements, auto-generate engineering RFQs, compare verified bids side-by-side, unlock Government Schemes, and manage purchase orders.
                    </p>

                    <ul className="space-y-3 text-xs sm:text-sm text-slate-200 font-medium">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                          <Icons.Check className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span>AI specification extraction & RFQ generator</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                          <Icons.Check className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span>Multi-quote landed cost comparison matrix</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
                          <Icons.Check className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span>10-milestone order tracking with inspection gates</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => navigate("startup.home")}
                      className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Enter as Startup</span>
                      <Icons.ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => openSignInModal("startup")}
                        className="text-xs text-blue-300 hover:text-white font-semibold transition-colors cursor-pointer"
                      >
                        Need an account? Register as Startup →
                      </button>
                    </div>
                  </div>
                </div>

                {/* BACK FACE */}
                <div
                  className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-linear-to-br from-[#0c1f4a] via-[#102b66] to-[#14327a] border-2 border-blue-400 p-8 sm:p-9 flex flex-col justify-between shadow-2xl text-white ${
                    isStartupCardFlipped ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                        ⚡ Built-in Capabilities
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsStartupCardFlipped(false)}
                        className="text-xs text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>🔄 Flip Back</span>
                      </button>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-4">
                      Startup Operating Engine
                    </h4>

                    <div className="space-y-3 text-xs sm:text-[13px] text-blue-100 leading-relaxed">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="font-bold text-white mb-0.5">Reverse Margin Intelligence</div>
                        <div>Reverse engineering formulas breakdown raw material cost vs tooling vs margins.</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="font-bold text-white mb-0.5">DPIIT & ZED Subsidies</div>
                        <div>Instant eligibility mapping across 7 Central & State incentive schemes.</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="font-bold text-white mb-0.5">Escrow-backed Milestones</div>
                        <div>Zero advance risk with staged milestone payments and QC gate sign-offs.</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate("startup.home")}
                      className="w-full py-3 px-5 rounded-xl font-bold text-xs bg-white text-[#0B1F4B] hover:bg-slate-100 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Launch Startup Workspace Now</span>
                      <Icons.ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsStartupCardFlipped(false)}
                        className="text-xs text-blue-300 hover:text-white transition-colors cursor-pointer"
                      >
                        ← Return to Overview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. MSME GATEWAY FLIPPING CARD */}
            <div className="perspective-1000 h-125">
              <div
                className={`relative w-full h-full duration-700 transform-style-preserve-3d transition-transform ${
                  isMsmeCardFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* FRONT FACE */}
                <div
                  className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-slate-900/90 backdrop-blur-xl border-2 border-orange-400/40 p-8 sm:p-9 flex flex-col justify-between shadow-[0_12px_40px_rgba(249,115,22,0.25)] ${
                    isMsmeCardFlipped ? "pointer-events-none" : "pointer-events-auto"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30 text-xs font-bold tracking-wide">
                        <span>For Suppliers & Manufacturers</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMsmeCardFlipped(true)}
                        className="text-xs text-orange-300 hover:text-white bg-orange-500/20 hover:bg-orange-500/30 px-3 py-1 rounded-full border border-orange-400/30 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Flip to see features"
                      >
                        <span>🔄 Flip to Deep Dive</span>
                      </button>
                    </div>

                    <h3
                      className="text-2xl font-black text-white mb-3"
                      style={{ fontFamily: "Plus Jakarta Sans" }}
                    >
                      MSME Business Command Center
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6">
                      Complete statutory verification (Udyam, GST, ISO), list machine capacities across 7 categories, and quote directly on verified startup RFQs.
                    </p>

                    <ul className="space-y-3 text-xs sm:text-sm text-slate-200 font-medium">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-400/40 flex items-center justify-center shrink-0">
                          <Icons.Check className="w-3.5 h-3.5 text-[#F97316]" />
                        </div>
                        <span>Real-time RFQ opportunities feed with match scores</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-400/40 flex items-center justify-center shrink-0">
                          <Icons.Check className="w-3.5 h-3.5 text-[#F97316]" />
                        </div>
                        <span>Itemized quote response builder with tooling costs</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-400/40 flex items-center justify-center shrink-0">
                          <Icons.Check className="w-3.5 h-3.5 text-[#F97316]" />
                        </div>
                        <span>Machinery capacity & statutory certification ledger</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => navigate("msme.home")}
                      className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Enter as MSME Supplier</span>
                      <Icons.ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => openSignInModal("msme")}
                        className="text-xs text-orange-300 hover:text-white font-semibold transition-colors cursor-pointer"
                      >
                        New supplier? Register as MSME →
                      </button>
                    </div>
                  </div>
                </div>

                {/* BACK FACE */}
                <div
                  className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-linear-to-br from-[#4d2105] via-[#6d2f07] to-[#8d3c0a] border-2 border-orange-400 p-8 sm:p-9 flex flex-col justify-between shadow-2xl text-white ${
                    isMsmeCardFlipped ? "pointer-events-auto" : "pointer-events-none"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-300">
                        🏭 Supplier Growth Engine
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsMsmeCardFlipped(false)}
                        className="text-xs text-orange-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>🔄 Flip Back</span>
                      </button>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-4">
                      MSME Digital Factory Tools
                    </h4>

                    <div className="space-y-3 text-xs sm:text-[13px] text-orange-100 leading-relaxed">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="font-bold text-white mb-0.5">High-Intent PO Matching</div>
                        <div>Zero junk inquiries. Only pre-budgeted, spec-validated demand routed to your machines.</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="font-bold text-white mb-0.5">45-Day Payment Guarantee</div>
                        <div>TReDS discounting & MSMED Act Section 15 compliance built into every milestone.</div>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="font-bold text-white mb-0.5">ZED Gold Certification Fast-Track</div>
                        <div>Get audited & verified to win institutional public sector and export orders.</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate("msme.home")}
                      className="w-full py-3 px-5 rounded-xl font-bold text-xs bg-white text-[#F97316] hover:bg-slate-100 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Launch MSME Workspace Now</span>
                      <Icons.ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsMsmeCardFlipped(false)}
                        className="text-xs text-orange-300 hover:text-white transition-colors cursor-pointer"
                      >
                        ← Return to Overview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. HOW IT WORKS (THE 5-STEP HORIZONTAL JOURNEY) ───────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-24 bg-white relative overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#0B1F4B08_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#F97316] bg-orange-50 px-4 py-1.5 rounded-full border border-orange-200 mb-4">
              3-Step Sourcing Engine
            </span>
            <h2
              className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0B1F4B] tracking-tight leading-tight"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              How MPI Solves Sourcing for Indian Startups
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-3 max-w-2xl mx-auto">
              From plain-text requirement to verified MSME delivery in three intelligent steps.
            </p>
          </div>

          {/* 3-Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {journeySteps.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => setActiveJourneyStep(idx)}
                className={`group relative rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer ${
                  activeJourneyStep === idx
                    ? "ring-2 ring-[#0B1F4B]/30 shadow-2xl -translate-y-2 scale-[1.02]"
                    : "shadow-lg hover:shadow-xl hover:-translate-y-1"
                }`}
              >
                {/* Gradient Header Band */}
                <div className={`bg-linear-to-r ${step.gradient} px-7 py-5 text-white relative`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{step.icon}</span>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-widest text-white/70">
                          Step {step.num}
                        </div>
                        <h3
                          className="text-lg font-extrabold text-white leading-tight"
                          style={{ fontFamily: "Plus Jakarta Sans" }}
                        >
                          {step.title}
                        </h3>
                      </div>
                    </div>
                    {/* Step number watermark */}
                    <span className="text-5xl font-black text-white/10 select-none" style={{ fontFamily: "Plus Jakarta Sans" }}>
                      {step.num}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[11px] font-semibold text-white/80 tracking-wide">
                    {step.subtitle}
                  </div>
                </div>

                {/* Card body */}
                <div className="bg-white px-7 py-6 border border-slate-200/80 border-t-0 rounded-b-3xl">
                  <p className="text-[13px] text-slate-600 leading-relaxed mb-5">
                    {step.desc}
                  </p>

                  {/* Highlight chips */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {step.highlights.map((h, hIdx) => (
                      <span
                        key={hIdx}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                          step.accentColor === "deepBlue"
                            ? "bg-blue-50/70 text-[#0B1F4B] border-blue-200/80"
                            : step.accentColor === "orange"
                              ? "bg-orange-50 text-[#C2410C] border-orange-200"
                              : "bg-slate-50 text-[#0B1F4B] border-slate-200/90"
                        }`}
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Metric footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-lg font-bold ${
                        step.accentColor === "deepBlue"
                          ? "text-[#0B1F4B]"
                          : step.accentColor === "orange"
                            ? "text-[#F97316]"
                            : "text-[#0B1F4B]"
                      }`}
                      style={{ fontFamily: "Plus Jakarta Sans" }}
                    >
                      {step.metric}
                    </span>
                    {step.accentColor === "deepBlueOrange" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                        Zero Advance Risk
                      </span>
                    )}
                  </div>
                </div>

                {/* Connector arrow (between cards on desktop) */}
                {idx < journeySteps.length - 1 && (
                  <div className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border-2 border-slate-200 shadow-md items-center justify-center text-slate-400 group-hover:text-[#F97316] group-hover:border-orange-300 transition-colors">
                    <Icons.ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate("startup.procurement")}
              className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full font-bold text-sm bg-[#0B1F4B]/88 backdrop-blur-md border border-white/20 text-white hover:bg-[#123B7A]/94 hover:border-white/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)] transition-all cursor-pointer"
            >
              <span>Try the 3-Step Engine in Workspace</span>
              <Icons.ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── 6. BENTO FEATURE SPOTLIGHT ───────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Institutional Advantage
            </span>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1F4B] tracking-tight mt-3"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Why Startups Need MPI Procurement Support
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Founders lose weeks negotiating with middlemen, miscommunicating
              specs, and forfeiting government schemes. MPI replaces guesswork
              with structured intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1 */}
            <div className="p-6 rounded-2xl bg-[#F7F9FC] border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0B1F4B] flex items-center justify-center font-bold mb-4">
                  <Icons.FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1F4B] mb-2">
                  Institutional Spec Drafting
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Converts vague ideas into precise engineering & manufacturing
                  specifications (tolerances, GSM, drop testing, certifications)
                  so vendors quote accurately the first time.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-blue-700">
                <span>Zero back-and-forth ambiguity</span>
                <Icons.Check className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="p-6 rounded-2xl bg-[#F7F9FC] border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#F97316] flex items-center justify-center font-bold mb-4">
                  <Icons.Coins className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1F4B] mb-2">
                  Transparent Landed Cost Comparison
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Compare bids side-by-side with full breakdown into tooling
                  costs, unit fabrication, QA testing, logistics, and GST,
                  ensuring no surprise post-order fees.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-[#F97316]">
                <span>Supplier #001 vs #002 breakdown</span>
                <Icons.Check className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Bento Card 3 */}
            <div className="p-6 rounded-2xl bg-[#F7F9FC] border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-yellow-100 text-[#D9A400] flex items-center justify-center font-bold mb-4">
                  <Icons.Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0B1F4B] mb-2">
                  Government Schemes Intelligence
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Automatically flags eligible MSME & DPIIT government schemes
                  (ZED Quality Certification, Design Clinic, SISFS Grants)
                  providing up to 80% reimbursement on qualified expenses.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-[#D9A400]">
                <span>Up to ₹5L-₹9L grant matching</span>
                <Icons.Check className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. 7-CATEGORY MARKETPLACE EXPLORER ─────────────────────────────── */}
      <section id="marketplace" className="py-14 sm:py-16 bg-[#F7F9FC] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* MPI Catalogue Trigger: Replaces the 'MPI Verified Catalog' badge */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setIsCatalogExpanded((prev) => !prev)}
              className="group inline-flex items-center gap-2.5 px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest bg-[#0B1F4B] hover:bg-[#123B7A] text-white shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <span>MPI Catalogue</span>
              <span className={`text-[10px] transition-transform duration-200 font-mono ${isCatalogExpanded ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>
          </div>

          {/* Revealed only when MPI Catalogue button is clicked */}
          {isCatalogExpanded ? (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2
                    className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B] tracking-tight"
                    style={{ fontFamily: "Plus Jakarta Sans" }}
                  >
                    7 Approved Procurement Categories
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Explore hundreds of vetted products and manufacturing capabilities ready for quotation.
                  </p>
                </div>

                {/* Search within catalog */}
                <div className="w-full md:w-72 relative">
                  <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={marketSearchQuery}
                    onChange={(e) => setMarketSearchQuery(e.target.value)}
                    placeholder="Search solutions, products..."
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:border-[#0B1F4B] focus:ring-2 focus:ring-blue-100 outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Category Filter Pills (Strictly 7 Categories) */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMarketCategory("All")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedMarketCategory === "All"
                      ? "bg-[#0B1F4B] text-white shadow-2xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  All Categories ({MPI_CATALOG.length})
                </button>
                {CATALOG_CATEGORIES.map((cat) => {
                  const count = MPI_CATALOG.filter((s) => s.category === cat).length
                  const isActive = selectedMarketCategory === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedMarketCategory(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#0B1F4B] text-white shadow-2xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Products Grid: 20% Smaller Visual Footprint, 4–6 per Row on Large Screens */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5">
                {filteredCatalog.slice(0, 18).map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group h-full"
                  >
                    <div>
                      {/* Compact Header Image */}
                      <div className="h-24 bg-linear-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = "none"
                          }}
                        />
                        <div className="absolute top-1.5 left-1.5">
                          <span className="text-[9px] font-bold bg-[#0B1F4B]/90 text-white px-1.5 py-0.5 rounded backdrop-blur-xs truncate max-w-30 inline-block">
                            {item.category.split("&")[0]}
                          </span>
                        </div>
                      </div>

                      {/* Card Content with 20% tighter spacing */}
                      <div className="p-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <Icons.Check className="w-2.5 h-2.5" />
                            MPI Verified
                          </span>
                        </div>
                        <h4
                          className="font-bold text-slate-900 text-xs mb-1 line-clamp-1 group-hover:text-[#0B1F4B] transition-colors"
                          title={item.name}
                        >
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Card Action Buttons (View Details & Request Quote) */}
                    <div className="p-2.5 pt-0 border-t border-slate-100 mt-1 flex items-center justify-between gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedProductDetail(item)}
                        className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer truncate py-1"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRequirementText(
                            `Need sourcing quotation for ${item.name} (${item.category}) for our upcoming batch launch.`,
                          )
                          setSelectedCategory(item.category as CatalogCategory)
                          navigate("startup.procurement")
                        }}
                        className="text-[#F97316] hover:text-[#ea580c] font-bold flex items-center gap-0.5 cursor-pointer shrink-0 py-1"
                      >
                        <span>Quote</span>
                        <Icons.ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCatalog.length > 18 && (
                <div className="mt-8 text-center">
                  <MPIButton
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("startup.procurement")}
                  >
                    View All {filteredCatalog.length} Catalog Offerings in Workspace →
                  </MPIButton>
                </div>
              )}
            </div>
          ) : (
            /* Collapsed Teaser Preview Card */
            <div
              onClick={() => setIsCatalogExpanded(true)}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0B1F4B] p-8 text-center cursor-pointer transition-all hover:shadow-md group"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0B1F4B] group-hover:bg-[#0B1F4B] group-hover:text-white flex items-center justify-center mx-auto mb-3 transition-colors shadow-2xs">
                <Icons.FolderCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F4B] mb-1">
                Explore 7 Approved Procurement Categories & 75+ Vetted Offerings
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Packaging, Rapid Prototyping, IT Services, Compliance, Marketing, Business Finance & Specialized Support.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCatalogExpanded(true)
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0B1F4B]/88 backdrop-blur-md border border-white/20 text-white text-xs font-bold hover:bg-[#123B7A]/94 hover:border-white/35 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)] transition-colors cursor-pointer"
              >
                <span>Open MPI Catalogue</span>
                <Icons.ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── 8. GOVERNMENT SCHEMES INTELLIGENCE CENTER & CALCULATOR ─────────────── */}
      <section
        id="government-schemes"
        className="py-16 sm:py-20 bg-white border-t border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D9A400] bg-[#FFF7D6] px-3 py-1 rounded-full border border-yellow-200">
                Government Schemes Intelligence
              </span>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B] tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Government Schemes & MSME Sourcing Grants
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Indian startups sourcing through certified MSMEs are eligible
                for statutory quality and tooling grants up to 80% under ZED,
                Design Clinic, and Startup India Seed Fund (SISFS) schemes.
              </p>

              <div className="space-y-3 pt-2">
                {schemes.slice(0, 2).map((sch) => (
                  <div
                    key={sch.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                      <Icons.Check className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">
                        {sch.title}
                      </div>
                      <div className="text-slate-500">
                        {sch.maxBenefit} ({sch.ministry})
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-wrap gap-2.5">
                <MPIButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("government-schemes.match" as Screen)}
                >
                  Find Schemes for My Business →
                </MPIButton>
                <MPIButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate("government-schemes.browse" as Screen)
                  }
                >
                  Browse All 30 Schemes
                </MPIButton>
              </div>
            </div>

            {/* Interactive Calculator Card */}
            <div className="lg:col-span-7">
              <div className="bg-[#0B1F4B] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#123B7A]">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Icons.Coins className="w-5 h-5 text-[#F97316]" />
                  <span>Government Scheme Assistance Estimator</span>
                </h3>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                      <span>Estimated Procurement Budget:</span>
                      <span className="text-[#FFF7D6] font-bold text-sm">
                        ₹{calcBudget.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20000}
                      max={1000000}
                      step={10000}
                      value={calcBudget}
                      onChange={(e) => setCalcBudget(Number(e.target.value))}
                      className="w-full accent-[#F97316] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>₹20,000</span>
                      <span>₹5,00,000</span>
                      <span>₹10,00,000</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Procurement Category:
                    </label>
                    <select
                      value={calcCategory}
                      onChange={(e) =>
                        setCalcCategory(e.target.value as CatalogCategory)
                      }
                      aria-label="Procurement Category for Scheme"
                      className="w-full bg-[#123B7A] border border-blue-400/30 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#F97316]"
                    >
                      {CATALOG_CATEGORIES.map((cat) => (
                        <option
                          key={cat}
                          value={cat}
                          className="bg-[#0B1F4B] text-white"
                        >
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#123B7A]">
                    <div className="bg-[#123B7A]/60 p-4 rounded-xl border border-blue-400/20">
                      <div className="text-[11px] text-slate-300 uppercase font-bold">
                        Eligible Scheme Benefit ({calculatedSchemeBenefit.rate}
                        %)
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-[#D9A400] mt-1">
                        ₹
                        {calculatedSchemeBenefit.amount.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">
                        Govt reimbursement estimate
                      </div>
                    </div>

                    <div className="bg-[#123B7A]/60 p-4 rounded-xl border border-blue-400/20">
                      <div className="text-[11px] text-slate-300 uppercase font-bold">
                        Effective Net Cost to Startup
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">
                        ₹
                        {calculatedSchemeBenefit.netCost.toLocaleString(
                          "en-IN",
                        )}
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">
                        Direct post-scheme cost
                      </div>
                    </div>
                  </div>

                  <MPIButton
                    variant="ai"
                    fullWidth
                    size="md"
                    onClick={() => {
                      setTargetBudget(calcBudget)
                      setSelectedCategory(calcCategory)
                      navigate("startup.procurement")
                    }}
                    icon={<Icons.Sparkles className="w-4 h-4" />}
                  >
                    Apply Government Schemes in Startup Procurement →
                  </MPIButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ─── 10. ENTERPRISE FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-[#0B1F4B] text-white pt-14 pb-10 border-t border-[#123B7A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#123B7A]">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F97316] text-white flex items-center justify-center font-bold">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M4 14L8 8L12 12L16 6L20 14" />
                  </svg>
                </div>
                <span
                  className="font-extrabold text-xl tracking-tight text-white"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  MPI
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Market Procurement Intelligence — The institutional MPI
                procurement support bridging emerging startups with verified
                Indian MSME manufacturers.
              </p>
              <div className="text-[11px] text-slate-400">
                🇮🇳 Aligned with Make in India & DPIIT Startup India
              </div>
            </div>

            {/* Col 2: Approved Categories */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                7 Solution Catalogs
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {CATALOG_CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => {
                        setSelectedMarketCategory(cat)
                        const el = document.getElementById("marketplace")
                        el?.scrollIntoView({ behavior: "smooth" })
                      }}
                      className="hover:text-white transition-colors cursor-pointer text-left"
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Workspaces */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Platform Portals
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <button
                    onClick={() => navigate("startup.home")}
                    className="hover:text-white transition-colors"
                  >
                    Startup Command Center
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("startup.procurement")}
                    className="hover:text-white transition-colors"
                  >
                    AI RFQ & Spec Builder
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("msme.home")}
                    className="hover:text-white transition-colors"
                  >
                    MSME Supplier Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("admin.home")}
                    className="hover:text-white transition-colors"
                  >
                    Operations & Governance Console
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("analytics.detail.ai-insights")}
                    className="hover:text-white transition-colors"
                  >
                    Analytics Studio
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Statutory & Contact */}
            <div className="space-y-3 text-xs text-slate-300">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                MSME Sourcing Desk
              </div>
              <p className="text-slate-400 leading-relaxed">
                National MSME Verification & Grievance Sourcing Helpline:
              </p>
              <div className="font-semibold text-white">
                procure@mpi-bharat.in
              </div>
              <div className="text-slate-400">
                +91 (80) 4120-9900 (Mon–Fri, 9am–6pm IST)
              </div>
              <div className="pt-2">
                <span className="inline-block bg-[#123B7A] px-2.5 py-1 rounded text-[11px] font-mono text-emerald-400">
                  Udyam Verification Gateway: Operational
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <div>
              © 2026 Market Procurement Intelligence (MPI) Technologies Ltd. All
              rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate("home")}
                className="hover:text-white"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => navigate("home")}
                className="hover:text-white"
              >
                Terms of Procurement
              </button>
              <button
                onClick={() => navigate("home")}
                className="hover:text-white"
              >
                Security & Escrow
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── 11. PRODUCT DETAIL MODAL (VIEW DETAILS) ─────────────────────────── */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="relative h-44 bg-slate-100">
              <img
                src={selectedProductDetail.image}
                alt={selectedProductDetail.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <Icons.Close className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3">
                <span className="bg-[#0B1F4B] text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
                  {selectedProductDetail.category}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-[#0B1F4B]">
                    {selectedProductDetail.name}
                  </h3>
                  <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded">
                    MPI Verified
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProductDetail.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    Typical Lead Time
                  </span>
                  <span className="font-semibold text-slate-800">
                    7–12 Business Days
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    Standard MOQ
                  </span>
                  <span className="font-semibold text-slate-800">
                    100–500 units
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    Verified Suppliers
                  </span>
                  <span className="font-semibold text-emerald-600">
                    18+ Vetted Indian MSMEs
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    Government Schemes
                  </span>
                  <span className="font-semibold text-[#D9A400]">
                    Eligible for ZED Subsidy
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <MPIButton
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedProductDetail(null)}
                >
                  Close
                </MPIButton>
                <MPIButton
                  variant="ai"
                  className="flex-1"
                  onClick={() => {
                    setRequirementText(
                      `Need sourcing quote for ${selectedProductDetail.name} (${selectedProductDetail.category})`,
                    )
                    setSelectedCategory(
                      selectedProductDetail.category as CatalogCategory,
                    )
                    setSelectedProductDetail(null)
                    navigate("startup.procurement")
                  }}
                  icon={<Icons.ArrowRight className="w-4 h-4" />}
                >
                  Request Quote
                </MPIButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 12. GOVERNMENT SCHEMES DETAIL MODAL ─────────────────────────────── */}
      {showSchemeDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Icons.Award className="w-5 h-5 text-[#D9A400]" />
                <h3 className="font-bold text-slate-900 text-base">
                  Government Schemes & Sourcing Assistance
                </h3>
              </div>
              <button
                onClick={() => setShowSchemeDetailModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <Icons.Close className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {schemes.map((sch) => (
                <div
                  key={sch.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {sch.ministry}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {sch.title}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {sch.subsidyPercentage}% Subsidy
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Eligibility:</strong> {sch.eligibility}
                  </p>
                  <div className="text-xs text-[#D9A400] font-semibold">
                    Maximum Benefit: {sch.maxBenefit}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <MPIButton
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowSchemeDetailModal(false)
                  navigate("startup.procurement")
                }}
              >
                Claim Schemes in Procurement →
              </MPIButton>
            </div>
          </div>
        </div>
      )}

      {/* ─── 13. COMMAND PALETTE MODAL (⌘K) ──────────────────────────────────── */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Icons.Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Search solutions, verified MSMEs, or commands (e.g. cartons, 3D printing)..."
                className="w-full text-sm font-medium outline-none text-slate-900 placeholder:text-slate-400"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <Icons.Close className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Quick Navigation & Workspaces
              </div>
              <div
                onClick={() => {
                  setShowSearchModal(false)
                  navigate("startup.home")
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                    ST
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Startup Procurement Command Center
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Create RFQs, view matched quotes and savings
                    </div>
                  </div>
                </div>
                <Icons.ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => {
                  setShowSearchModal(false)
                  navigate("msme.home")
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-xs">
                    MS
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      MSME Supplier Hub
                    </div>
                    <div className="text-[10px] text-slate-400">
                      View live RFQs, submit quotes, manage machine capacity
                    </div>
                  </div>
                </div>
                <Icons.ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div
                onClick={() => {
                  setShowSearchModal(false)
                  navigate("admin.home")
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
                    AD
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Platform Governance & Admin
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Audit supplier verifications and matching telemetry
                    </div>
                  </div>
                </div>
                <Icons.ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 pt-3">
                7 Solution Offerings
              </div>
              {paletteResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setShowSearchModal(false)
                    setRequirementText(
                      `Need sourcing quote for ${item.name} (${item.category})`,
                    )
                    setSelectedCategory(item.category as CatalogCategory)
                    navigate("startup.procurement")
                  }}
                  className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#0B1F4B]">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.category}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#F97316] group-hover:underline">
                    Source →
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Press{" "}
                <kbd className="bg-white border border-slate-300 px-1 rounded">
                  ESC
                </kbd>{" "}
                to close
              </span>
              <span>MPI Intelligent Marketplace</span>
            </div>
          </div>
        </div>
      )}

      {/* Global Auth Modal for Login and Sign In */}
      <AuthModal
        isOpen={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        navigate={navigate}
      />
    </div>
  )
}
