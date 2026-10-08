import { useState, useCallback, useEffect } from "react"
import { getAdminSession, ADMIN_CONFIG } from "./lib/mockAuth"
import { ProcurementProvider } from "./context/ProcurementContext"
import Home from "./screens/Home"
import Landing from "./screens/Landing"
import LoginPortal from "./screens/Login"
import StartupFlow from "./screens/startup/StartupFlow"
import MSMEFlow from "./screens/msme/MSMEFlow"
import AdminFlow from "./screens/admin/AdminFlow"
import {
  AIInsightsDetailPage,
  TotalSalesDetailPage,
  RevenueComparisonDetailPage,
  SalesTrendDetailPage,
  AgeRangeDetailPage,
  AddWidgetStudioPage,
  CreateReportPage,
  PulseLiveFeedPage,
  DataCatalogPage,
  SharedTeamPage,
  NotificationsPage,
  MessagesPage,
  DocumentsPage,
  SupportPage,
  AccountProfilePage,
} from "./screens/analytics/AnalyticsDetailPages"
import GovernmentSchemesFlow from "./screens/schemes/GovernmentSchemesFlow"
import StartupOnboarding from "./screens/onboarding/StartupOnboarding"
import MSMEOnboarding from "./screens/onboarding/MSMEOnboarding"

import GlobalNavBar from "./components/navigation/GlobalNavBar"
import ErrorBoundary from "./components/ui/ErrorBoundary"
import CookieConsentExperience from "./components/cookie/CookieConsentExperience"

export type Screen = "home" | "landing" | "login.startup" | "login.msme" | "login.admin" | "register.startup" | "register.msme" | "government-schemes.match" | "government-schemes.browse" | "government-schemes.detail" | "analytics.detail.ai-insights" | "analytics.detail.total-sales" | "analytics.detail.revenue-comparison" | "analytics.detail.sales-trend" | "analytics.detail.age-range" | "analytics.add-widget" | "analytics.create-report" | "analytics.pulse" | "analytics.data" | "analytics.shared" | "analytics.notifications" | "analytics.messages" | "analytics.documents" | "analytics.support" | "analytics.profile" | "startup.home" | "startup.onboarding" | "startup.procurement" | "startup.ai-assistant" | "startup.ai-analysis" | "startup.match-results" | "startup.supplier-detail" | "startup.comparison" | "startup.shortlist" | "startup.rfq" | "startup.samples" | "startup.sample-new" | "startup.schemes" | "startup.status" | "startup.history" | "startup.profile" | "startup.settings" | "startup.analytics" | "msme.home" | "msme.onboarding" | "msme.profile" | "msme.capabilities" | "msme.products" | "msme.certifications" | "msme.verification" | "msme.verification-status" | "msme.match-readiness" | "msme.opportunities" | "msme.opportunity-detail" | "msme.proposal" | "msme.procurement-status" | "msme.schemes" | "msme.analytics" | "msme.settings" | "admin.home" | "admin.user-management" | "admin.startup-management" | "admin.msme-management" | "admin.verification" | "admin.procurement" | "admin.ai-matching" | "admin.analytics" | "admin.reports" | "admin.settings"

export interface NavProps {
  navigate: (screen: Screen) => void
  goBack: () => void
  currentScreen: Screen
  canGoBack: boolean
}

function isAdminPath(): boolean {
  if (typeof window === "undefined") return false
  const p = window.location.pathname.toLowerCase()
  return (
    p === "/1982/admin" ||
    p === "/1982/admin/" ||
    p.startsWith("/1982/admin")
  )
}

function getInitialScreen(): Screen {
  if (isAdminPath()) {
    return getAdminSession() ? "admin.home" : "login.admin"
  }
  return "home"
}

export default function App() {
  const [history, setHistory] = useState<Screen[]>([getInitialScreen()])
  const currentScreen = history[history.length - 1]
  const canGoBack = history.length > 1

  const navigate = useCallback((screen: Screen) => {
    // Admin route protection: gate any admin screen if unauthenticated
    let targetScreen = screen
    if (screen.startsWith("admin.") && !getAdminSession()) {
      targetScreen = "login.admin"
    }

    const updateState = () => {
      setHistory((prev) => [...prev, targetScreen])
    }

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      ;(document as any).startViewTransition(updateState)
    } else {
      updateState()
    }
    window.scrollTo({ top: 0, behavior: "smooth" })

    // Sync browser URL
    if (typeof window !== "undefined") {
      if (targetScreen.startsWith("admin.") || targetScreen === "login.admin") {
        if (window.location.pathname !== ADMIN_CONFIG.path) {
          window.history.pushState(null, "", ADMIN_CONFIG.path)
        }
      } else if (targetScreen === "home") {
        if (window.location.pathname !== "/") {
          window.history.pushState(null, "", "/")
        }
      }
    }
  }, [])

  const goBack = useCallback(() => {
    const updateState = () => {
      setHistory((prev) => {
        if (prev.length > 1) {
          return prev.slice(0, -1)
        }
        // Intelligent fallback when user opened directly or refreshed
        const current = prev[0] || "home"
        if (current.startsWith("startup.") && current !== "startup.home") {
          return ["home", "startup.home"]
        }
        if (current.startsWith("msme.") && current !== "msme.home") {
          return ["home", "msme.home"]
        }
        if (current.startsWith("admin.") && current !== "admin.home") {
          return ["home", "admin.home"]
        }
        if (current.startsWith("analytics.")) {
          return ["home", "startup.analytics"]
        }
        if (current.startsWith("government-schemes.")) {
          return ["home"]
        }
        if (current.startsWith("login.") || current.startsWith("register.") || current.includes("onboarding")) {
          return ["home"]
        }
        return ["home"]
      })
    }

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      ;(document as any).startViewTransition(updateState)
    } else {
      updateState()
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  // Sync URL popstate and initial route
  useEffect(() => {
    const handlePopState = () => {
      if (isAdminPath()) {
        const nextScreen: Screen = getAdminSession() ? "admin.home" : "login.admin"
        setHistory((prev) => [...prev, nextScreen])
      } else if (window.location.pathname === "/") {
        setHistory((prev) => [...prev, "home"])
      }
    }

    window.addEventListener("popstate", handlePopState)

    if (isAdminPath() && window.location.pathname !== ADMIN_CONFIG.path) {
      window.history.replaceState(null, "", ADMIN_CONFIG.path)
    }

    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const navProps: NavProps = { navigate, goBack, currentScreen, canGoBack }

  const renderActiveScreen = () => {
    // Flagship Analytics Detail Pages (All buttons in Bento dashboard)
    if (currentScreen.startsWith("analytics.")) {
      let pageContent: React.ReactNode = null
      if (currentScreen === "analytics.detail.ai-insights")
        pageContent = <AIInsightsDetailPage {...navProps} />
      else if (currentScreen === "analytics.detail.total-sales")
        pageContent = <TotalSalesDetailPage {...navProps} />
      else if (currentScreen === "analytics.detail.revenue-comparison")
        pageContent = <RevenueComparisonDetailPage {...navProps} />
      else if (currentScreen === "analytics.detail.sales-trend")
        pageContent = <SalesTrendDetailPage {...navProps} />
      else if (currentScreen === "analytics.detail.age-range")
        pageContent = <AgeRangeDetailPage {...navProps} />
      else if (currentScreen === "analytics.add-widget")
        pageContent = <AddWidgetStudioPage {...navProps} />
      else if (currentScreen === "analytics.create-report")
        pageContent = <CreateReportPage {...navProps} />
      else if (currentScreen === "analytics.pulse")
        pageContent = <PulseLiveFeedPage {...navProps} />
      else if (currentScreen === "analytics.data")
        pageContent = <DataCatalogPage {...navProps} />
      else if (currentScreen === "analytics.shared")
        pageContent = <SharedTeamPage {...navProps} />
      else if (currentScreen === "analytics.notifications")
        pageContent = <NotificationsPage {...navProps} />
      else if (currentScreen === "analytics.messages")
        pageContent = <MessagesPage {...navProps} />
      else if (currentScreen === "analytics.documents")
        pageContent = <DocumentsPage {...navProps} />
      else if (currentScreen === "analytics.support")
        pageContent = <SupportPage {...navProps} />
      else if (currentScreen === "analytics.profile")
        pageContent = <AccountProfilePage {...navProps} />

      return (
        <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans">
          <GlobalNavBar {...navProps} />
          <div className="flex-1">{pageContent}</div>
        </div>
      )
    }

    // Specialized Onboarding Flows
    if (
      currentScreen === "register.startup" ||
      currentScreen === "startup.onboarding"
    ) {
      return <StartupOnboarding {...navProps} />
    }
    if (
      currentScreen === "register.msme" ||
      currentScreen === "msme.onboarding"
    ) {
      return <MSMEOnboarding {...navProps} />
    }

    // Central Government Schemes Intelligence Engine
    if (currentScreen.startsWith("government-schemes.")) {
      return <GovernmentSchemesFlow {...navProps} />
    }

    // Main Root Screens
    if (currentScreen === "home") return <Home {...navProps} />
    if (currentScreen === "landing") return <Landing {...navProps} />
    if (
      currentScreen.startsWith("login.") ||
      currentScreen.startsWith("register.")
    )
      return <LoginPortal {...navProps} />
    if (currentScreen.startsWith("startup."))
      return <StartupFlow {...navProps} />
    if (currentScreen.startsWith("msme.")) return <MSMEFlow {...navProps} />
    if (currentScreen.startsWith("admin.")) {
      if (!getAdminSession()) {
        return <LoginPortal {...navProps} currentScreen="login.admin" />
      }
      return <AdminFlow {...navProps} />
    }

    return <Landing {...navProps} />
  }

  return (
    <ErrorBoundary>
      <ProcurementProvider>
        {renderActiveScreen()}
        <CookieConsentExperience />
      </ProcurementProvider>
    </ErrorBoundary>
  )
}
