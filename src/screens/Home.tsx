import { useState, useMemo, useEffect } from "react"
import { NavProps, Screen } from "../App"
import { useProcurement } from "../context/ProcurementContext"
import {
  MPI_CATALOG,
  CatalogCategory,
  searchCatalog,
} from "../lib/mpiCatalog"
import {
  Icons,
} from "../components/design-system/MPIDesignSystem"
import AuthModal, { AuthPortalContext } from "../components/auth/AuthModal"
import RoleMismatchModal from "../components/auth/RoleMismatchModal"
import { RoleKey } from "../lib/mockAuth"
import {
  isAuthenticated,
  getUserRole,
  getActiveUser,
  isProfileComplete,
  savePendingAction,
  PendingActionContext,
  logUserJourney,
  logoutUserSession,
} from "../lib/sessionManager"
import GlobalNavBar from "../components/navigation/GlobalNavBar"
import ProductCatalogue from "../components/catalogue/ProductCatalogue"
import useScrollReveal from "../hooks/useScrollReveal"
import MaterialIcon from "../components/ui/MaterialIcon"
import CountUpNumber from "../components/ui/CountUpNumber"
import { openCookiePreferencesModal } from "../services/cookieConsentService"
import { trackTelemetryEvent } from "../services/telemetryService"

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

export const INDUSTRIAL_CLUSTERS = [
  { name: "Peenya Industrial Area, Bengaluru", specialty: "CNC Machining & Precision Tooling", state: "KA" },
  { name: "Okhla Industrial Area, New Delhi", specialty: "Light Engineering & Electronics", state: "DL" },
  { name: "Bhosari & Chakan, Pune", specialty: "Automotive Sheet Metal & Stamping", state: "MH" },
  { name: "Coimbatore Precision Cluster, TN", specialty: "Pumps, Castings & Motors", state: "TN" },
  { name: "Sivakasi Packaging Corridor, TN", specialty: "Rigid Boxes & Offset Printing", state: "TN" },
  { name: "Ambattur Industrial Estate, Chennai", specialty: "Electronics & PCB Fabrication", state: "TN" },
  { name: "Sanand Industrial Park, Gujarat", specialty: "Injection Molding & Tooling", state: "GJ" },
  { name: "Manesar IMT, Haryana", specialty: "Precision Die Casting & Prototyping", state: "HR" },
]

export const STATUTORY_STANDARDS = [
  { label: "DPIIT Recognized Startup Infrastructure", badge: "Govt of India", icon: "verified" },
  { label: "ZED Gold Certified MSME Manufacturers", badge: "Zero Defect", icon: "military_tech" },
  { label: "ISO 9001:2015 Quality Management Standard", badge: "Audited", icon: "fact_check" },
  { label: "Udyam Ministry Verified Active GSTINs", badge: "MSME Ministry", icon: "policy" },
  { label: "Milestone Tripartite Escrow Banking", badge: "Protected", icon: "lock" },
  { label: "NABL Accredited Third-Party Testing Labs", badge: "QA Tested", icon: "science" },
  { label: "Government e-Marketplace (GeM) Compliant", badge: "Institutional", icon: "account_balance" },
  { label: "Startup India SISFS Seed Grant Assistance", badge: "Up to 80%", icon: "savings" },
]

export default function Home({
  navigate,
  goBack = () => {},
  currentScreen = "home",
  canGoBack = false,
}: NavProps) {
  const {
    setRequirementText,
    setSelectedCategory,
    setQuantity,
    setTargetBudget,
    runAIExtraction,
  } = useProcurement()

  // Viewport scroll reveal observer
  useScrollReveal()

  // Track privacy-safe landing page view event on initial mount
  useEffect(() => {
    trackTelemetryEvent("landing_view", {
      path: "/",
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    })
  }, [])

  // Auth modal state for Login and Sign In with contextual portal gates
  const [authModal, setAuthModal] = useState<{
    open: boolean
    mode: "login" | "signin"
    initialRole?: RoleKey
    targetScreen?: Screen
    portalContext?: AuthPortalContext
  }>({
    open: false,
    mode: "login",
    initialRole: "startup",
    targetScreen: "startup.home",
  })

  // Role mismatch modal state for incompatible user accounts
  const [roleMismatch, setRoleMismatch] = useState<{
    open: boolean
    currentRole: RoleKey | null
    requiredRole: RoleKey
    actionName: string
  }>({
    open: false,
    currentRole: null,
    requiredRole: "startup",
    actionName: "",
  })

  const handleOpenAuth = (options?: {
    mode?: "login" | "signin"
    defaultRole?: RoleKey
    targetScreen?: Screen
    portalContext?: AuthPortalContext
  }) => {
    setAuthModal({
      open: true,
      mode: options?.mode || "login",
      initialRole: options?.defaultRole || "startup",
      targetScreen: options?.targetScreen || "startup.home",
      portalContext: options?.portalContext,
    })
  }

  /**
   * Centralized Homepage CTA Router & User Journey Orchestrator
   * 
   * Enforces production flow:
   * 1. Check if authenticated
   * 2. If authenticated and role compatible: proceed directly to destination
   * 3. If authenticated with wrong role: display RoleMismatchModal
   * 4. If unauthenticated: preserve pending action context & open contextual AuthModal
   */
  type HomeActionType =
    | PendingActionContext["actionType"]
    | "experience_intake"
    | "inspect_suppliers"
    | "view_bidding"
    | "explore_savings"
    | "catalog_quote"
    | "ask_ai"

  const handleProtectedJourney = (config: {
    targetScreen: Screen
    actionType: HomeActionType
    actionLabel: string
    requiredRole?: RoleKey
    productContext?: PendingActionContext["productContext"]
    procurementContext?: PendingActionContext["procurementContext"]
    portalContext?: AuthPortalContext
    onExecuteIfAuthenticated?: () => void
  }) => {
    logUserJourney("CTA_CLICKED", {
      actionLabel: config.actionLabel,
      targetScreen: config.targetScreen,
      requiredRole: config.requiredRole,
      isAuthenticated: isAuthenticated(),
    })

    const authed = isAuthenticated()
    const activeRole = getUserRole()

    // 1. Role mismatch check for authenticated users
    if (authed && config.requiredRole && activeRole && activeRole !== "admin" && activeRole !== config.requiredRole) {
      logUserJourney("ROLE_MISMATCH_DETECTED", {
        activeRole,
        requiredRole: config.requiredRole,
        actionLabel: config.actionLabel,
      })
      setRoleMismatch({
        open: true,
        currentRole: activeRole,
        requiredRole: config.requiredRole,
        actionName: config.actionLabel,
      })
      return
    }

    // 2. If authenticated with compatible role
    if (authed) {
      if (config.onExecuteIfAuthenticated) {
        config.onExecuteIfAuthenticated()
        return
      }

      // Check if profile is complete for startups entering procurement
      if (config.requiredRole === "startup" && config.targetScreen === "startup.procurement") {
        if (!isProfileComplete("startup")) {
          logUserJourney("STARTUP_PROFILE_INCOMPLETE_REDIRECT", { to: "startup.onboarding" })
          navigate("startup.onboarding")
          return
        }
      }

      navigate(config.targetScreen)
      return
    }

    // 3. If unauthenticated: preserve context and request authentication
    savePendingAction({
      targetScreen: config.targetScreen,
      actionType: config.actionType,
      requiredRole: config.requiredRole,
      productContext: config.productContext,
      procurementContext: config.procurementContext,
      origin: "homepage",
    })

    setAuthModal({
      open: true,
      mode: config.actionType === "register_msme" ? "signin" : "login",
      initialRole: config.requiredRole || "startup",
      targetScreen: config.targetScreen,
      portalContext: config.portalContext,
    })
  }

  /**
   * Return-path fulfillment handler after successful authentication
   */
  const handleAuthSuccess = (detectedRole: RoleKey, pending: PendingActionContext | null) => {
    logUserJourney("HANDLE_AUTH_SUCCESS_FULFILLMENT", {
      detectedRole,
      hasPending: Boolean(pending),
      pendingActionType: pending?.actionType,
    })

    if (!pending) {
      if (detectedRole === "admin") navigate("admin.home")
      else if (detectedRole === "msme") navigate("msme.home")
      else navigate("startup.home")
      return
    }

    // Restore product / procurement context
    if (pending.productContext) {
      const prod = pending.productContext
      setRequirementText(
        pending.procurementContext?.requirementText ||
          `Need sourcing quote for ${prod.name} (${prod.category}) with standard institutional specifications`,
      )
      setSelectedCategory(prod.category as CatalogCategory)
      if (pending.procurementContext?.quantity) {
        setQuantity(pending.procurementContext.quantity)
      }
      if (pending.procurementContext?.targetBudget) {
        setTargetBudget(pending.procurementContext.targetBudget)
      }
      logUserJourney("RESTORED_PRODUCT_CONTEXT", {
        productId: prod.id,
        name: prod.name,
        category: prod.category,
      })
    } else if (pending.procurementContext?.requirementText) {
      setRequirementText(pending.procurementContext.requirementText)
      if (pending.procurementContext.category) {
        setSelectedCategory(pending.procurementContext.category as CatalogCategory)
      }
      if (pending.procurementContext.quantity) {
        setQuantity(pending.procurementContext.quantity)
      }
      if (pending.procurementContext.targetBudget) {
        setTargetBudget(pending.procurementContext.targetBudget)
      }
    }

    // Check profile completion for startups entering procurement
    if (
      pending.requiredRole === "startup" &&
      (pending.targetScreen === "startup.procurement" || pending.targetScreen === "startup.rfq")
    ) {
      if (!isProfileComplete("startup")) {
        navigate("startup.onboarding")
        return
      }
    }

    navigate(pending.targetScreen)
  }

  const handleSwitchAccountFromMismatch = (targetRole: RoleKey) => {
    setRoleMismatch((prev) => ({ ...prev, open: false }))
    logoutUserSession().then(() => {
      setAuthModal({
        open: true,
        mode: targetRole === "msme" ? "signin" : "login",
        initialRole: targetRole,
        targetScreen: targetRole === "msme" ? "msme.onboarding" : "startup.home",
        portalContext: {
          badge: targetRole === "msme" ? "MSME Supplier Network" : "Startup Buyer Portal",
          title: targetRole === "msme" ? "Join as MSME Manufacturer" : "Log in as Startup Buyer",
          description: "Sign in with your credentials for this role.",
          icon: targetRole === "msme" ? "precision_manufacturing" : "rocket_launch",
        },
      })
    })
  }

  const handleContinueCurrentRoleFromMismatch = (role: RoleKey) => {
    setRoleMismatch((prev) => ({ ...prev, open: false }))
    if (role === "msme") navigate("msme.home")
    else if (role === "admin") navigate("admin.home")
    else navigate("startup.home")
  }

  // Command palette & search modal (⌘K)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState("")
  const [heroPromptIndex, setHeroPromptIndex] = useState(0)

  // Government scheme interactive calculator state
  const [calcBudget, setCalcBudget] = useState(120000)
  const [calcCategory, setCalcCategory] = useState<CatalogCategory>("Packaging & Printing")

  // FAQ Accordion State (open question index)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Reference Prompt Presets for Instant UI Interaction
  const heroSamplePrompts = [
    {
      label: "Custom Rigid Cartons",
      text: "Need 500 custom rigid printed boxes for our D2C organic skincare launch by next month, budget under ₹80k with EVA foam inserts",
      cat: "Packaging & Printing" as CatalogCategory,
      qty: 500,
      budget: 75000,
      leadTime: "12 Days",
      tolerance: "±0.5 mm",
      material: "1200 GSM Kappa Board with Matte Lamination",
      savings: "28%",
      factory: "Apex Precision Packaging (Bengaluru)",
    },
    {
      label: "5-Axis CNC Drone Arm",
      text: "Looking for 5-axis CNC machining for 20 sets of 6061-T6 aluminum drone arm chassis with ±0.05mm tolerance and black anodizing, budget ₹1.2 Lakh",
      cat: "Prototyping & Product Development" as CatalogCategory,
      qty: 20,
      budget: 120000,
      leadTime: "10 Days",
      tolerance: "±0.05 mm",
      material: "Aero-Grade 6061-T6 Aluminum (Black Anodized)",
      savings: "32%",
      factory: "Bharat Precision Tooling (Peenya, KA)",
    },
    {
      label: "Cloud ERP & Supabase",
      text: "Need full-stack development team for custom ERP inventory workflow with Supabase PostgreSQL and Next.js 15, budget ₹1.8 Lakh",
      cat: "IT & Digital Services" as CatalogCategory,
      qty: 1,
      budget: 180000,
      leadTime: "21 Days",
      tolerance: "SOC 2 Type II",
      material: "Next.js 15 + Supabase PostgreSQL Enterprise",
      savings: "24%",
      factory: "Zenith Digital Systems (Pune, MH)",
    },
    {
      label: "DPIIT Seed Fund Incubation",
      text: "Need specialized startup support for DPIIT seed fund compliance, MSME incubation readiness, and go-to-market mentorship, budget ₹50k",
      cat: "Specialized Startup Support" as CatalogCategory,
      qty: 1,
      budget: 50000,
      leadTime: "14 Days",
      tolerance: "Statutory 100%",
      material: "Startup India SISFS Mandate + ZED Audit File",
      savings: "35%",
      factory: "Bharat Innovation Foundry (New Delhi)",
    },
  ]

  const currentHeroPrompt = heroSamplePrompts[heroPromptIndex]

  // Keyboard shortcut for Command Palette (⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setShowSearchModal((prev) => !prev)
      }
      if (e.key === "Escape") {
        setShowSearchModal(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Command palette results
  const paletteResults = useMemo(() => {
    if (!paletteQuery.trim()) {
      return MPI_CATALOG.slice(0, 6)
    }
    return searchCatalog(MPI_CATALOG, paletteQuery, "All").slice(0, 8)
  }, [paletteQuery])

  // Handle switching hero prompt chip
  const handleSelectHeroPrompt = async (index: number) => {
    setHeroPromptIndex(index)
    const item = heroSamplePrompts[index]
    setRequirementText(item.text)
    setSelectedCategory(item.cat)
    setQuantity(item.qty)
    setTargetBudget(item.budget)

    try {
      await runAIExtraction(item.text)
    } catch {
      // Background extraction for caching context
    }
  }

  // Scheme assistance calculation
  const calculatedSchemeBenefit = useMemo(() => {
    let rate = 0.6 // 60%
    if (calcCategory === "Compliance & Legal Support") rate = 0.8
    if (calcCategory === "Prototyping & Product Development") rate = 0.7
    const est = Math.round(calcBudget * rate)
    return {
      rate: Math.round(rate * 100),
      amount: Math.min(est, 500000),
      netCost: Math.max(calcBudget - est, 0),
    }
  }, [calcBudget, calcCategory])

  // FAQ Items
  const faqItems = [
    {
      q: "How does MPI verify MSME factories and eliminate middleman fraud?",
      a: "Every factory on MPI undergoes mandatory verification against government databases (Udyam statutory registration, live GSTIN return filings, and ZED Gold/Bronze certifications). Physical machinery capacity, historical batch defect rates, and factory floor telemetry are audited before any manufacturer can bid on client RFQs.",
    },
    {
      q: "Can early-stage startups with low order quantities (low MOQs) use MPI?",
      a: "Yes. Traditional manufacturing agents reject small batches or impose punitive tooling surcharges. MPI pools non-confidential capacity demand across regional industrial clusters (e.g., Peenya, Okhla, Coimbatore), matching early-stage founders with idle machine hours for batches as small as 50–500 units.",
    },
    {
      q: "How does the milestone escrow payment system protect my capital?",
      a: "Payments are held securely in a tripartite escrow account. Zero full advances are disbursed to suppliers upfront. Typically, 30% is mobilized for raw materials upon technical drawing approval, with the remaining 70% released only after third-party lab inspection reports and dispatch bills of lading are verified.",
    },
    {
      q: "What government subsidies can my startup claim through MPI?",
      a: "Startups sourcing through DPIIT & MSME-registered manufacturers are eligible for up to 80% subsidy on tooling, CAD prototyping, and quality certifications under ZED, Design Clinic, and the Startup India Seed Fund Scheme (SISFS). MPI automatically flags grant-eligible items in your RFQ.",
    },
    {
      q: "How does the AI requirement synthesis work?",
      a: "When you type a plain-language requirement (e.g., 'Need 500 rigid boxes with foam inserts'), our Gemini-powered engine parses your prompt into engineering-grade parameters: GSM paper weights, dimensional tolerances, material grades, bill of materials (BOM), and production lead times.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 flex flex-col font-sans selection:bg-[#051F16] selection:text-white antialiased">
      {/* ─── STATUTORY TRUST STRIP ────────────────────────────────────────── */}
      <div className="bg-[#051F16] text-white text-xs py-2 px-4 border-b border-[#0A3525]">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A3F65C] animate-pulse" />
            <span className="font-semibold text-slate-200">
              NATIONAL PROCUREMENT NETWORK
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">
              DPIIT & Ministry of MSME Verified Factory Sourcing Infrastructure
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <button
              onClick={() => setShowSearchModal(true)}
              className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Icons.Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Quick Search</span>
              <kbd className="hidden md:inline bg-[#0A3525] px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-emerald-900/40">
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

      {/* ─── 1. GLOBAL MINIMAL NAVIGATION ──────────────────────────────────── */}
      <GlobalNavBar
        navigate={navigate}
        goBack={goBack}
        currentScreen={currentScreen}
        canGoBack={canGoBack}
        onOpenAuth={handleOpenAuth}
      />

      {/* ─── 2. HERO SECTION (REFERENCE REIMAGINATION) ─────────────────────── */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden bg-gradient-to-b from-white via-[#F8FAFC] to-[#F1F5F9]">
        {/* Multi-Tiered Luminous Spatial Hero Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-gradient-to-b from-[#A3F65C]/20 via-emerald-700/10 to-transparent rounded-full blur-[130px] opacity-80"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/3 w-[500px] h-[400px] bg-emerald-400/10 rounded-full blur-[100px] opacity-60"
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Eyebrow & Editorial Headline */}
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#A3F65C] ring-2 ring-emerald-600/30" />
              <span className="font-mono text-[11px] tracking-wider uppercase text-slate-700">
                AI-Powered Procurement Intelligence
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[76px] font-extrabold text-[#051F16] tracking-tight leading-[1.04]"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Procurement, <br className="hidden sm:inline" />
              <span className="font-editorial italic font-normal text-[#083A28]">
                made intelligent.
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              AI-powered procurement intelligence that helps businesses discover,
              compare, verify and procure products and services with greater
              speed, visibility and savings.
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  handleProtectedJourney({
                    targetScreen: "startup.procurement",
                    actionType: "start_mpi",
                    actionLabel: "Start a Procurement Request",
                    requiredRole: "startup",
                    portalContext: {
                      badge: "Startup Buyer Portal",
                      title: "Start Sourcing on MPI",
                      description: "Log in or register your startup to synthesize engineering specs and match verified factories.",
                      icon: "rocket_launch",
                    },
                  })
                }
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold rounded-xl bg-[#051F16] hover:bg-[#083A28] active:scale-[0.98] text-white shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-[#0A3525]"
              >
                <span>Start a Procurement Request</span>
                <Icons.ArrowRight className="w-4 h-4 text-[#A3F65C] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleProtectedJourney({
                    targetScreen: "msme.onboarding",
                    actionType: "register_msme",
                    actionLabel: "Register as MSME Supplier",
                    requiredRole: "msme",
                    portalContext: {
                      badge: "MSME Supplier Network",
                      title: "Join MPI Supplier Network",
                      description: "Register your manufacturing unit, verify statutory compliance, and receive high-intent RFQs.",
                      icon: "precision_manufacturing",
                    },
                  })
                }
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-xl bg-white hover:bg-slate-50 active:scale-[0.98] text-[#051F16] border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
              >
                <MaterialIcon name="precision_manufacturing" size={16} className="text-emerald-700" />
                <span>Register as MSME Supplier</span>
              </button>

              <a
                href="#marketplace"
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-700 border border-slate-200 transition-all cursor-pointer"
              >
                <span>Explore Catalogue</span>
                <MaterialIcon name="arrow_downward" size={15} className="text-slate-400" />
              </a>
            </div>

            {/* Credibility Micro-line */}
            <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <MaterialIcon name="verified" size={14} className="text-emerald-700" />
                <span><CountUpNumber end={1240} suffix="+" /> Verified MSME Factories</span>
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:flex items-center gap-1.5">
                <MaterialIcon name="policy" size={14} className="text-emerald-700" />
                <span>DPIIT & ZED Certified</span>
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="flex items-center gap-1.5">
                <MaterialIcon name="lock" size={14} className="text-[#051F16]" />
                <span>100% Milestone Escrow</span>
              </span>
            </div>
          </div>

          {/* ─── 3. REAL MPI PRODUCT PREVIEW (HERO ARTWORK CENTERPIECE) ──────── */}
          <div className="mt-14 lg:mt-18 relative">
            {/* Luminous Centerpiece Halo Aura */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl h-[420px] bg-gradient-to-r from-emerald-600/15 via-[#A3F65C]/25 to-teal-500/15 blur-[80px] rounded-3xl"
            />

            {/* Outer Product Frame */}
            <div className="relative mx-auto rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-15px_rgba(11,31,75,0.12)] overflow-hidden">
              {/* Product Window Header Bar */}
              <div className="px-4 sm:px-6 py-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-300" />
                    <span className="w-3 h-3 rounded-full bg-slate-300" />
                    <span className="w-3 h-3 rounded-full bg-slate-300" />
                  </div>
                  <span className="h-4 w-px bg-slate-200 mx-1" />
                  <span className="font-mono text-[11px] font-semibold text-slate-600">
                    app.mpi.gov.in / procurement-os
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Engine Active • <CountUpNumber end={1240} /> Factories Connected</span>
                  </div>
                </div>
              </div>

              {/* Product Interface Body */}
              <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Real Requirement Intake Bar */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <MaterialIcon name="terminal" size={16} className="text-[#051F16]" />
                      <span>Natural Language Sourcing Requirement</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Click any sample below to simulate:
                    </span>
                  </div>

                  {/* Sample Prompt Pills */}
                  <div className="flex flex-wrap gap-2">
                    {heroSamplePrompts.map((prompt, idx) => (
                      <button
                        key={prompt.label}
                        type="button"
                        onClick={() => handleSelectHeroPrompt(idx)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          heroPromptIndex === idx
                            ? "bg-[#051F16] text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                        }`}
                      >
                        <span>{prompt.label}</span>
                        {heroPromptIndex === idx && (
                          <MaterialIcon name="check" size={13} className="text-[#A3F65C]" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Interactive Textarea View */}
                  <div className="relative">
                    <div className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 leading-relaxed shadow-2xs">
                      {currentHeroPrompt.text}
                    </div>
                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          trackTelemetryEvent("cta_rfq_clicked", {
                            source: "hero_demo",
                            category: currentHeroPrompt.cat,
                            quantity: currentHeroPrompt.qty,
                            budget: currentHeroPrompt.budget,
                          })
                          handleProtectedJourney({
                            targetScreen: "startup.procurement",
                            actionType: "run_rfq",
                            actionLabel: "Run Full RFQ",
                            requiredRole: "startup",
                            procurementContext: {
                              requirementText: currentHeroPrompt.text,
                              category: currentHeroPrompt.cat,
                              quantity: currentHeroPrompt.qty,
                              targetBudget: currentHeroPrompt.budget,
                            },
                            onExecuteIfAuthenticated: () => {
                              setRequirementText(currentHeroPrompt.text)
                              setSelectedCategory(currentHeroPrompt.cat)
                              setQuantity(currentHeroPrompt.qty)
                              setTargetBudget(currentHeroPrompt.budget)
                              navigate("startup.procurement")
                            },
                            portalContext: {
                              badge: "AI RFQ Generation",
                              title: "Run Full RFQ",
                              description: "Sign in to generate institutional RFQ documentation and dispatch to verified suppliers.",
                              icon: "auto_awesome",
                            },
                          })
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#051F16] hover:bg-[#083A28] text-white cursor-pointer shadow-2xs"
                      >
                        <MaterialIcon name="auto_awesome" size={14} className="text-[#A3F65C]" />
                        <span>Run Full RFQ</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Synthesis Pipeline Bridge Visualizer */}
                <div className="hidden md:flex items-center justify-between px-3.5 py-2 bg-slate-100/80 rounded-xl border border-slate-200/70 text-[11px] font-mono text-slate-600">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>SYNTHESIS PIPELINE</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-500">
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <span>BOM Extraction</span>
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <span>Machine Slot Match</span>
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <span>Reverse Margin Audit</span>
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <span>Escrow Gate</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    LATENCY &lt; 240ms
                  </div>
                </div>

                {/* Dashboard Multi-Panel Split (Synthesized Output) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Panel 1: AI Technical Spec Synthesis */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/60">
                        1. Spec Synthesis
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        98% Confidence
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Material Grade</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                          {currentHeroPrompt.material}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Tolerance Spec</span>
                        <span className="font-semibold font-mono text-slate-800">
                          {currentHeroPrompt.tolerance}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Target Batch</span>
                        <span className="font-semibold text-slate-800">
                          {currentHeroPrompt.qty} units
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Target Budget</span>
                        <span className="font-bold text-[#051F16]">
                          ₹{currentHeroPrompt.budget.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Verified MSME Supplier Match */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                        2. Factory Match
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Tier-1 Vetted
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 truncate">
                          {currentHeroPrompt.factory}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="text-amber-700 font-bold">★ ZED Gold</span>
                          <span>•</span>
                          <span>ISO 9001:2015</span>
                        </div>
                      </div>

                      <div className="pt-1.5 space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Capacity Status:</span>
                          <span className="font-semibold text-emerald-700">Immediate Slot</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Production Turnaround:</span>
                          <span className="font-semibold text-slate-800">
                            {currentHeroPrompt.leadTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel 3: Reverse-Margin Cost & Savings */}
                  <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                        3. Value & Savings
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                        -{currentHeroPrompt.savings} Cost
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
                        <span>Traditional Broker Price</span>
                        <span className="line-through text-slate-400">
                          ₹{Math.round(currentHeroPrompt.budget * 1.35).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="font-semibold text-slate-700">MPI Direct Factory Price</span>
                        <span className="font-bold text-emerald-700">
                          ₹{currentHeroPrompt.budget.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Escrow Milestone Gate</span>
                        <span className="font-semibold text-slate-800">30% Advance Protected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Milestone Ribbon */}
                <div className="bg-[#051F16] text-white rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs border border-[#0A3525]">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#A3F65C] animate-pulse" />
                    <span className="font-semibold text-slate-200">
                      Milestone SLA Protection: 30% Mobilization Escrow → QA Drop Test Passed → Final 70% Released
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleProtectedJourney({
                        targetScreen: "startup.home",
                        actionType: "launch_workspace",
                        actionLabel: "Launch in Workspace",
                        requiredRole: "startup",
                        portalContext: {
                          badge: "Startup Workspace",
                          title: "Launch Procurement Workspace",
                          description: "Access your active RFQs, supplier bids, and milestone escrow ledgers.",
                          icon: "rocket_launch",
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 font-bold text-[#A3F65C] hover:text-[#92E64B] cursor-pointer text-xs"
                  >
                    <span>Launch in Workspace</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5 text-[#A3F65C]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. CREDIBILITY & METRICS BAND ─────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200/80 py-12 lg:py-16 scroll-reveal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="font-mono text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Powering Institutional Sourcing Across India
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
            <div className="text-center pt-4 sm:pt-0">
              <div
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#051F16] tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                <CountUpNumber end={1240} suffix="+" />
              </div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Verified MSME Suppliers
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Across 28 Industrial Hubs
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-0 sm:pl-6">
              <div
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#051F16] tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                <CountUpNumber end={75} suffix="+" />
              </div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Procure-Ready Offerings
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                With Instant RFQ Synthesis
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-0 sm:pl-6">
              <div
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#051F16] tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                <CountUpNumber end={7} />
              </div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Core Procurement Verticals
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Packaging to Precision CNC
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-0 sm:pl-6">
              <div
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-emerald-700 tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                <CountUpNumber start={18} end={32} prefix="18–" suffix="%" />
              </div>
              <div className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Direct Cost Reduction
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Via Factory Reverse Margins
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4B. CONTINUOUS DUAL INDUSTRIAL CLUSTER & STATUTORY MARQUEES ───── */}
      <section className="py-8 bg-[#FAFAFC] border-b border-slate-200/80 overflow-hidden relative select-none">
        {/* Left & Right Gradient Fade Masks */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 sm:w-48 bg-gradient-to-r from-[#FAFAFC] via-[#FAFAFC]/90 to-transparent z-10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 sm:w-48 bg-gradient-to-l from-[#FAFAFC] via-[#FAFAFC]/90 to-transparent z-10"
        />

        <div className="space-y-3.5">
          {/* Rail 1: Industrial Manufacturing Hubs (Left-moving) */}
          <div className="flex overflow-hidden">
            <div className="animate-marquee-left flex items-center gap-3">
              {[...INDUSTRIAL_CLUSTERS, ...INDUSTRIAL_CLUSTERS].map((cluster, idx) => (
                <div
                  key={`cluster-${idx}`}
                  className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-[#A3F65C] ring-2 ring-emerald-600/30" />
                  <span className="text-xs font-bold text-[#051F16]">{cluster.name}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] text-slate-500 font-medium">{cluster.specialty}</span>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200/50">
                    {cluster.state}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rail 2: Statutory Standards & Certifications (Right-moving) */}
          <div className="flex overflow-hidden">
            <div className="animate-marquee-right flex items-center gap-3">
              {[...STATUTORY_STANDARDS, ...STATUTORY_STANDARDS].map((std, idx) => (
                <div
                  key={`std-${idx}`}
                  className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#051F16] border border-[#0A3525] text-white shadow-2xs hover:border-emerald-600/50 transition-all whitespace-nowrap"
                >
                  <MaterialIcon name={std.icon} size={15} className="text-[#A3F65C]" />
                  <span className="text-xs font-semibold text-slate-200">{std.label}</span>
                  <span className="text-[10px] font-mono font-bold bg-[#0A3525] text-[#A3F65C] px-2 py-0.5 rounded border border-emerald-900/60">
                    {std.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. CORE VALUE EDITORIAL SECTION ───────────────────────────────── */}
      <section id="solutions" className="py-20 lg:py-28 bg-[#FAFAFC] scroll-reveal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-800">
            The Procurement Bottleneck
          </span>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#051F16] tracking-tight leading-tight"
            style={{ fontFamily: "Plus Jakarta Sans" }}
          >
            "Procurement shouldn't feel{" "}
            <span className="font-editorial italic font-normal text-[#083A28]">
              fragmented.
            </span>"
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Founders and enterprise procurement heads lose 6 to 8 weeks navigating
            opaque broker fees, mismatched technical drawings, unverified factory
            claims, and delivery defaults. MPI replaces middlemen with an intelligent,
            verifiable operating system connecting real Indian factories directly
            to high-growth businesses.
          </p>
        </div>

        {/* 4 Core Value Pillar Cards */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#051F16] flex items-center justify-center">
                <MaterialIcon name="psychology" size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                AI Spec Synthesis
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Describe requirements in conversational English. MPI AI constructs
                manufacturing-ready bills of materials, GSM tolerances, and constraints.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <MaterialIcon name="verified" size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                100% Audited MSMEs
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct access to Tier-1 Indian manufacturers certified under ZED Gold,
                ISO 9001, and Udyam with verified machine idle capacity.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <MaterialIcon name="savings" size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Reverse-Margin Pricing
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transparent factory-floor cost breakdowns across tooling, unit production,
                GST, and logistics with zero hidden middleman markups.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#051F16] flex items-center justify-center">
                <MaterialIcon name="security" size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Escrow Milestone SLAs
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zero advance capital risk. Procurement funds remain locked in escrow
                and disburse only upon certified QA inspection pass.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. EDITORIAL PRODUCT STORYTELLING (ALTERNATING 2-COL) ─────────── */}
      <section id="how-it-works" className="py-20 bg-white border-t border-slate-200/80 space-y-24 scroll-reveal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Chapter A: Intelligent Discovery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-800">
                Intelligent Discovery
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-[#051F16] tracking-tight leading-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Tell MPI what you need in{" "}
                <span className="font-editorial italic font-normal text-[#083A28]">
                  plain English.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                No complex engineering jargon required. Whether you need custom
                biodegradable pouches, 5-axis CNC titanium drone arms, or full-stack
                cloud ERP infrastructure, MPI converts plain descriptions into
                institutional-grade specifications in seconds.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleProtectedJourney({
                      targetScreen: "startup.procurement",
                      actionType: "experience_intake",
                      actionLabel: "Experience Natural Language Intake",
                      requiredRole: "startup",
                      portalContext: {
                        badge: "AI Sourcing Intake",
                        title: "Natural Language Requirement Engine",
                        description: "Sign in to convert conversational requests into institutional manufacturing specs.",
                        icon: "psychology",
                      },
                    })
                  }
                  className="group inline-flex items-center gap-2 text-xs font-bold text-[#051F16] hover:text-[#083A28] cursor-pointer"
                >
                  <span>Experience Natural Language Intake</span>
                  <Icons.ArrowRight className="w-3.5 h-3.5 text-[#051F16] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Visual A */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-200 pb-3">
                <span>INPUT: Raw Natural Language Prompt</span>
                <span className="text-emerald-700 font-bold">● AI PARSER READY</span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                "Looking for 500 units rigid cardboard packaging boxes with gold foil logo stamping and custom black EVA foam inserts for perfume launch next month."
              </div>
              <div className="p-4 bg-[#051F16] text-white rounded-xl text-xs space-y-2 font-mono border border-[#0A3525]">
                <div className="text-[#A3F65C] font-bold">OUTPUT: Institutional RFQ BOM</div>
                <div className="text-slate-300 text-[11px] space-y-1">
                  <div>• Material: 1200 GSM Kappa Board + 157 GSM Art Paper</div>
                  <div>• Finish: Matte Lamination + Micro Spot UV Gold Foil</div>
                  <div>• Insert: Custom Die-Cut EVA Foam (High Density)</div>
                  <div>• Target Batch MOQ: 500 Units • Lead Time: 12 Days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter B: Verified Marketplace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual B */}
            <div className="order-2 lg:order-1 bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-200 pb-3">
                <span>FACTORY DOSSIER #MCH-4819</span>
                <span className="text-emerald-800 font-bold">100% STATUTORY AUDITED</span>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">
                    Apex Precision Packaging Ltd.
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                    ZED Gold Pass
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                  <div>Udyam: UDYAM-MH-12-0048192</div>
                  <div>GSTIN: 27AABCA1234F1Z6</div>
                  <div>Location: Bengaluru, KA</div>
                  <div>ISO: 9001:2015 Certified</div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Live Heidelberg Press Capacity:</span>
                  <span className="font-bold text-emerald-700">68% Utilized (32% Open)</span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-800">
                Verified Marketplace
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-[#051F16] tracking-tight leading-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Know exactly who you are{" "}
                <span className="font-editorial italic font-normal text-[#083A28]">
                  buying from.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Zero phantom brokers or fictitious trading houses. Every factory
                profile on MPI reveals real machine capacity ledgers, statutory
                Udyam certificates, and verified past order drop-test results.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const user = getActiveUser()
                    if (user?.role === "msme") {
                      navigate("msme.home")
                    } else {
                      handleProtectedJourney({
                        targetScreen: "startup.match-results",
                        actionType: "inspect_suppliers",
                        actionLabel: "Inspect Verified Suppliers",
                        requiredRole: "startup",
                        portalContext: {
                          badge: "Supplier Verification",
                          title: "Inspect Verified MSME Suppliers",
                          description: "Access audited factory dossiers, ZED Gold certifications, and live machine capacity.",
                          icon: "verified",
                        },
                      })
                    }
                  }}
                  className="group inline-flex items-center gap-2 text-xs font-bold text-[#051F16] hover:text-[#083A28] cursor-pointer"
                >
                  <span>Inspect Verified Supplier Standards</span>
                  <Icons.ArrowRight className="w-3.5 h-3.5 text-[#051F16] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Chapter C: Smart Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-800">
                Smart Comparison
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-[#051F16] tracking-tight leading-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Compare bids before you commit a{" "}
                <span className="font-editorial italic font-normal text-[#083A28]">
                  single Rupee.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Side-by-side factory bid analysis normalized across tooling fees,
                unit manufacturing rates, QA drop test protocols, and statutory
                ZED subsidy offsets. You make procurement decisions backed by data.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleProtectedJourney({
                      targetScreen: "startup.comparison",
                      actionType: "view_bidding",
                      actionLabel: "View Side-by-Side Bidding Engine",
                      requiredRole: "startup",
                      portalContext: {
                        badge: "Comparative Bidding",
                        title: "Side-by-Side Bidding Engine",
                        description: "Sign in to compare factory quotes, tooling fees, and turnaround SLAs.",
                        icon: "compare_arrows",
                      },
                    })
                  }
                  className="group inline-flex items-center gap-2 text-xs font-bold text-[#051F16] hover:text-[#083A28] cursor-pointer"
                >
                  <span>View Side-by-Side Bidding Engine</span>
                  <Icons.ArrowRight className="w-3.5 h-3.5 text-[#051F16] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Visual C */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-200 pb-3">
                <span>COMPARATIVE BID ANALYSIS</span>
                <span className="text-emerald-700 font-bold">3 ACTIVE FACTORY OFFERS</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Apex Precision (Bangalore)</div>
                    <div className="text-[11px] text-slate-500">12 Days • ZED Gold • Drop Test 99.4%</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-700">₹72,000</div>
                    <div className="text-[10px] text-slate-400">All Inclusive</div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">Bharat Cartons (Pune)</div>
                    <div className="text-[11px] text-slate-500">14 Days • ISO 9001 • Drop Test 98.8%</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">₹76,500</div>
                    <div className="text-[10px] text-slate-400">All Inclusive</div>
                  </div>
                </div>

                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-rose-900">Traditional Offline Broker</div>
                    <div className="text-[11px] text-rose-600">Unverified Lead Time • No SLA</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-rose-700 line-through">₹1,08,000</div>
                    <div className="text-[10px] text-rose-500">+35% Margin</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter D: Savings Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Visual D */}
            <div className="order-2 lg:order-1 bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-200 pb-3">
                <span>REVERSE MARGIN LEDGER</span>
                <span className="text-emerald-700 font-bold">-₹<CountUpNumber end={36000} /> DIRECT GAIN</span>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Direct Tooling Cost:</span>
                  <span className="font-semibold text-slate-800">₹6,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Unit Production (500 units @ ₹110):</span>
                  <span className="font-semibold text-slate-800">₹55,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Statutory ZED Subsidy Concession:</span>
                  <span className="font-bold text-emerald-600">-₹4,500</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">GST 18% Input Tax Credit Eligible:</span>
                  <span className="font-semibold text-slate-800">₹10,170</span>
                </div>
                <div className="flex justify-between pt-1 text-sm">
                  <span className="font-bold text-[#051F16]">Net Landed Factory Invoice:</span>
                  <span className="font-extrabold text-emerald-700">₹<CountUpNumber end={66670} /></span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-800">
                Savings Intelligence
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-[#051F16] tracking-tight leading-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                See the value MPI creates on{" "}
                <span className="font-editorial italic font-normal text-[#083A28]">
                  every procurement cycle.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                By bypassing layer upon layer of sales reps and broker fees, you
                retain full reverse-margin visibility. Every Rupee saved goes straight
                back into your product development and growth runway.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleProtectedJourney({
                      targetScreen: "startup.analytics",
                      actionType: "explore_savings",
                      actionLabel: "Explore Sourcing Savings",
                      requiredRole: "startup",
                      portalContext: {
                        badge: "Savings Intelligence",
                        title: "Reverse Margin Analytics",
                        description: "Analyze direct factory cost breakdowns, tax credits, and net landed savings.",
                        icon: "savings",
                      },
                    })
                  }
                  className="group inline-flex items-center gap-2 text-xs font-bold text-[#051F16] hover:text-[#083A28] cursor-pointer"
                >
                  <span>Explore Direct Sourcing Savings</span>
                  <Icons.ArrowRight className="w-3.5 h-3.5 text-[#051F16] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. FLAGSHIP CATALOGUE DISCOVERY SECTION ───────────────────────── */}
      <ProductCatalogue
        onQuoteProduct={(prod) => {
          handleProtectedJourney({
            targetScreen: "startup.procurement",
            actionType: "catalog_quote",
            actionLabel: `Request Quote for ${prod.name}`,
            requiredRole: "startup",
            productContext: prod,
            procurementContext: {
              requirementText: `Need sourcing quote for ${prod.name} (${prod.category}) with standard institutional specifications`,
              category: prod.category,
            },
            onExecuteIfAuthenticated: () => {
              setRequirementText(
                `Need sourcing quote for ${prod.name} (${prod.category}) with standard institutional specifications`,
              )
              setSelectedCategory(prod.category as CatalogCategory)
              navigate("startup.procurement")
            },
            portalContext: {
              badge: "Instant Factory Quote",
              title: `Source ${prod.name}`,
              description: `Sign in as a startup buyer to request factory quotes and specifications for ${prod.name}.`,
              icon: "request_quote",
            },
          })
        }}
        onAskAI={(query, cat) => {
          handleProtectedJourney({
            targetScreen: "startup.procurement",
            actionType: "ask_ai",
            actionLabel: "AI Sourcing Assistant",
            requiredRole: "startup",
            procurementContext: {
              requirementText: query,
              category: cat,
            },
            onExecuteIfAuthenticated: () => {
              if (query) setRequirementText(query)
              if (cat) setSelectedCategory(cat as CatalogCategory)
              navigate("startup.procurement")
            },
            portalContext: {
              badge: "AI Specification Assistant",
              title: "Procure with AI Assistant",
              description: "Sign in to parse your custom procurement query into machine-readable specs.",
              icon: "psychology",
            },
          })
        }}
        onExploreWorkspace={() => {
          handleProtectedJourney({
            targetScreen: "startup.procurement",
            actionType: "start_mpi",
            actionLabel: "Explore Procurement Workspace",
            requiredRole: "startup",
            portalContext: {
              badge: "Startup Workspace",
              title: "Launch Procurement Workspace",
              description: "Access the full end-to-end procurement and quotation engine.",
              icon: "rocket_launch",
            },
          })
        }}
      />

      {/* ─── 8. PARTNER / ECOSYSTEM VISUALIZATION SECTION ──────────────────── */}
      <section className="py-20 bg-white border-y border-slate-200/80 scroll-reveal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-800">
            The Connected Ecosystem
          </span>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#051F16] tracking-tight leading-tight"
            style={{ fontFamily: "Plus Jakarta Sans" }}
          >
            MPI unites India's{" "}
            <span className="font-editorial italic font-normal text-[#083A28]">
              manufacturing grid.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Bridging fast-growing tech startups with regional manufacturing clusters,
            statutory subsidy frameworks, certified quality labs, and escrow banking.
          </p>

          {/* Ecosystem Visual Network */}
          <div className="mt-12 p-8 sm:p-12 bg-slate-50/70 rounded-3xl border border-slate-200 relative overflow-hidden">
            {/* Dynamic Animated Vector Bridge Connecting Hub to Network */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none hidden md:block opacity-35"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="bridgeGradient" x1="50%" y1="20%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#A3F65C" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#10B981" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#051F16" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <line x1="50%" y1="120" x2="20%" y2="240" stroke="url(#bridgeGradient)" strokeWidth="2" strokeDasharray="6 6" className="animate-draw-line" />
              <line x1="50%" y1="120" x2="50%" y2="240" stroke="url(#bridgeGradient)" strokeWidth="2" strokeDasharray="6 6" className="animate-draw-line" />
              <line x1="50%" y1="120" x2="80%" y2="240" stroke="url(#bridgeGradient)" strokeWidth="2" strokeDasharray="6 6" className="animate-draw-line" />
            </svg>

            {/* Center Node */}
            <div className="flex flex-col items-center justify-center relative z-10">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#051F16] text-white flex flex-col items-center justify-center border-4 border-white z-10 animate-pulse-hub">
                <span className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: "Plus Jakarta Sans" }}>
                  MPI
                </span>
                <span className="text-[9px] text-[#A3F65C] uppercase tracking-widest font-bold mt-0.5">
                  Core Engine
                </span>
              </div>
            </div>

            {/* Orbiting Satellite Nodes */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 max-w-4xl mx-auto relative z-10">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-left space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <MaterialIcon name="rocket_launch" size={16} className="text-emerald-700" />
                  <span>Startups & D2C Brands</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Natural language intake, fast prototyping, zero advance risk.
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-left space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <MaterialIcon name="precision_manufacturing" size={16} className="text-emerald-700" />
                  <span>MSME Factory Fleet</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  1,240+ Tier-1 manufacturers filling idle machine capacity.
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-left space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <MaterialIcon name="policy" size={16} className="text-emerald-700" />
                  <span>Govt Grant Frameworks</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  ZED Subsidies, SISFS Seed grants, and Design Clinic assistance.
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-left space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <MaterialIcon name="lock" size={16} className="text-[#051F16]" />
                  <span>Milestone Escrow Banking</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Tripartite escrow accounts with QC inspection release gates.
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-left space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <MaterialIcon name="fact_check" size={16} className="text-emerald-700" />
                  <span>Quality Inspection Labs</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Standardized batch drop testing, burst strength, and tolerance audit.
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-left space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <MaterialIcon name="location_city" size={16} className="text-slate-700" />
                  <span>Industrial Hub Corridors</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Peenya, Okhla, Coimbatore, Pune, Sivakasi cluster links.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. INTEGRATION & WORKFLOW CENTER ──────────────────────────────── */}
      <section className="py-20 bg-[#FAFAFC] scroll-reveal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-800">
              Workflow Consolidation
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-[#051F16] tracking-tight leading-tight"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Everything your procurement workflow needs,{" "}
              <span className="font-editorial italic font-normal text-[#083A28]">
                connected in one place.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              From requirement drafting to statutory tax invoices, manage your entire
              supply chain through a single unified command center.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-xs font-bold text-[#051F16] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                01 • Instant RFQ Dispatch
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                Broadcast in Seconds
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send standardized technical RFQs to matched factories without
                calling 15 different agents.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                02 • Capacity Matching
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                Idle Machine Hours
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Take advantage of verified factory downtime to negotiate the best
                possible unit rates.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                03 • Subsidy Automation
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                Claim ZED & SISFS
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatic statutory grant eligibility checks with ready-to-file
                documentation.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <span className="text-xs font-bold text-[#051F16] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                04 • Single Escrow Ledger
              </span>
              <h3 className="font-bold text-slate-900 text-sm">
                Milestone Tracking
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track production phases, batch inspections, and delivery dispatches
                in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. TESTIMONIALS / CREDIBILITY SECTION ────────────────────────── */}
      <section className="py-20 bg-white border-y border-slate-200/80 scroll-reveal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-14">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-800">
              Real Ecosystem Feedback
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-[#051F16] tracking-tight leading-tight"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Trusted by emerging founders and{" "}
              <span className="font-editorial italic font-normal text-[#083A28]">
                Tier-1 manufacturers.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-emerald-600 text-xs">★★★★★</div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "We needed 2,000 custom rigid printed boxes for our D2C organic launch.
                  MPI parsed our requirements in minutes, matched us with a ZED Gold factory
                  in Pune, and saved us ₹38,000 compared to regional packaging agents."
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-900 text-xs">Ananya Deshmukh</div>
                <div className="text-[11px] text-slate-500">Co-founder & COO, Aura Botanicals D2C</div>
              </div>
            </div>

            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-emerald-600 text-xs">★★★★★</div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "Sourcing 5-axis CNC machining with ±0.02mm tolerance for aeronautical
                  6061 aluminum without an 8-month lead time was a nightmare. MPI connected
                  us directly with a precision facility in Peenya within 48 hours."
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-900 text-xs">Vikramaditya Rao</div>
                <div className="text-[11px] text-slate-500">Head of Hardware, Aerovex Drones</div>
              </div>
            </div>

            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex text-emerald-600 text-xs">★★★★★</div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  "Our 6-color offset presses had 30% idle time between major export cycles.
                  MPI connects us to serious startups with structured technical specs and
                  guaranteed escrow payments. It has completely optimized our machine hours."
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-900 text-xs">Rajeshwar Patel</div>
                <div className="text-[11px] text-slate-500">Managing Director, Apex Precision Ltd.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. GOVERNMENT SCHEMES ESTIMATOR (INTERACTIVE TOOL) ───────────── */}
      <section id="government-schemes" className="py-20 bg-[#FAFAFC] scroll-reveal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-800">
                Government Schemes Intelligence
              </span>
              <h2
                className="text-3xl font-extrabold text-[#051F16] tracking-tight leading-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Government Subsidies &{" "}
                <span className="font-editorial italic font-normal text-[#083A28]">
                  Sourcing Grants.
                </span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Indian startups sourcing through certified MSMEs are eligible for statutory
                quality and tooling grants up to 80% under ZED, Design Clinic, and Startup
                India Seed Fund (SISFS) schemes.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleProtectedJourney({
                      targetScreen: "government-schemes.match",
                      actionType: "match_schemes",
                      actionLabel: "Match My Business Schemes",
                      portalContext: {
                        badge: "Government Subsidies",
                        title: "Match Eligible Government Schemes",
                        description: "Sign in to calculate your enterprise eligibility for ZED, SISFS, and Design Clinic subsidies.",
                        icon: "policy",
                      },
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-[#051F16] hover:bg-[#083A28] text-white cursor-pointer shadow-2xs"
                >
                  <span>Match My Business Schemes</span>
                  <Icons.ArrowRight className="w-3.5 h-3.5 text-[#A3F65C]" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("government-schemes.browse")}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  Browse All Schemes
                </button>
              </div>
            </div>

            {/* Interactive Calculator */}
            <div className="lg:col-span-7 bg-[#051F16] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-[#0A3525] space-y-6">
              <div className="flex items-center justify-between border-b border-[#0A3525] pb-3">
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <MaterialIcon name="calculate" size={18} className="text-[#A3F65C]" />
                  <span>Interactive Grant Estimator</span>
                </div>
                <span className="text-[11px] font-mono text-slate-300">
                  DPIIT / MSME Ministry
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-2">
                    <span>Sourcing Category:</span>
                    <select
                      value={calcCategory}
                      onChange={(e) => setCalcCategory(e.target.value as CatalogCategory)}
                      className="text-xs bg-[#0A3525] text-white border border-emerald-900/60 rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                    >
                      <option value="Packaging & Printing">Packaging & Printing (60%)</option>
                      <option value="Prototyping & Product Development">Prototyping & Product Dev (70%)</option>
                      <option value="Compliance & Legal Support">Compliance & Legal Support (80%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
                    <span>Estimated Sourcing Budget:</span>
                    <span className="font-bold text-[#A3F65C] text-sm">
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
                    className="w-full accent-[#A3F65C] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="bg-[#0A3525]/80 p-3.5 rounded-xl border border-emerald-900/40">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Potential Govt Grant
                    </span>
                    <span className="text-lg font-extrabold text-[#A3F65C]">
                      ₹{calculatedSchemeBenefit.amount.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-300 block mt-0.5">
                      Up to {calculatedSchemeBenefit.rate}% Subsidy
                    </span>
                  </div>

                  <div className="bg-[#0A3525]/80 p-3.5 rounded-xl border border-emerald-900/40">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Net Startup Landed Outlay
                    </span>
                    <span className="text-lg font-extrabold text-white">
                      ₹{calculatedSchemeBenefit.netCost.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-300 block mt-0.5">
                      Protected Under Escrow
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 12. FAQ SECTION (CLEAN ACCORDION) ─────────────────────────────── */}
      <section className="py-20 bg-white border-y border-slate-200/80 scroll-reveal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-800">
              Frequently Asked Questions
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-[#051F16] tracking-tight leading-tight"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Everything you need to know{" "}
              <span className="font-editorial italic font-normal text-[#083A28]">
                about MPI.
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm sm:text-base hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <span>{item.q}</span>
                    <MaterialIcon
                      name={isOpen ? "expand_less" : "expand_more"}
                      size={20}
                      className="text-slate-400 shrink-0"
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── 13. HIGH-CONVERSION FINAL CALL TO ACTION ──────────────────────── */}
      <section className="py-24 lg:py-32 bg-[#051F16] text-white relative overflow-hidden">
        {/* Soft Ambient Background Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-t from-emerald-500/20 via-[#A3F65C]/10 to-transparent rounded-full blur-3xl"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <span className="font-mono text-xs uppercase tracking-widest text-[#A3F65C] font-bold">
            Start Your Procurement Journey
          </span>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight"
            style={{ fontFamily: "Plus Jakarta Sans" }}
          >
            Ready to make your procurement{" "}
            <span className="font-editorial italic font-normal text-[#A3F65C]">
              intelligent?
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Join hundreds of Indian startups sourcing packaging, prototyping, digital
            services, and compliance from verified MSME factories today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() =>
                handleProtectedJourney({
                  targetScreen: "startup.procurement",
                  actionType: "start_mpi",
                  actionLabel: "Start a Procurement Request",
                  requiredRole: "startup",
                  portalContext: {
                    badge: "Startup Buyer Portal",
                    title: "Start Sourcing with MPI",
                    description: "Log in or register your startup to access verified Indian manufacturers.",
                    icon: "rocket_launch",
                  },
                })
              }
              className="group inline-flex items-center gap-2.5 px-8 py-4 text-sm font-extrabold rounded-xl bg-[#A3F65C] hover:bg-[#92E64B] active:scale-[0.98] text-[#051F16] shadow-[0_4px_24px_rgba(163,246,92,0.35)] hover:shadow-[0_8px_32px_rgba(163,246,92,0.5)] transition-all cursor-pointer"
            >
              <span>Start a Procurement Request</span>
              <Icons.ArrowRight className="w-4 h-4 text-[#051F16] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() =>
                handleProtectedJourney({
                  targetScreen: "msme.onboarding",
                  actionType: "register_msme",
                  actionLabel: "Register as MSME Supplier",
                  requiredRole: "msme",
                  portalContext: {
                    badge: "MSME Supplier Network",
                    title: "Join India's Verified MSME Network",
                    description: "Register your manufacturing facility, Udyam registration, and machine capacity.",
                    icon: "precision_manufacturing",
                  },
                })
              }
              className="px-8 py-4 text-sm font-bold rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white border border-white/25 hover:border-white/40 transition-all cursor-pointer backdrop-blur-xs"
            >
              Register as MSME Supplier
            </button>
          </div>
        </div>
      </section>

      {/* ─── 14. MINIMAL CLEAN FOOTER (REFERENCE STYLE) ────────────────────── */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-3">
              <div className="font-extrabold text-lg text-[#051F16]" style={{ fontFamily: "Plus Jakarta Sans" }}>
                MPI — Market Procurement Intelligence
              </div>
              <p className="text-slate-500 leading-relaxed text-xs max-w-sm">
                Empowering Indian startups with verified MSME manufacturing capacity,
                reverse-margin price discovery, and milestone escrow guarantees.
              </p>
              <div className="text-[11px] text-slate-400 font-mono pt-1">
                A Make In India & DPIIT Ecosystem Initiative
              </div>
            </div>

            {/* Col 2: Platform */}
            <div className="space-y-2.5">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Platform
              </div>
              <ul className="space-y-2">
                <li>
                  <a href="#marketplace" className="hover:text-[#051F16] transition-colors">
                    Catalogue
                  </a>
                </li>
                <li>
                  <button
                    onClick={() =>
                      handleOpenAuth({
                        mode: "login",
                        defaultRole: "startup",
                        targetScreen: "startup.home",
                        portalContext: {
                          badge: "Startup Buyer Portal",
                          title: "Log in for Startups",
                          description:
                            "Access verified MSME suppliers, AI procurement copilot, live RFQ generator & order escrow.",
                          icon: "rocket_launch",
                        },
                      })
                    }
                    className="hover:text-[#051F16] transition-colors cursor-pointer"
                  >
                    Startup Hub
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      handleOpenAuth({
                        mode: "login",
                        defaultRole: "msme",
                        targetScreen: "msme.home",
                        portalContext: {
                          badge: "MSME Supplier Network",
                          title: "Log in for MSMEs",
                          description:
                            "Access verified OEM purchase orders, active startup tenders, and escrow payments.",
                          icon: "precision_manufacturing",
                        },
                      })
                    }
                    className="hover:text-[#051F16] transition-colors cursor-pointer"
                  >
                    MSME Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      handleOpenAuth({
                        mode: "login",
                        defaultRole: "startup",
                        targetScreen: "government-schemes.match",
                        portalContext: {
                          badge: "Government Schemes Engine",
                          title: "Log in for Government Schemes",
                          description:
                            "Match your enterprise against 30+ central subsidies (SISFS, CGTMSE, ZED) & track disbursements.",
                          icon: "policy",
                        },
                      })
                    }
                    className="hover:text-[#051F16] transition-colors cursor-pointer"
                  >
                    Govt Schemes (30)
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Solutions */}
            <div className="space-y-2.5">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Solutions
              </div>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => { setSelectedCategory("Packaging & Printing"); navigate("startup.procurement") }} className="hover:text-[#051F16] transition-colors cursor-pointer">
                    Packaging Materials
                  </button>
                </li>
                <li>
                  <button onClick={() => { setSelectedCategory("Prototyping & Product Development"); navigate("startup.procurement") }} className="hover:text-[#051F16] transition-colors cursor-pointer">
                    CNC & 3D Prototyping
                  </button>
                </li>
                <li>
                  <button onClick={() => { setSelectedCategory("IT & Digital Services"); navigate("startup.procurement") }} className="hover:text-[#051F16] transition-colors cursor-pointer">
                    IT & Digital Systems
                  </button>
                </li>
                <li>
                  <button onClick={() => { setSelectedCategory("Compliance & Legal Support"); navigate("startup.procurement") }} className="hover:text-[#051F16] transition-colors cursor-pointer">
                    Compliance & Audits
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Portals & Governance */}
            <div className="space-y-2.5">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Governance
              </div>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => navigate("login.admin")} className="hover:text-[#051F16] transition-colors cursor-pointer">
                    Admin Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("analytics.detail.ai-insights")} className="hover:text-[#051F16] transition-colors cursor-pointer">
                    Analytics Studio
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("analytics.support")} className="hover:text-[#051F16] transition-colors cursor-pointer">
                    Support Desk
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate("login.startup")} className="hover:text-[#051F16] transition-colors cursor-pointer">
                    Sign In
                  </button>
                </li>
                <li>
                  <button onClick={openCookiePreferencesModal} className="hover:text-[#051F16] transition-colors cursor-pointer">
                    Cookie Settings
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>© {new Date().getFullYear()} MPI — Market Procurement Intelligence. All rights reserved.</div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Procurement</span>
              <span>•</span>
              <span>Security & Telemetry</span>
              <span>•</span>
              <button
                type="button"
                onClick={openCookiePreferencesModal}
                className="hover:text-[#051F16] transition-colors cursor-pointer underline-offset-2 hover:underline"
              >
                Cookie Settings
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── 15. COMMAND PALETTE MODAL (⌘K) ────────────────────────────────── */}
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
                  handleProtectedJourney({
                    targetScreen: "startup.home",
                    actionType: "launch_workspace",
                    actionLabel: "Startup Procurement Command Center",
                    requiredRole: "startup",
                    portalContext: {
                      badge: "Startup Workspace",
                      title: "Startup Procurement Command Center",
                      description: "Access active RFQs, quotes, and escrow ledgers.",
                      icon: "rocket_launch",
                    },
                  })
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-[#051F16] text-[#A3F65C] flex items-center justify-center font-bold text-xs">
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
                  handleProtectedJourney({
                    targetScreen: "msme.home",
                    actionType: "launch_workspace",
                    actionLabel: "MSME Supplier Hub",
                    requiredRole: "msme",
                    portalContext: {
                      badge: "MSME Supplier Hub",
                      title: "MSME Supplier Command Center",
                      description: "View live RFQs, submit quotes, and manage machine capacity.",
                      icon: "precision_manufacturing",
                    },
                  })
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs">
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
                  navigate("login.admin")
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
                    handleProtectedJourney({
                      targetScreen: "startup.procurement",
                      actionType: "catalog_quote",
                      actionLabel: `Source ${item.name}`,
                      requiredRole: "startup",
                      productContext: item,
                      procurementContext: {
                        requirementText: `Need sourcing quote for ${item.name} (${item.category})`,
                        category: item.category,
                      },
                      onExecuteIfAuthenticated: () => {
                        setRequirementText(`Need sourcing quote for ${item.name} (${item.category})`)
                        setSelectedCategory(item.category as CatalogCategory)
                        navigate("startup.procurement")
                      },
                      portalContext: {
                        badge: "Instant Factory Quote",
                        title: `Source ${item.name}`,
                        description: `Sign in as a startup buyer to initiate RFQ for ${item.name}.`,
                        icon: "request_quote",
                      },
                    })
                  }}
                  className="px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#051F16]">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.category}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 group-hover:underline">
                    Source →
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Press <kbd className="bg-white border border-slate-300 px-1 rounded">ESC</kbd> to close
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
        initialRole={authModal.initialRole}
        targetScreen={authModal.targetScreen}
        portalContext={authModal.portalContext}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        onAuthSuccess={handleAuthSuccess}
        navigate={navigate}
      />

      {/* Role Mismatch Safeguard Modal */}
      <RoleMismatchModal
        isOpen={roleMismatch.open}
        currentRole={roleMismatch.currentRole}
        requiredRole={roleMismatch.requiredRole}
        actionName={roleMismatch.actionName}
        onClose={() => setRoleMismatch((prev) => ({ ...prev, open: false }))}
        onSwitchAccount={handleSwitchAccountFromMismatch}
        onContinueCurrentRole={handleContinueCurrentRoleFromMismatch}
      />
    </div>
  )
}
