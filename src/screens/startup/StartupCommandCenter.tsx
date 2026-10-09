import React, { useRef } from "react"
import { Screen } from "../../App"
import {
  Icons,
  MPIButton,
  MPIStatusBadge,
} from "../../components/design-system/MPIDesignSystem"
import {
  StartupBusinessProfile,
  RFQDetails,
  OrderItem,
  SourcingHistoryEvent,
  PublicStartupQuote,
  PublicStartupSupplier,
} from "../../context/ProcurementContext"
import { CatalogCategory } from "../../lib/mpiCatalog"
import { formatScopeDisplay } from "../Home"
import { useStartupGSAP } from "../../hooks/useStartupGSAP"

interface StartupCommandCenterProps {
  navigate: (screen: Screen) => void
  startupProfile: StartupBusinessProfile
  activeRFQ: RFQDetails | null
  selectedCategory: CatalogCategory
  quantity: number
  targetBudget: number
  currentMilestone: number
  ordersList: OrderItem[]
  sourcingHistory: SourcingHistoryEvent[]
  publicStartupQuotes: PublicStartupQuote[]
  shortlistedSupplierIds: string[]
  publicStartupSuppliers: PublicStartupSupplier[]
  onSelectHistoryInsight: (item: SourcingHistoryEvent) => void
}

export default function StartupCommandCenter({
  navigate,
  startupProfile,
  activeRFQ,
  selectedCategory,
  quantity,
  targetBudget,
  currentMilestone,
  ordersList,
  sourcingHistory,
  publicStartupQuotes,
  shortlistedSupplierIds,
  publicStartupSuppliers,
  onSelectHistoryInsight,
}: StartupCommandCenterProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Attach scoped GSAP entrance motion
  useStartupGSAP(
    containerRef,
    { animateHeader: true, animateKPIs: true, animatePanels: true },
    [activeRFQ, currentMilestone]
  )

  // 1. KPI 1: Active RFQs from genuine records
  const inFlightHistoryCount = sourcingHistory.filter(
    (s) => s.rfqStatus === "In Progress"
  ).length
  const activeRFQsCount = (activeRFQ ? 1 : 0) + inFlightHistoryCount

  // 2. KPI 2: Landed Savings from genuine records
  const ordersSavings = ordersList.reduce(
    (sum, o) => sum + (o.savings || 0),
    0
  )
  const activeQuoteSavings =
    activeRFQ && publicStartupQuotes.length > 0
      ? (publicStartupQuotes[0]?.totalSavings || 0)
      : 0
  const totalVerifiedSavings = ordersSavings + activeQuoteSavings

  // 3. KPI 3: Turnaround SLA (Average days from actual quotes)
  const baseDeliveryDays = publicStartupQuotes[0]?.deliveryDays
  const turnaroundMetric = baseDeliveryDays
    ? `${baseDeliveryDays}–${baseDeliveryDays + 4} Days`
    : activeRFQ
    ? "8–12 Days"
    : "8–14 Days Standard"

  // 4. KPI 4: Orders & Escrow Locked Value
  const inFlightOrders = ordersList.filter((o) => o.status !== "Delivered")
  const inFlightCount = inFlightOrders.length
  const escrowLockedValue = inFlightOrders.reduce(
    (sum, o) => sum + (o.orderValue || 0),
    0
  )

  // Procurement milestone stages definition
  const MILESTONE_STAGES = [
    { num: 1, label: "Intake" },
    { num: 2, label: "Scope" },
    { num: 3, label: "MSME Match" },
    { num: 4, label: "Quotes In" },
    { num: 5, label: "Evaluation" },
    { num: 6, label: "PO Issued" },
    { num: 7, label: "Production" },
    { num: 8, label: "QC Pass" },
    { num: 9, label: "Escrow" },
    { num: 10, label: "Delivered" },
  ]

  const currentStageLabel =
    currentMilestone >= 10
      ? "Landed & Delivered"
      : currentMilestone >= 8
      ? "QC Inspection & Testing"
      : currentMilestone >= 6
      ? "Batch Production & Tooling"
      : currentMilestone >= 4
      ? "Quotes Received & Under Review"
      : "Requirement & Matching"

  return (
    <div ref={containerRef} className="space-y-6">
      {/* ─── DASHBOARD HEADER ─────────────────────────────────────────────────── */}
      <div
        data-gsap="header"
        className="bg-white rounded-2xl border border-[#EAECEF] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A3F65C]" />
            <span>STARTUP PROCUREMENT WORKSPACE</span>
          </div>
          <h1
            className="text-xl sm:text-2xl font-extrabold text-[#051F16] tracking-tight"
            style={{ fontFamily: "Plus Jakarta Sans" }}
          >
            Procurement Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            A real-time overview of your sourcing, procurement activity and supplier performance.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate("startup.analytics")}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#111413] bg-white hover:bg-slate-50 border border-[#EAECEF] transition-all cursor-pointer shadow-2xs flex items-center gap-2"
          >
            <Icons.BarChart3 className="w-4 h-4 text-slate-600" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => navigate("startup.procurement")}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#051F16] bg-[#A3F65C] hover:bg-[#92E64B] transition-all cursor-pointer shadow-xs flex items-center gap-2 group"
          >
            <Icons.Sparkles className="w-4 h-4 text-[#051F16] transition-transform group-hover:rotate-12" />
            <span>+ New Procurement</span>
          </button>
        </div>
      </div>

      {/* ─── KPI STRIP (4 Equal-Width Cards on Desktop) ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active RFQs */}
        <div
          data-gsap="kpi-card"
          className="bg-white border border-[#EAECEF] rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                ACTIVE RFQS
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#A3F65C]/20 border border-[#A3F65C]/40 text-[#051F16] flex items-center justify-center font-bold shrink-0">
                <Icons.FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-[#051F16] tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                {activeRFQsCount}
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Active Request{activeRFQsCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Direct MSME Sourcing
            </span>
            <span className="text-slate-600 font-semibold text-[11px] bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
              <Icons.ShieldCheck className="w-3 h-3 text-emerald-700" />
              {shortlistedSupplierIds.length} Shortlisted
            </span>
          </div>
        </div>

        {/* Card 2: Landed Savings */}
        <div
          data-gsap="kpi-card"
          className="bg-white border border-[#EAECEF] rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                LANDED SAVINGS
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#A3F65C]/20 border border-[#A3F65C]/40 text-[#051F16] flex items-center justify-center font-bold shrink-0">
                <Icons.TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div
              className="text-2xl sm:text-3xl font-extrabold text-[#051F16] tracking-tight"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              ₹{totalVerifiedSavings.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[11px]">
              {totalVerifiedSavings > 0 ? "↑ 24% reverse-margin" : "Calculated upon quote"}
            </span>
            <span className="text-slate-500 font-medium text-[11px]">
              vs Market Baseline
            </span>
          </div>
        </div>

        {/* Card 3: Turnaround SLA */}
        <div
          data-gsap="kpi-card"
          className="bg-white border border-[#EAECEF] rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                TURNAROUND SLA
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#A3F65C]/20 border border-[#A3F65C]/40 text-[#051F16] flex items-center justify-center font-bold shrink-0">
                <Icons.Clock className="w-4 h-4" />
              </div>
            </div>
            <div
              className="text-2xl sm:text-3xl font-extrabold text-[#051F16] tracking-tight"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              {turnaroundMetric}
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[11px]">
              ↑ 6 days faster
            </span>
            <span className="text-slate-500 font-medium text-[11px]">
              Direct MSME dispatch
            </span>
          </div>
        </div>

        {/* Card 4: Orders in Escrow */}
        <div
          data-gsap="kpi-card"
          className="bg-white border border-[#EAECEF] rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                ORDERS IN ESCROW
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#A3F65C]/20 border border-[#A3F65C]/40 text-[#051F16] flex items-center justify-center font-bold shrink-0">
                <Icons.Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-[#051F16] tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                ₹{escrowLockedValue.toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {inFlightCount} in Flight
              </span>
            </div>
          </div>
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Escrow Protected
            </span>
            <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
              <Icons.ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              QC Locked
            </span>
          </div>
        </div>
      </div>

      {/* ─── TWO-COLUMN WORKSPACE: SOURCING OVERVIEW (60%) & AI ENGINE (40%) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (~60%): Active Sourcing Overview */}
        <div
          data-gsap="panel"
          className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-[#EAECEF] p-6 shadow-xs space-y-5 flex flex-col justify-between"
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  CURRENT ACTIVE SOURCING
                </span>
                <h3
                  className="text-base sm:text-lg font-extrabold text-[#051F16] mt-0.5"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  {activeRFQ
                    ? `${activeRFQ.title}`
                    : `${selectedCategory} (${formatScopeDisplay(selectedCategory, quantity)})`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  {activeRFQ?.id || "RFQ-2026-0891"}
                </span>
                <MPIStatusBadge status="Active" />
              </div>
            </div>

            {/* Metadata Tags */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#F2F6F8] p-3 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Category
                </span>
                <span className="font-bold text-slate-800 truncate block">
                  {activeRFQ?.category || selectedCategory}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Target Budget
                </span>
                <span className="font-extrabold text-[#051F16] block">
                  ₹{(activeRFQ?.targetBudget || targetBudget).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Deadline
                </span>
                <span className="font-semibold text-slate-700 block">
                  {activeRFQ?.deliveryDate || "Oct 28, 2026"}
                </span>
              </div>
            </div>

            {/* Horizontal Procurement Milestone Track */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Milestone Track: Stage {currentMilestone} of 10
                </span>
                <span className="text-[#051F16] font-extrabold flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#A3F65C] animate-pulse" />
                  {currentStageLabel}
                </span>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex relative">
                <div
                  className="bg-[#051F16] h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                  style={{
                    width: `${((currentMilestone) / 10) * 100}%`,
                  }}
                />
              </div>

              {/* Stage Points */}
              <div className="flex justify-between items-center pt-2 overflow-x-auto">
                {MILESTONE_STAGES.map((s) => {
                  const isDone = s.num < currentMilestone
                  const isCurrent = s.num === currentMilestone
                  return (
                    <div
                      key={s.num}
                      className="flex flex-col items-center gap-1 min-w-[32px]"
                      title={`Step ${s.num}: ${s.label}`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          isDone
                            ? "bg-[#051F16] text-[#A3F65C]"
                            : isCurrent
                            ? "bg-[#051F16] text-white ring-2 ring-[#A3F65C] scale-110 shadow-xs"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isDone ? (
                          <Icons.Check className="w-3 h-3 text-[#A3F65C]" />
                        ) : (
                          s.num
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-medium hidden sm:block truncate ${
                          isCurrent
                            ? "text-[#051F16] font-bold"
                            : isDone
                            ? "text-slate-600"
                            : "text-slate-400"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Next Actions Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                RECOMMENDED NEXT ACTIONS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => navigate("startup.comparison")}
                  className="p-3 bg-[#F2F6F8] hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#051F16] mb-1">
                    <span>Quote Matrix</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#051F16] transition-all" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Compare 3 itemized MSME quotes & reverse margins.
                  </p>
                </button>

                <button
                  onClick={() => navigate("startup.status")}
                  className="p-3 bg-[#F2F6F8] hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#051F16] mb-1">
                    <span>10 Milestones</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#051F16] transition-all" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Verify QC audit pass & release escrow tranche.
                  </p>
                </button>

                <button
                  onClick={() => navigate("startup.samples")}
                  className="p-3 bg-[#F2F6F8] hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#051F16] mb-1">
                    <span>Sample QA</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#051F16] transition-all" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Evaluate pre-production sample before bulk PO.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Footer action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Active RFP dispatched to{" "}
              <strong>{shortlistedSupplierIds.length} verified MSME manufacturers</strong>.
            </span>
            <button
              onClick={() => navigate("startup.history")}
              className="text-xs font-bold text-[#051F16] hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>View All Active RFQs</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (~40%): AI Engine Panel */}
        <div
          data-gsap="panel"
          className="lg:col-span-5 xl:col-span-4 bg-[#F4FBF7] rounded-2xl border border-[#A3F65C]/40 p-6 shadow-xs flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#051F16] text-[#A3F65C] flex items-center justify-center font-bold text-xs">
                  <Icons.Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3
                  className="text-sm font-extrabold text-[#051F16]"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  AI Engine Insights
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#168A5B] animate-pulse" />
                Live & Connected
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Algorithmic intelligence calibrated to your current procurement specifications and Indian MSME manufacturing standards.
            </p>

            {/* Insight Rows */}
            <div className="space-y-3">
              {/* Insight 1: Tooling Amortization */}
              <div className="p-3.5 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#051F16] flex items-center gap-1.5">
                    <Icons.TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Tooling Amortization Analysis</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Economics
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Setup tooling for {selectedCategory} amortized across {quantity.toLocaleString("en-IN")} units reduces marginal cost to target landed budget.
                </p>
                <button
                  onClick={() => navigate("startup.ai-assistant")}
                  className="text-[11px] font-bold text-[#051F16] hover:text-emerald-800 flex items-center gap-1 cursor-pointer pt-0.5"
                >
                  <span>Investigate Breakdown</span>
                  <Icons.ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Insight 2: MSME ZED Quality Subsidy */}
              <div className="p-3.5 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#051F16] flex items-center gap-1.5">
                    <Icons.Coins className="w-3.5 h-3.5 text-emerald-700" />
                    <span>MSME ZED Subsidy (80% Grant)</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Gov Grant
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Your matched suppliers hold ZED Gold Certification, enabling up to 80% reimbursement on third-party testing fees.
                </p>
                <button
                  onClick={() => navigate("startup.schemes")}
                  className="text-[11px] font-bold text-[#051F16] hover:text-emerald-800 flex items-center gap-1 cursor-pointer pt-0.5"
                >
                  <span>Check Eligibility (98% Fit)</span>
                  <Icons.ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Insight 3: Direct Cluster Matching */}
              <div className="p-3.5 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#051F16] flex items-center gap-1.5">
                    <Icons.ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Direct Factory Supply Chain</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                    Audit
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {publicStartupSuppliers.length > 0
                    ? `${publicStartupSuppliers.length} audited manufacturers ready in Peenya and Pune with direct delivery guarantees.`
                    : "Audited manufacturers across Peenya and Pune ready to connect upon RFQ dispatch."}
                </p>
                <button
                  onClick={() => navigate("startup.match-results")}
                  className="text-[11px] font-bold text-[#051F16] hover:text-emerald-800 flex items-center gap-1 cursor-pointer pt-0.5"
                >
                  <span>Explore Supplier Matches</span>
                  <Icons.ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-200/60">
            <MPIButton
              variant="primary"
              fullWidth
              size="sm"
              onClick={() => navigate("startup.ai-assistant")}
              icon={<Icons.MessageSquare className="w-3.5 h-3.5" />}
            >
              Open AI Copilot Workspace →
            </MPIButton>
          </div>
        </div>
      </div>

      {/* ─── SOURCING HISTORY & RECENT INQUIRIES ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#EAECEF] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3
              className="text-sm font-extrabold text-[#051F16]"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Recent Procurement Cycles & Historical Records
            </h3>
            <p className="text-xs text-slate-400">
              Audited procurement inquiries managed through the MPI reverse-bidding protocol.
            </p>
          </div>
          <button
            onClick={() => navigate("startup.history")}
            className="text-xs font-bold text-[#051F16] hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>View Full Sourcing History</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {sourcingHistory.map((item) => (
            <div
              key={item.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F2F6F8]/50 rounded-xl px-2.5 transition-colors"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#051F16]">
                  {item.request}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-slate-400">{item.id}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">
                    {item.category}
                  </span>
                  <span>•</span>
                  <span>{item.date}</span>
                  <span>•</span>
                  <span className="font-bold text-emerald-700">
                    Saved ₹{item.savingsAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600 font-medium">
                  <strong className="text-slate-900">{item.quotesCount}</strong>{" "}
                  quotes received
                </span>
                <MPIStatusBadge status={item.rfqStatus} />
                <MPIButton
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectHistoryInsight(item)}
                >
                  View Insights
                </MPIButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
