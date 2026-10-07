import React, { useState } from "react"
import { Screen, NavProps } from "../../App"
import { MPILogo } from "../shared"
import { Icons } from "../design-system/MPIDesignSystem"
import LanguageTranslatorButton from "./LanguageTranslatorButton"

export interface BreadcrumbCrumb {
  label: string
  screen?: Screen
  isActive?: boolean
}

/**
 * Resolves human-readable breadcrumb segments for any screen in the MPI application.
 */
export function getScreenBreadcrumbs(screen: Screen): BreadcrumbCrumb[] {
  const crumbs: BreadcrumbCrumb[] = [{ label: "Home", screen: "home" }]

  if (screen === "home" || screen === "landing") {
    return [{ label: "Home", screen: "home", isActive: true }]
  }

  // Startup Hub Pages
  if (screen.startsWith("startup.")) {
    crumbs.push({ label: "Startup Hub", screen: "startup.home" })
    const startupTitles: Record<string, string> = {
      "startup.home": "Overview Dashboard",
      "startup.procurement": "New Procurement Intake",
      "startup.ai-assistant": "AI Sourcing Copilot",
      "startup.ai-analysis": "AI Specification Extraction",
      "startup.match-results": "Matched Suppliers",
      "startup.supplier-detail": "Supplier Profile & Vetting",
      "startup.comparison": "Quote Comparison Matrix",
      "startup.shortlist": "Shortlisted Vendors",
      "startup.rfq": "RFQ Generator & Readiness",
      "startup.samples": "Sample Batch Orders",
      "startup.sample-new": "Request Prototype Sample",
      "startup.schemes": "Government Schemes",
      "startup.status": "Production Tracking & Escrow",
      "startup.history": "Sourcing History",
      "startup.profile": "Company Profile",
      "startup.settings": "Account Settings",
      "startup.analytics": "Analytics Studio",
    }
    const subTitle = startupTitles[screen]
    if (subTitle && screen !== "startup.home") {
      crumbs.push({ label: subTitle, screen, isActive: true })
    } else if (screen === "startup.home") {
      crumbs[1].isActive = true
    }
    return crumbs
  }

  // MSME Portal Pages
  if (screen.startsWith("msme.")) {
    crumbs.push({ label: "MSME Portal", screen: "msme.home" })
    const msmeTitles: Record<string, string> = {
      "msme.home": "Supplier Dashboard",
      "msme.profile": "Business Profile",
      "msme.capabilities": "Machinery & Capabilities",
      "msme.products": "Product Catalog",
      "msme.certifications": "ISO & Quality Certifications",
      "msme.verification": "MPI Trust Verification",
      "msme.verification-status": "Audit Status",
      "msme.match-readiness": "RFQ Match Readiness",
      "msme.opportunities": "Live Opportunities",
      "msme.opportunity-detail": "Opportunity Details",
      "msme.proposal": "Submit Commercial Proposal",
      "msme.procurement-status": "Active Orders & Escrow",
      "msme.schemes": "Subsidies & Grants",
      "msme.analytics": "Supplier Analytics",
      "msme.settings": "Settings",
    }
    const subTitle = msmeTitles[screen]
    if (subTitle && screen !== "msme.home") {
      crumbs.push({ label: subTitle, screen, isActive: true })
    } else if (screen === "msme.home") {
      crumbs[1].isActive = true
    }
    return crumbs
  }

  // Admin Portal Pages
  if (screen.startsWith("admin.")) {
    crumbs.push({ label: "Admin Portal", screen: "admin.home" })
    const adminTitles: Record<string, string> = {
      "admin.home": "Control Center",
      "admin.user-management": "User Directory",
      "admin.startup-management": "Startups Directory",
      "admin.msme-management": "Verified MSMEs Directory",
      "admin.verification": "Statutory Audit Queue",
      "admin.procurement": "Escrow Transactions",
      "admin.ai-matching": "AI Telemetry & Calibration",
      "admin.analytics": "Analytics Studio",
      "admin.reports": "Audit Reports",
      "admin.settings": "Security Settings",
    }
    const subTitle = adminTitles[screen]
    if (subTitle && screen !== "admin.home") {
      crumbs.push({ label: subTitle, screen, isActive: true })
    } else if (screen === "admin.home") {
      crumbs[1].isActive = true
    }
    return crumbs
  }

  // Government Schemes Pages
  if (screen.startsWith("government-schemes.")) {
    crumbs.push({ label: "Government Schemes", screen: "government-schemes.match" })
    const schemeTitles: Record<string, string> = {
      "government-schemes.match": "Eligibility Matcher",
      "government-schemes.browse": "Compendium of 30 Schemes",
      "government-schemes.detail": "Scheme Details",
    }
    const subTitle = schemeTitles[screen]
    if (subTitle && screen !== "government-schemes.match") {
      crumbs.push({ label: subTitle, screen, isActive: true })
    } else if (screen === "government-schemes.match") {
      crumbs[1].isActive = true
    }
    return crumbs
  }

  // Analytics Detail Pages
  if (screen.startsWith("analytics.")) {
    crumbs.push({ label: "Analytics Studio", screen: "analytics.detail.ai-insights" })
    const analyticsTitles: Record<string, string> = {
      "analytics.detail.ai-insights": "AI Growth Insights",
      "analytics.detail.total-sales": "Total Sales Deep Dive",
      "analytics.detail.revenue-comparison": "Revenue vs Target",
      "analytics.detail.sales-trend": "Quarterly Trend Analysis",
      "analytics.detail.age-range": "Customer Demographics",
      "analytics.add-widget": "Add Widget Studio",
      "analytics.create-report": "Executive Report Generator",
      "analytics.pulse": "Live Procurement Pulse",
      "analytics.data": "Data Catalog & Exports",
      "analytics.shared": "Team Sharing & Workspaces",
      "analytics.notifications": "Activity Notifications",
      "analytics.messages": "Sourcing Messages",
      "analytics.documents": "Contracts & Escrow Vault",
      "analytics.support": "Help & Support Desk",
      "analytics.profile": "Account Profile",
    }
    const subTitle = analyticsTitles[screen]
    if (subTitle) {
      crumbs.push({ label: subTitle, screen, isActive: true })
    }
    return crumbs
  }

  // Authentication & Onboarding
  if (screen === "login.startup" || screen === "register.startup") {
    crumbs.push({ label: "Startup Login", screen, isActive: true })
    return crumbs
  }
  if (screen === "login.msme" || screen === "register.msme") {
    crumbs.push({ label: "MSME Login", screen, isActive: true })
    return crumbs
  }
  if (screen === "login.admin") {
    crumbs.push({ label: "Admin Login", screen, isActive: true })
    return crumbs
  }
  if (screen === "startup.onboarding") {
    crumbs.push({ label: "Startup Onboarding", screen, isActive: true })
    return crumbs
  }
  if (screen === "msme.onboarding") {
    crumbs.push({ label: "MSME Onboarding", screen, isActive: true })
    return crumbs
  }

  crumbs.push({ label: screen, screen, isActive: true })
  return crumbs
}

interface GlobalNavBarProps extends NavProps {
  variant?: "light" | "navy" | "subtle"
  showQuickLinks?: boolean
  customBackLabel?: string
  className?: string
}

export default function GlobalNavBar({
  navigate,
  goBack,
  currentScreen,
  variant = "light",
  showQuickLinks = true,
  customBackLabel,
  className = "",
}: GlobalNavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const crumbs = getScreenBreadcrumbs(currentScreen)
  const isHomeScreen = currentScreen === "home" || currentScreen === "landing"

  // Quick navigation items for core platforms (respecting role privacy between Startup & MSME)
  const navHubs: { label: string; screen: Screen; icon: string; badge?: string }[] = [
    { label: "Home", screen: "home", icon: "🏠" },
    ...(currentScreen.startsWith("msme.") ? [] : [{ label: "Startup Hub", screen: "startup.home" as Screen, icon: "🚀", badge: "Buyers" }]),
    ...(currentScreen.startsWith("startup.") ? [] : [{ label: "MSME Portal", screen: "msme.home" as Screen, icon: "🏭", badge: "Suppliers" }]),
    { label: "Govt Schemes", screen: "government-schemes.match", icon: "📜", badge: "30 Schemes" },
    { label: "Analytics Studio", screen: "analytics.detail.ai-insights", icon: "📊" },
    { label: "Admin Portal", screen: "admin.home", icon: "🛡️" },
  ]

  const isCurrentHub = (screen: Screen) => {
    if (screen === "home" && isHomeScreen) return true
    if (screen === "startup.home" && currentScreen.startsWith("startup.")) return true
    if (screen === "msme.home" && currentScreen.startsWith("msme.")) return true
    if (screen === "government-schemes.match" && currentScreen.startsWith("government-schemes.")) return true
    if (screen === "analytics.detail.ai-insights" && currentScreen.startsWith("analytics.")) return true
    if (screen === "admin.home" && (currentScreen.startsWith("admin.") || currentScreen === "login.admin")) return true
    return false
  }

  // Dynamic back label based on where user is
  const backLabel = customBackLabel || (crumbs.length > 2 ? `Back to ${crumbs[crumbs.length - 2].label}` : "Back")

  return (
    <nav
      aria-label="Universal Site Navigation"
      className={`sticky top-0 w-full z-40 transition-all duration-300 border-b select-none ${
        variant === "navy"
          ? "bg-[#0B1F4B]/95 backdrop-blur-xl text-white border-[#123B7A] shadow-[0_4px_24px_-4px_rgba(11,31,75,0.2)]"
          : "bg-white/90 backdrop-blur-xl text-slate-800 border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(11,31,75,0.06)]"
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Left section: Logo + Back button + Breadcrumb Trail */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Logo */}
            <button
              onClick={() => navigate("home")}
              className="flex items-center gap-2 shrink-0 hover:opacity-85 transition-opacity cursor-pointer text-left"
              title="Return to MPI Home"
            >
              <MPILogo small />
            </button>

            {/* Separator */}
            <div className={`h-5 w-px shrink-0 hidden sm:block ${variant === "navy" ? "bg-[#123B7A]" : "bg-slate-200"}`} />

            {/* Prominent Back Button (if not on root home) */}
            {!isHomeScreen && (
              <button
                onClick={goBack}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  variant === "navy"
                    ? "bg-[#123B7A]/70 hover:bg-[#123B7A] text-slate-200 hover:text-white border-blue-400/30"
                    : "bg-slate-100 hover:bg-slate-200/90 text-slate-700 hover:text-slate-900 border-slate-200"
                }`}
                title="Go to previous page"
              >
                <Icons.ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{backLabel}</span>
                <span className="md:hidden">Back</span>
              </button>
            )}

            {/* Interactive Clickable Breadcrumbs */}
            <div className="flex items-center gap-1 text-xs overflow-x-auto no-scrollbar py-1">
              {crumbs.map((crumb, idx) => {
                const isLast = idx === crumbs.length - 1
                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <span className={`text-[10px] shrink-0 ${variant === "navy" ? "text-slate-400" : "text-slate-400"}`}>
                        /
                      </span>
                    )}
                    {isLast ? (
                      <span
                        className={`font-bold truncate max-w-[140px] sm:max-w-[220px] ${
                          variant === "navy" ? "text-orange-400" : "text-[#0B1F4B]"
                        }`}
                        title={crumb.label}
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <button
                        onClick={() => crumb.screen && navigate(crumb.screen)}
                        className={`truncate max-w-[100px] sm:max-w-[160px] font-medium transition-colors cursor-pointer hover:underline ${
                          variant === "navy"
                            ? "text-slate-300 hover:text-white"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                        title={`Go to ${crumb.label}`}
                      >
                        {crumb.label}
                      </button>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>

          {/* Right section: Core Hub Switcher Links & Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Hub Links */}
            {showQuickLinks && (
              <div className="hidden xl:flex items-center gap-1">
                {navHubs.map((hub) => {
                  const active = isCurrentHub(hub.screen)
                  return (
                    <button
                      key={hub.screen}
                      onClick={() => navigate(hub.screen)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? variant === "navy"
                            ? "bg-[#F97316] text-white shadow-xs"
                            : "bg-[#0B1F4B] text-white shadow-xs"
                          : variant === "navy"
                          ? "text-slate-300 hover:bg-[#123B7A] hover:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="text-xs">{hub.icon}</span>
                      <span>{hub.label}</span>
                      {hub.badge && !active && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                            variant === "navy"
                              ? "bg-[#123B7A] text-slate-300"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {hub.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Global Language Translator Button (Globe + EN) */}
            <LanguageTranslatorButton variant={variant === "navy" ? "navy" : "default"} />

            {/* Quick Hub Switcher Dropdown (for Large/Medium screens) */}
            <div className="hidden sm:flex xl:hidden items-center">
              <select
                aria-label="Switch Hub"
                value={
                  isHomeScreen
                    ? "home"
                    : currentScreen.startsWith("startup.")
                    ? "startup.home"
                    : currentScreen.startsWith("msme.")
                    ? "msme.home"
                    : currentScreen.startsWith("government-schemes.")
                    ? "government-schemes.match"
                    : currentScreen.startsWith("analytics.")
                    ? "analytics.detail.ai-insights"
                    : currentScreen.startsWith("admin.")
                    ? "admin.home"
                    : "home"
                }
                onChange={(e) => navigate(e.target.value as Screen)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                  variant === "navy"
                    ? "bg-[#123B7A] text-white border-blue-400/30"
                    : "bg-slate-100 text-slate-800 border-slate-200"
                }`}
              >
                <option value="home">🏠 Home Marketplace</option>
                {!currentScreen.startsWith("msme.") && (
                  <option value="startup.home">🚀 Startup Hub (Buyer)</option>
                )}
                {!currentScreen.startsWith("startup.") && (
                  <option value="msme.home">🏭 MSME Portal (Supplier)</option>
                )}
                <option value="government-schemes.match">📜 Government Schemes (30)</option>
                <option value="analytics.detail.ai-insights">📊 Analytics Studio</option>
                <option value="admin.home">🛡️ Admin Portal</option>
              </select>
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-1.5 rounded-lg border sm:hidden transition-colors cursor-pointer ${
                variant === "navy"
                  ? "border-[#123B7A] text-slate-200 hover:bg-[#123B7A]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div
          className={`sm:hidden border-t px-4 py-3 space-y-1.5 ${
            variant === "navy"
              ? "bg-[#071534] border-[#123B7A]"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Switch Page or Portal
          </div>
          {navHubs.map((hub) => {
            const active = isCurrentHub(hub.screen)
            return (
              <button
                key={hub.screen}
                onClick={() => {
                  navigate(hub.screen)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                  active
                    ? "bg-[#F97316] text-white"
                    : variant === "navy"
                    ? "text-slate-200 hover:bg-[#123B7A]"
                    : "text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{hub.icon}</span>
                  <span>{hub.label}</span>
                </div>
                {hub.badge && (
                  <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-white/90">
                    {hub.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </nav>
  )
}
