import { useState } from "react"
import { NavProps } from "../../App"
import {
  useProcurement,
  StartupBusinessProfile,
} from "../../context/ProcurementContext"
import { CATALOG_CATEGORIES, CatalogCategory } from "../../lib/mpiCatalog"
import {
  Icons,
  MPIButton,
} from "../../components/design-system/MPIDesignSystem"
import { MPILogo } from "../../components/shared"
import { mockRegister } from "../../lib/mockAuth"

const STAGES = [
  {
    id: "Idea",
    label: "Idea Stage",
    desc: "Validating concept, problem-solution fit, no physical prototype yet",
  },
  {
    id: "Prototype",
    label: "Prototyping",
    desc: "Building initial hardware/software mockups and testing proof-of-concept",
  },
  {
    id: "MVP",
    label: "MVP / Pilot Batch",
    desc: "First production run of 100-1,000 units testing with real end customers",
  },
  {
    id: "Early Revenue",
    label: "Early Revenue",
    desc: "Consistent customer orders, recurring procurement batches, repeatable demand",
  },
  {
    id: "Traction",
    label: "Traction",
    desc: "Rapidly increasing batch sizes, multi-channel distribution (retail, D2C, marketplaces)",
  },
  {
    id: "Growth",
    label: "Growth & Scaling",
    desc: "High-volume contract manufacturing, vendor tiering, cost optimization",
  },
] as const

const SUBCATEGORY_MAP: Record<CatalogCategory, string[]> = {
  "Packaging & Printing": [
    "Rigid Luxury Gift Boxes",
    "Corrugated Shipping Cartons",
    "Custom Screenprinted Glass Bottles",
    "Custom EVA Foam Inserts",
    "Product Labels & Stickers",
    "Biodegradable Mailer Bags",
  ],
  "Prototyping & Product Development": [
    "SLS & SLA 3D Printing",
    "CNC Precision Machining",
    "Sheet Metal Fabrication",
    "PCB Assembly (PCBA)",
    "Injection Molding Tooling",
    "Silicone Mold Vacuum Casting",
  ],
  "IT & Digital Services": [
    "Next.js Web Applications",
    "Mobile Apps (iOS & Android)",
    "ERP & Supply Chain Portals",
    "DevOps & Cloud Infrastructure",
    "Cybersecurity Audit",
  ],
  "Compliance & Legal Support": [
    "ISO 9001 / 14001 Certification",
    "Patent & Trademark Filing (IPR)",
    "FSSAI & Regulatory Approvals",
    "ZED Quality Certification Audit",
    "Statutory Contract Drafting",
  ],
  "Marketing & Sales Support": [
    "D2C Packaging Design & Branding",
    "Industrial 3D CAD Rendering",
    "Retail Display Standees",
    "Product Photography & Video",
  ],
  "Business & Finance Services": [
    "Virtual CFO & Cost Accounting",
    "Government Subsidy Auditing",
    "Startup Valuation & Cap Table",
    "Statutory GST & Tax Filing",
  ],
  "Specialized Startup Support": [
    "NABL Lab Material Testing",
    "ISTA-1A Drop & Transit Testing",
    "Cleanroom Component Assembly",
    "Accelerated Shelf-Life Testing",
  ],
}

const SCHEME_INTEREST_OPTIONS = [
  "ZED Quality Certification Subsidy (Up to 80% Reimbursement)",
  "Design Clinic Sourcing Assistance (Up to ₹9L for Packaging & Tooling)",
  "Startup India Seed Fund Scheme (SISFS - Up to ₹20L Prototype Grant)",
  "SIPP Patent & Trademark Filing Fee Rebate (80% Govt Concession)",
  "CGTMSE Collateral-Free Bank Credit Guarantee (Up to ₹5 Crore)",
  "International Trade Fair & Sample Freight Subsidy (Up to ₹4.5L)",
]

export default function StartupOnboarding({ navigate, goBack }: NavProps) {
  const { startupProfile, updateStartupProfile } = useProcurement()

  // Current Step (1 to 9)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 9

  const googleUser = (() => {
    try {
      const raw = localStorage.getItem("mpi_active_user")
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()

  // Form State initialized from startupProfile or Google session
  const [founderName, setFounderName] = useState(
    startupProfile.founderName || googleUser?.name || "",
  )
  const [startupName, setStartupName] = useState(
    startupProfile.startupName || googleUser?.orgName || googleUser?.companyName || "",
  )
  const [email, setEmail] = useState(startupProfile.email || googleUser?.email || "")
  const [phone, setPhone] = useState(startupProfile.phone || "")
  const [city, setCity] = useState(startupProfile.city || "Bengaluru")
  const [state, setState] = useState(startupProfile.state || "Karnataka")

  const [stage, setStage] = useState<StartupBusinessProfile["stage"]>(
    startupProfile.stage || "MVP",
  )

  const [industry, setIndustry] = useState(
    startupProfile.industry || "D2C Consumer Goods & Skincare",
  )
  const [productsSold, setProductsSold] = useState(
    startupProfile.productsSold ||
      "Organic luxury serums and clean beauty cosmetics",
  )

  const [procurementCategories, setProcurementCategories] =
    useState<CatalogCategory[]>(
      startupProfile.procurementCategories || [
        "Packaging & Printing",
        "Prototyping & Product Development",
      ],
    )
  const [procurementSubcategories, setProcurementSubcategories] =
    useState<string[]>(
      startupProfile.procurementSubcategories || [
        "Rigid Luxury Gift Boxes",
        "Custom EVA Foam Inserts",
      ],
    )
  const [procurementDescription, setProcurementDescription] = useState(
    startupProfile.procurementDescription ||
      "Custom rigid boxes with magnetic flap, foil stamping, batch size 500-1,000 units",
  )

  const [annualBudget, setAnnualBudget] = useState<number>(
    startupProfile.annualProcurementBudget || 750000,
  )
  const [turnaroundPriority, setTurnaroundPriority] =
    useState<StartupBusinessProfile["turnaroundPriority"]>(
      startupProfile.turnaroundPriority || "Standard",
    )

  const [fundingStage, setFundingStage] =
    useState<StartupBusinessProfile["fundingStage"]>(
      startupProfile.fundingStage || "Seed",
    )
  const [hasDpiit, setHasDpiit] = useState<boolean>(
    startupProfile.hasDpiit ?? true,
  )
  const [dpiitNumber, setDpiitNumber] = useState(
    startupProfile.dpiitNumber || "DPIIT-STP-2024-88412",
  )
  const [teamSize, setTeamSize] = useState(
    startupProfile.teamSize || "5-15 employees",
  )

  const [governmentInterests, setGovernmentInterests] = useState<string[]>(
    startupProfile.governmentInterests || [
      "ZED Quality Certification Subsidy (Up to 80% Reimbursement)",
      "Design Clinic Sourcing Assistance (Up to ₹9L for Packaging & Tooling)",
    ],
  )

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Category toggle helper
  const toggleCategory = (cat: CatalogCategory) => {
    setProcurementCategories((prev) =>
      prev.includes(cat)
        ? prev.length > 1
          ? prev.filter((c) => c !== cat)
          : prev
        : [...prev, cat],
    )
  }

  const toggleSubcategory = (sub: string) => {
    setProcurementSubcategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub],
    )
  }

  const toggleSchemeInterest = (scheme: string) => {
    setGovernmentInterests((prev) =>
      prev.includes(scheme)
        ? prev.filter((s) => s !== scheme)
        : [...prev, scheme],
    )
  }

  // Step Validation
  const validateCurrentStep = (): boolean => {
    setErrorMessage("")
    if (currentStep === 1) {
      if (!founderName.trim() || !startupName.trim() || !email.trim()) {
        setErrorMessage(
          "Please provide Founder Name, Startup Name, and Business Email.",
        )
        return false
      }
    }
    if (currentStep === 3) {
      if (!industry.trim() || !productsSold.trim()) {
        setErrorMessage(
          "Please fill in your primary industry and product description.",
        )
        return false
      }
    }
    if (currentStep === 4) {
      if (procurementCategories.length === 0) {
        setErrorMessage("Please select at least one procurement category.")
        return false
      }
    }
    if (currentStep === 9) {
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters.")
        return false
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.")
        return false
      }
      if (!agreedTerms) {
        setErrorMessage("Please accept the MPI Terms of Service.")
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!validateCurrentStep()) return

    setIsSubmitting(true)
    setErrorMessage("")

    const newProfile: StartupBusinessProfile = {
      founderName,
      startupName,
      email,
      phone,
      city,
      state,
      stage,
      industry,
      productsSold,
      procurementCategories,
      procurementSubcategories,
      procurementDescription,
      annualProcurementBudget: annualBudget,
      turnaroundPriority,
      fundingStage,
      hasDpiit,
      dpiitNumber: hasDpiit ? dpiitNumber : undefined,
      teamSize,
      governmentInterests,
      createdAt: new Date().toISOString().split("T")[0],
    }

    updateStartupProfile(newProfile)

    // Register with mock auth
    await mockRegister("startup", {
      name: founderName,
      orgName: startupName,
      email,
      password,
      confirmPassword,
    })

    setIsSubmitting(false)
    navigate("startup.home")
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1220] flex flex-col font-sans selection:bg-[#F97316] selection:text-white">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => navigate("home")}
            className="hover:opacity-85 transition-opacity text-left cursor-pointer shrink-0"
          >
            <MPILogo small />
          </button>

          {/* Back Button */}
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shrink-0"
            title="Go back"
          >
            <Icons.ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="min-w-0">
            {/* Interactive Clickable Breadcrumbs */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
              <button
                onClick={() => navigate("home")}
                className="hover:text-slate-900 hover:underline cursor-pointer shrink-0"
              >
                Home
              </button>
              <span>/</span>
              <span className="text-[#0B1F4B] font-semibold truncate">
                Startup Onboarding
              </span>
            </div>

            <div className="text-xs sm:text-sm font-bold text-[#0B1F4B] truncate">
              Startup & Buyer Onboarding Protocol (9 Steps)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => navigate("home")}
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>🏠</span>
            <span>Marketplace</span>
          </button>
          <button
            onClick={() => navigate("login.startup")}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Log In →
          </button>
        </div>
      </header>

      {/* ── Progress Bar ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#0B1F4B] text-white flex items-center justify-center font-bold text-xs">
              {currentStep}
            </span>
            <span className="text-xs font-extrabold text-[#0B1F4B]">
              Step {currentStep} of {totalSteps}:{" "}
              {currentStep === 1 && "Basic Startup Info"}
              {currentStep === 2 && "Maturity Stage"}
              {currentStep === 3 && "Products Built & Sold"}
              {currentStep === 4 && "What You Procure"}
              {currentStep === 5 && "Procurement Budget & Urgency"}
              {currentStep === 6 && "Funding & Growth"}
              {currentStep === 7 && "Government Scheme Priorities"}
              {currentStep === 8 && "Review Profile & Scheme Matches"}
              {currentStep === 9 && "Create Account Credentials"}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>

        <div className="max-w-4xl mx-auto w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
          <div
            className="bg-[#F97316] h-full rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Form Card Container ────────────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <Icons.AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: BASIC STARTUP DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                  Step 1 · Basic Details
                </span>
                <h1
                  className="text-2xl font-extrabold text-[#0B1F4B] mt-1"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  Tell us about yourself and your startup
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  We use this to calibrate your procurement workspace and tailor
                  anonymized RFQ negotiations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Founder / Lead Name *
                  </label>
                  <input
                    type="text"
                    value={founderName}
                    onChange={(e) => setFounderName(e.target.value)}
                    placeholder="e.g. Aarav Mehta"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Startup Legal / Brand Name *
                  </label>
                  <input
                    type="text"
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    placeholder="e.g. TechNova Innovations"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Work / Business Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@company.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Operating City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: STARTUP STAGE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                  Step 2 · Maturity Stage
                </span>
                <h1
                  className="text-2xl font-extrabold text-[#0B1F4B] mt-1"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  What stage is your startup currently in?
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Helps our AI determine whether to prioritize prototyping
                  suppliers, batch MOQs, or mass production toolrooms.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {STAGES.map((s) => {
                  const isSelected = stage === s.id
                  return (
                    <div
                      key={s.id}
                      onClick={() => setStage(s.id as any)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#0B1F4B] bg-blue-50/40 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-sm text-[#0B1F4B]">
                          {s.label}
                        </div>
                        {isSelected && (
                          <span className="text-blue-700 font-bold">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 3: WHAT YOU BUILD / SELL */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                  Step 3 · Product Line
                </span>
                <h1
                  className="text-2xl font-extrabold text-[#0B1F4B] mt-1"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  What products does your startup build and sell?
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Specify your industry sector and describe your physical goods,
                  hardware, or consumer products.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Industry Sector *
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. D2C Skincare, IoT Devices, EV Components, HealthTech"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Core Product Description & Value Proposition *
                  </label>
                  <textarea
                    rows={4}
                    value={productsSold}
                    onChange={(e) => setProductsSold(e.target.value)}
                    placeholder="e.g. Connected air purification monitors with injection-molded casings and custom rigid retail packaging..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: WHAT YOU BUY / PROCURE */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                  Step 4 · Procurement Categories
                </span>
                <h1
                  className="text-2xl font-extrabold text-[#0B1F4B] mt-1"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  What do you need to procure from verified MSMEs?
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Select your core categories and specific items across our
                  verified catalog.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Select from 7 MPI Catalog Categories:
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATALOG_CATEGORIES.map((cat) => {
                    const isSelected = procurementCategories.includes(cat)
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`text-xs px-3.5 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#F97316] text-white border-[#F97316] shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Specific Subcategories */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Specific Components / Services Needed:
                </label>
                <div className="flex flex-wrap gap-2">
                  {procurementCategories
                    .flatMap((cat) => SUBCATEGORY_MAP[cat] || [])
                    .map((sub) => {
                      const isSelected = procurementSubcategories.includes(sub)
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSubcategory(sub)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#0B1F4B] text-white border-[#0B1F4B] shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {sub}
                        </button>
                      )
                    })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Natural Language Procurement Description:
                </label>
                <textarea
                  rows={3}
                  value={procurementDescription}
                  onChange={(e) => setProcurementDescription(e.target.value)}
                  placeholder="Describe dimensions, materials, or special tolerances in your own words..."
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 bg-slate-50"
                />
              </div>
            </div>
          )}

          {/* STEP 5: PROCUREMENT NEEDS & BUDGET */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                  Step 5 · Budget & Turnaround
                </span>
                <h1
                  className="text-2xl font-extrabold text-[#0B1F4B] mt-1"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  What is your procurement budget and delivery speed?
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Enables MPI reverse-margin pricing to benchmark against
                  current industrial commodity indices.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      Estimated Annual Procurement Budget:
                    </label>
                    <span className="text-sm font-extrabold text-[#0B1F4B] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      ₹{annualBudget.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={5000000}
                    step={25000}
                    value={annualBudget}
                    onChange={(e) => setAnnualBudget(Number(e.target.value))}
                    className="w-full accent-[#F97316] cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>₹50,000 (Early batches)</span>
                    <span>₹50,00,000+ (High volume)</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Turnaround Urgency:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        id: "Standard",
                        label: "Standard (14-21 days)",
                        desc: "Optimized for best unit economics",
                      },
                      {
                        id: "Urgent (<10 days)",
                        label: "Urgent Express (<10 days)",
                        desc: "Priority production slot required",
                      },
                      {
                        id: "Cost Priority",
                        label: "Lowest Cost Priority",
                        desc: "Willing to accept longer lead times for lowest price",
                      },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTurnaroundPriority(p.id as any)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          turnaroundPriority === p.id
                            ? "bg-[#0B1F4B] text-white border-[#0B1F4B] shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-bold text-xs">{p.label}</div>
                        <div className="text-[10px] opacity-80 mt-1">
                          {p.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: FUNDING & GROWTH */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                  Step 6 · Funding & Scale
                </span>
                <h1
                  className="text-2xl font-extrabold text-[#0B1F4B] mt-1"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  What is your funding status and organization scale?
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  DPIIT recognized startups unlock fast-track patent rebates and
                  non-dilutive seed fund grants.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Current Funding Round:
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {([
                      "Bootstrapped",
                      "Angel / Pre-Seed",
                      "Seed",
                      "Series A+",
                    ] as const).map((fs) => (
                      <button
                        key={fs}
                        type="button"
                        onClick={() => setFundingStage(fs)}
                        className={`py-2.5 px-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          fundingStage === fs
                            ? "bg-[#0B1F4B] text-white border-[#0B1F4B] shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {fs}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDpiit}
                      onChange={(e) => setHasDpiit(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">
                        DPIIT Recognized Startup
                      </span>
                      <span className="text-slate-500 block text-[11px]">
                        Unlocks up to ₹20L SISFS Grant and 80% IPR fee rebates
                      </span>
                    </div>
                  </label>

                  {hasDpiit && (
                    <div className="pt-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        DPIIT Certificate / Recognition Number:
                      </label>
                      <input
                        type="text"
                        value={dpiitNumber}
                        onChange={(e) => setDpiitNumber(e.target.value)}
                        placeholder="e.g. DPIIT-STP-2024-88412"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Team Size:
                  </label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs bg-white font-medium"
                  >
                    <option value="1-5 founders & core team">
                      1-5 founders & core team
                    </option>
                    <option value="5-15 employees">5-15 employees</option>
                    <option value="15-50 scaling organization">
                      15-50 scaling organization
                    </option>
                    <option value="50+ enterprise startup">
                      50+ enterprise startup
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: GOVERNMENT SUPPORT NEEDS */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                  Step 7 · Government Scheme Priorities
                </span>
                <h1
                  className="text-2xl font-extrabold text-[#0B1F4B] mt-1"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  Which statutory central schemes do you wish to leverage?
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  MPI automatically pre-populates your qualified schemes onto
                  your quotation matrix and supplier purchase orders.
                </p>
              </div>

              <div className="space-y-2.5">
                {SCHEME_INTEREST_OPTIONS.map((sch) => {
                  const isChecked = governmentInterests.includes(sch)
                  return (
                    <label
                      key={sch}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-blue-50/50 border-blue-300 shadow-2xs"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSchemeInterest(sch)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                      />
                      <span className="text-xs font-semibold text-slate-800 leading-snug">
                        {sch}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 8: REVIEW PROFILE & PREVIEW */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                  Step 8 · Profile Verification
                </span>
                <h1
                  className="text-2xl font-extrabold text-[#0B1F4B] mt-1"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  Review your startup procurement profile
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Everything looks primed for launch. Review your details below
                  before generating your workspace.
                </p>
              </div>

              {/* Profile Card Preview */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full inline-block mb-1">
                      {stage} Stage Startup
                    </div>
                    <h2 className="text-xl font-extrabold text-[#0B1F4B]">
                      {startupName}
                    </h2>
                    <div className="text-xs text-slate-600">
                      {industry} · {city}, {state}
                    </div>
                  </div>

                  {hasDpiit && (
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-blue-900 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded">
                        DPIIT Verified
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {dpiitNumber}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-slate-200 pt-3">
                  <div>
                    <span className="font-semibold text-slate-500">
                      Founder:
                    </span>{" "}
                    <span className="font-bold text-slate-900">
                      {founderName}
                    </span>{" "}
                    ({email})
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">
                      Est. Procurement Budget:
                    </span>{" "}
                    <span className="font-bold text-slate-900">
                      ₹{annualBudget.toLocaleString("en-IN")}/yr
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Target Procurement Categories:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {procurementCategories.map((c) => (
                      <span
                        key={c}
                        className="text-xs bg-white border border-slate-300 font-semibold px-2.5 py-1 rounded-md"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {governmentInterests.length > 0 && (
                  <div className="border-t border-slate-200 pt-3">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Target Schemes To Pass-Through:
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {governmentInterests.map((gi) => (
                        <li key={gi} className="flex items-center gap-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{gi}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 9: CREATE ACCOUNT CREDENTIALS */}
          {currentStep === 9 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                  Step 9 · Account Security
                </span>
                <h1
                  className="text-2xl font-extrabold text-[#0B1F4B] mt-1"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  Create your password to finalize your workspace
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  You will use this password alongside <strong>{email}</strong>{" "}
                  to access your MPI buyer portal.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Create Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    I agree to the{" "}
                    <strong>MPI Procurement Code of Conduct</strong> and
                    acknowledge that supplier identities remain anonymized until
                    purchase order escrow release.
                  </span>
                </label>
              </div>

              <div className="pt-4">
                <MPIButton
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Creating Your Profile..."
                    : "Complete Onboarding & Enter MPI Workspace →"}
                </MPIButton>
              </div>
            </form>
          )}

          {/* ── Action Buttons Footer ────────────────────────────────────────── */}
          {currentStep < 9 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                  currentStep === 1
                    ? "text-slate-300 border-slate-100 cursor-not-allowed"
                    : "text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                ← Back
              </button>

              <MPIButton variant="primary" onClick={handleNext}>
                <span>Continue to Step {currentStep + 1}</span>
                <Icons.ArrowRight className="w-4 h-4" />
              </MPIButton>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
