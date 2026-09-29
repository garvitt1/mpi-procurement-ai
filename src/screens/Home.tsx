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
import AISettingsModal from "../components/AISettingsModal"

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
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false)
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

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Command palette & search modal
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState("")

  // AI Intake prompt simulator state
  const [activePromptIndex, setActivePromptIndex] = useState(0)
  const [hasSimulatedExtraction, setHasSimulatedExtraction] = useState(false)
  const [extractionResult, setExtractionResult] = useState<ExtractedProcurementSpecs | null>(null)

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
  const handleGenerateSpecs = async () => {
    const res = await runAIExtraction(requirementText)
    setExtractionResult(res)
    setHasSimulatedExtraction(true)
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
      title: "Plain-Language Intake",
      desc: "Type your sourcing requirements in plain conversational English without rigid procurement jargon.",
      metric: "< 60 seconds to initiate",
      badge: "Unstructured to Structured",
    },
    {
      num: "02",
      title: "AI Specification Extraction",
      desc: "MPI extracts manufacturing tolerances, material grades, quantities, and delivery constraints automatically.",
      metric: "99.2% Spec Completeness",
      badge: "Institutional RFQ Spec",
    },
    {
      num: "03",
      title: "Supplier Discovery",
      desc: "Our engine cross-checks Udyam registration, active machine capacity, and ISO certifications to match vetted suppliers.",
      metric: "1,240+ Audited Suppliers",
      badge: "100% Statutory Vetted",
    },
    {
      num: "04",
      title: "Landed Cost Quote Matrix",
      desc: "Receive itemized quotes with full transparency into base tooling, unit fabrication, logistics, GST, and Government Schemes.",
      metric: "Avg 38% Landed Savings",
      badge: "Zero Hidden Fees",
    },
    {
      num: "05",
      title: "PO & Escrow Milestone Delivery",
      desc: "Digitally generate Purchase Orders, track 10 order milestones, and release payment only upon certified QC inspection passes.",
      metric: "10-Milestone Protection",
      badge: "Escrow Peace of Mind",
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
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-extrabold text-xl tracking-tight text-[#0B1F4B]"
                    style={{ fontFamily: "Plus Jakarta Sans" }}
                  >
                    MPI
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-[#F97316] px-1.5 py-0.5 rounded-sm">
                    MPI Procurement Support
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest hidden sm:inline">
                  Market Procurement Intelligence
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <a
              href="#marketplace"
              className="hover:text-[#0B1F4B] transition-colors"
            >
              7 Solution Catalogs
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#0B1F4B] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#government-schemes"
              className="hover:text-[#0B1F4B] transition-colors flex items-center gap-1.5"
            >
              <span>Government Schemes</span>
              <span className="bg-[#FFF7D6] text-[#D9A400] text-[10px] px-1.5 py-0.5 rounded font-bold border border-yellow-200">
                Grants & Subsidies
              </span>
            </a>
            <button
              onClick={() => navigate("analytics.detail.ai-insights")}
              className="hover:text-[#0B1F4B] transition-colors text-slate-600 cursor-pointer"
            >
              Analytics Studio
            </button>
          </div>

          {/* CTA Buttons - Login & Registration as instructed */}
          <div className="hidden md:flex items-center gap-2.5">
            <MPIButton
              variant="outline"
              size="sm"
              onClick={() => navigate("login.startup")}
            >
              Login
            </MPIButton>
            <MPIButton
              variant="ghost"
              size="sm"
              onClick={() => navigate("register.startup")}
              className="border border-slate-200 text-[#0B1F4B] hover:bg-blue-50"
            >
              Register as Startup
            </MPIButton>
            <MPIButton
              variant="ghost"
              size="sm"
              onClick={() => navigate("register.msme")}
              className="border border-orange-200 text-[#F97316] hover:bg-orange-50"
            >
              Register as MSME
            </MPIButton>
            <MPIButton
              variant="primary"
              size="sm"
              onClick={() => navigate("startup.procurement")}
              icon={<Icons.Sparkles className="w-3.5 h-3.5 text-orange-300" />}
            >
              Start Procurement
            </MPIButton>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => navigate("login.startup")}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Login
            </button>
            <button
              onClick={() => navigate("startup.procurement")}
              className="px-3 py-1.5 rounded-lg bg-[#0B1F4B] text-white text-xs font-bold"
            >
              Start
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
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 flex items-center justify-between"
              >
                <span>7 Solution Catalogs</span>
                <Icons.ArrowRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 flex items-center justify-between"
              >
                <span>How It Works</span>
                <Icons.ArrowRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#government-schemes"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 rounded-lg hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Government Schemes</span>
                <span className="text-xs bg-[#FFF7D6] text-[#D9A400] px-2 py-0.5 rounded font-bold">
                  Grants & Subsidies
                </span>
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate("analytics.detail.ai-insights")
                }}
                className="py-2 px-3 text-left rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700"
              >
                <span>Analytics Studio</span>
                <Icons.ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <MPIButton
                variant="outline"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate("login.startup")
                }}
              >
                Login to Account
              </MPIButton>
              <div className="grid grid-cols-2 gap-2">
                <MPIButton
                  variant="ghost"
                  size="sm"
                  className="border border-slate-200"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate("register.startup")
                  }}
                >
                  Register as Startup
                </MPIButton>
                <MPIButton
                  variant="ghost"
                  size="sm"
                  className="border border-orange-200 text-[#F97316]"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigate("register.msme")
                  }}
                >
                  Register as MSME
                </MPIButton>
              </div>
              <MPIButton
                variant="primary"
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigate("startup.procurement")
                }}
              >
                Start Procurement (Startup)
              </MPIButton>
            </div>
          </div>
        )}
      </nav>

      {/* ─── 3. HERO SECTION WITH INTERACTIVE AI INTAKE SIMULATOR ──────────────── */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 bg-linear-to-b from-white via-slate-50 to-[#F7F9FC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0B1F4B]">
                <Icons.Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Next-Gen B2B Sourcing Infrastructure</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B1F4B] tracking-tight leading-[1.15]"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Your MPI Procurement Support.{" "}
                <span className="text-[#F97316]">From Plain Requirement</span>{" "}
                to Verified MSME Delivery.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Empowering Indian startups to source packaging, prototyping,
                compliance, digital, and specialized services with
                institutional-grade RFQ generation, real-time quote comparison,
                and 100% verified MSME suppliers.
              </p>

              {/* Trust Badges Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-700">
                <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                  <Icons.ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Udyam Registered MSMEs
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                  <Icons.Award className="w-3.5 h-3.5 text-amber-600" />
                  ZED & ISO Certified
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                  <Icons.Coins className="w-3.5 h-3.5 text-emerald-600" />
                  Avg 38% Cost Reduction
                </span>
              </div>

              {/* Direct Workspace Action Links */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
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

            {/* Right Column: Interactive AI Intake Simulator Card */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl border-2 border-[#0B1F4B]/10 p-5 sm:p-6 shadow-xl relative overflow-hidden">
                {/* Header ribbon */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      MPI AI Spec Engine
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAISettingsOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-[#0B1F4B] border border-slate-200 transition-colors cursor-pointer"
                    title="Configure Live MPI AI Engine"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hasLiveAIConfigured()
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                    <span>
                      {hasLiveAIConfigured()
                        ? "Live MPI AI Active"
                        : "MPI AI Settings"}
                    </span>
                  </button>
                </div>

                {/* Sample Prompt Chips */}
                <div className="mt-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Try a real startup requirement:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {samplePrompts.map((chip, idx) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleSelectPromptChip(idx)}
                        className={`text-left text-xs p-2.5 rounded-lg border transition-all cursor-pointer ${
                          activePromptIndex === idx
                            ? "bg-blue-50/80 border-[#0B1F4B] text-[#0B1F4B] font-semibold ring-1 ring-[#0B1F4B]"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="font-bold truncate">{chip.label}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {chip.cat}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Requirement Input Textarea */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-800">
                      Procurement Requirement
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Natural language input
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={requirementText}
                    onChange={(e) => {
                      setRequirementText(e.target.value)
                      setHasSimulatedExtraction(false)
                    }}
                    placeholder="Describe what you need manufactured or sourced (quantity, specifications, materials, budget)..."
                    className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#0B1F4B] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none font-medium"
                  />
                </div>

                {/* Action Button */}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 hidden sm:block">
                    ⚡ Auto-detects 7 verified categories
                  </div>
                  <MPIButton
                    variant="ai"
                    size="md"
                    isLoading={isExtractingSpecs}
                    onClick={handleGenerateSpecs}
                    icon={<Icons.Sparkles className="w-4 h-4" />}
                  >
                    Analyze & Generate Specs
                  </MPIButton>
                </div>

                {/* Live Extraction Output Preview */}
                {hasSimulatedExtraction && (
                  extractionResult?.isGreetingOrInsufficient ? (
                    <div className="mt-5 pt-4 border-t border-slate-200 space-y-4 animate-fade-in bg-blue-50/70 p-4 sm:p-5 rounded-2xl border border-blue-200/80">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0B1F4B] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Icons.Sparkles className="w-5 h-5 text-[#F97316]" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-[#0B1F4B]">
                            Hello! Welcome to MPI Procurement Support 🙏
                          </h4>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {extractionResult.politeGuidanceMessage ||
                              "Rather than guessing your needs, please describe what product or service you wish to source or manufacture (e.g. quantity, material, tolerances, or budget). We will then calibrate technical specifications and market benchmarks for you."}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-blue-200/70">
                        <span className="text-[11px] font-bold text-slate-700 block mb-2">
                          Try one of these real startup requirements to see the AI Spec Engine calibrate specifications:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {samplePrompts.map((chip, idx) => (
                            <button
                              key={chip.label}
                              type="button"
                              onClick={async () => {
                                handleSelectPromptChip(idx)
                                const res = await runAIExtraction(chip.text)
                                setExtractionResult(res)
                                setHasSimulatedExtraction(true)
                              }}
                              className="text-left p-2.5 bg-white hover:bg-blue-50/90 rounded-xl border border-blue-200/80 hover:border-[#0B1F4B] transition-all cursor-pointer group shadow-2xs"
                            >
                              <div className="text-xs font-bold text-[#0B1F4B] flex items-center justify-between">
                                <span>{chip.label}</span>
                                <Icons.ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B1F4B] transition-transform group-hover:translate-x-0.5" />
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {chip.cat} · {chip.qty.toLocaleString("en-IN")} units · ₹{(chip.budget / 1000).toFixed(0)}k
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 pt-4 border-t border-slate-200 space-y-3 animate-fade-in bg-slate-50/80 p-4 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B1F4B] flex items-center gap-1.5">
                          <Icons.Check className="w-4 h-4 text-emerald-600" />
                          AI Extraction Succeeded ({aiConfidenceScore || 96}% Confidence)
                        </span>
                        <span className="text-[11px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                          {selectedCategory}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            Category
                          </div>
                          <div className="font-semibold text-slate-800 truncate" title={selectedCategory}>
                            {selectedCategory}
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            Qty / Scope
                          </div>
                          <div className="font-semibold text-slate-800 truncate" title={formatScopeDisplay(selectedCategory, quantity)}>
                            {formatScopeDisplay(selectedCategory, quantity)}
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            Est. Savings
                          </div>
                          <div className="font-semibold text-emerald-600 truncate">
                            ₹{Math.max(1500, Math.round(targetBudget * 0.24)).toLocaleString("en-IN")} (24%)
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                        <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Auto-Extracted Technical Specs:
                        </div>
                        <ul className="space-y-1 text-slate-700 text-[11px]">
                          {specifications.slice(0, 3).map((spec, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-orange-500 font-bold">•</span>
                              <span className="truncate">{spec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Requirement Assessment & Next Steps (Suppliers are not suggested at the initial intake stage) */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          <Icons.Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                          <span>Requirement Assessment & Next Steps:</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          We have carefully structured your requirement with institutional manufacturing specifications, standard tolerances, and quality benchmarks to elevate it to your exact expectations.
                        </p>
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Refine specifications & tolerances before initiating supplier matching.
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
                    </div>
                  )
                )}
              </div>
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

      {/* ─── 5. HOW IT WORKS (THE 5-STEP HORIZONTAL JOURNEY) ───────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#F97316] bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              End-To-End Sourcing Lifecycle
            </span>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B1F4B] tracking-tight mt-3"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              How MPI Solves Sourcing for Indian Startups
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Transform ambiguous requirement texts into institutional
              specifications, competitive bids from verified Indian
              manufacturers, and reliable delivery.
            </p>
          </div>

          {/* 5-Step Horizontal Stepper Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {journeySteps.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => setActiveJourneyStep(idx)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  activeJourneyStep === idx
                    ? "bg-white border-[#0B1F4B] shadow-md ring-2 ring-[#0B1F4B]/20 -translate-y-1"
                    : "bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-2xl font-black text-[#0B1F4B]/30"
                      style={{ fontFamily: "Plus Jakarta Sans" }}
                    >
                      {step.num}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {step.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0B1F4B] mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {step.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#F97316]">
                  {step.metric}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <MPIButton
              variant="outline"
              size="md"
              onClick={() => navigate("startup.procurement")}
              icon={<Icons.ArrowRight className="w-4 h-4" />}
            >
              Test the 5-Step Sourcing Engine in Workspace
            </MPIButton>
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

      {/* ─── 7. 7-CATEGORY MARKETPLACE EXPLORER (COMPACT, 20% REDUCED SIZE) ──────── */}
      <section id="marketplace" className="py-16 sm:py-20 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#0B1F4B] bg-blue-100 px-3 py-1 rounded-full">
                MPI Verified Catalog
              </span>
              <h2
                className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B] tracking-tight mt-2"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                7 Approved Procurement Categories
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Explore hundreds of vetted products and manufacturing
                capabilities ready for quotation.
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
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:border-[#0B1F4B] focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          {/* Category Filter Pills (Strictly 7 Categories) */}
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <button
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
                        // Fail-safe SVG fallback if offline
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
                View All {filteredCatalog.length} Catalog Offerings in Workspace
                →
              </MPIButton>
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

      {/* ─── 9. STARTUP VS MSME DUAL GATEWAYS ─────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4B] tracking-tight"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Choose Your Platform Workspace
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Whether you are an emerging startup seeking manufacturing or an
              established MSME seeking high-intent purchase orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Startup Gateway Card */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-8 shadow-sm flex flex-col justify-between hover:border-[#0B1F4B] transition-all">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-4">
                  <span>For Buyers & Founders</span>
                </div>
                <h3
                  className="text-xl font-bold text-[#0B1F4B] mb-2"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  Startup Procurement Command Center
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Intake plain requirements, auto-generate engineering RFQs,
                  compare verified bids side-by-side, unlock Government Schemes,
                  and manage purchase orders.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-700 mb-8 font-medium">
                  <li className="flex items-center gap-2">
                    <Icons.Check className="w-4 h-4 text-emerald-600" />
                    AI specification extraction & RFQ generator
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="w-4 h-4 text-emerald-600" />
                    Multi-quote landed cost comparison matrix with Total Savings
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="w-4 h-4 text-emerald-600" />
                    10-milestone order tracking with inspection gates
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <MPIButton
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => navigate("startup.home")}
                  icon={<Icons.ArrowRight className="w-4 h-4" />}
                >
                  Enter as Startup
                </MPIButton>
                <div className="text-center">
                  <button
                    onClick={() => navigate("register.startup")}
                    className="text-xs text-blue-700 font-semibold hover:underline"
                  >
                    Need an account? Register as Startup →
                  </button>
                </div>
              </div>
            </div>

            {/* MSME Gateway Card */}
            <div className="bg-white rounded-2xl border-2 border-orange-200 p-8 shadow-sm flex flex-col justify-between hover:border-[#F97316] transition-all">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#F97316] text-xs font-bold mb-4">
                  <span>For Suppliers & Manufacturers</span>
                </div>
                <h3
                  className="text-xl font-bold text-[#0B1F4B] mb-2"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  MSME Business Command Center
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Complete statutory verification (Udyam, GST, ISO), list
                  machine capacities across the 7 categories, and quote directly
                  on verified startup RFQs.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-700 mb-8 font-medium">
                  <li className="flex items-center gap-2">
                    <Icons.Check className="w-4 h-4 text-[#F97316]" />
                    Real-time RFQ opportunities feed with match scores
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="w-4 h-4 text-[#F97316]" />
                    Itemized quote response builder with tooling costs
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.Check className="w-4 h-4 text-[#F97316]" />
                    Machinery capacity and statutory certification ledger
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <MPIButton
                  variant="ai"
                  fullWidth
                  size="lg"
                  onClick={() => navigate("msme.home")}
                  icon={<Icons.ArrowRight className="w-4 h-4" />}
                >
                  Enter as MSME Supplier
                </MPIButton>
                <div className="text-center">
                  <button
                    onClick={() => navigate("register.msme")}
                    className="text-xs text-[#F97316] font-semibold hover:underline"
                  >
                    New supplier? Register as MSME →
                  </button>
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

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
      />
    </div>
  )
}
