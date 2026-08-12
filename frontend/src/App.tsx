import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { CustomerProvider } from "@/context/CustomerContext";
import { RestaurantProvider } from "@/context/RestaurantContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/customer/Welcome";
import CheckedIn from "./pages/customer/CheckedIn";
import Menu from "./pages/customer/Menu";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/dashboard/Login";
import DashboardHome from "./pages/dashboard/Home";
import Campaigns from "./pages/dashboard/Campaigns";
import Feedback from "./pages/dashboard/Feedback";
import GoogleReviews from "./pages/dashboard/GoogleReviews";
import Customers from "./pages/dashboard/Customers";
import Automations from "./pages/dashboard/Automations";
import QREntryFlow from "./pages/dashboard/QREntryFlow";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";
import MenuManagement from "./pages/dashboard/MenuManagement";
import ImportCustomers from "./pages/dashboard/ImportCustomers";
import LayoutEditor from "./pages/dashboard/LayoutEditor";
import PreviewHub from "./pages/PreviewHub";
import { DEFAULT_RESTAURANT_SLUG } from "@/lib/defaultRestaurantSlug";
import {
  PREVIEW_DASHBOARD_BASE,
  PREVIEW_HUB_PATH,
  PREVIEW_SCAN_BASE,
  buildScanPath,
  isPreviewOnlyBuild,
} from "@/lib/previewMode";

const queryClient = new QueryClient();

function ScanOtpLegacyRedirect() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return <Navigate to={buildScanPath(restaurantId ?? DEFAULT_RESTAURANT_SLUG, "menu")} replace />;
}

function ScanToMenuRedirect() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return <Navigate to={buildScanPath(restaurantId ?? DEFAULT_RESTAURANT_SLUG, "menu")} replace />;
}

function RedirectPrefix({ from, to }: { from: string; to: string }) {
  const location = useLocation();
  const rest = location.pathname.startsWith(from) ? location.pathname.slice(from.length) : "";
  return <Navigate to={`${to}${rest}${location.search}${location.hash}`} replace />;
}

function dashboardChildRoutes() {
  return (
    <>
      <Route index element={<DashboardHome />} />
      <Route path="customers" element={<Customers />} />
      <Route path="import-customers" element={<ImportCustomers />} />
      <Route path="menu" element={<MenuManagement />} />
      <Route path="feedback" element={<Feedback />} />
      <Route path="google-reviews" element={<GoogleReviews />} />
      <Route path="campaigns" element={<Campaigns />} />
      <Route path="automations" element={<Automations />} />
      <Route path="qr-entry" element={<QREntryFlow />} />
      <Route path="layout" element={<LayoutEditor />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="settings" element={<Settings />} />
    </>
  );
}

function scanChildRoutes() {
  return (
    <>
      <Route path=":restaurantId" element={<Welcome />} />
      <Route path=":restaurantId/otp" element={<ScanOtpLegacyRedirect />} />
      <Route path=":restaurantId/checked-in" element={<CheckedIn />} />
      <Route path=":restaurantId/menu" element={<Menu />} />
      <Route path=":restaurantId/feedback" element={<ScanToMenuRedirect />} />
      <Route path=":restaurantId/review" element={<ScanToMenuRedirect />} />
    </>
  );
}

const previewOnly = isPreviewOnlyBuild();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <CustomerProvider>
          <RestaurantProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to={previewOnly ? PREVIEW_HUB_PATH : "/dashboard"} replace />}
                />

                <Route path={PREVIEW_HUB_PATH} element={<PreviewHub />} />
                <Route path={PREVIEW_DASHBOARD_BASE} element={<DashboardLayout />}>
                  {dashboardChildRoutes()}
                </Route>
                <Route path={PREVIEW_SCAN_BASE} element={<Outlet />}>
                  {scanChildRoutes()}
                </Route>

                {previewOnly ? (
                  <>
                    <Route path="/dashboard/login" element={<Navigate to={PREVIEW_HUB_PATH} replace />} />
                    <Route
                      path="/dashboard/*"
                      element={<RedirectPrefix from="/dashboard" to={PREVIEW_DASHBOARD_BASE} />}
                    />
                    <Route path="/dashboard" element={<Navigate to={PREVIEW_DASHBOARD_BASE} replace />} />
                    <Route
                      path="/scan/*"
                      element={<RedirectPrefix from="/scan" to={PREVIEW_SCAN_BASE} />}
                    />
                  </>
                ) : (
                  <>
                    <Route path="/scan" element={<Outlet />}>
                      {scanChildRoutes()}
                    </Route>
                    <Route path="/dashboard/login" element={<Login />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardLayout />
                        </ProtectedRoute>
                      }
                    >
                      {dashboardChildRoutes()}
                    </Route>
                  </>
                )}

                <Route
                  path="/welcome"
                  element={<Navigate to={buildScanPath(DEFAULT_RESTAURANT_SLUG)} replace />}
                />
                <Route
                  path="/otp"
                  element={<Navigate to={buildScanPath(DEFAULT_RESTAURANT_SLUG, "menu")} replace />}
                />
                <Route
                  path="/reward"
                  element={<Navigate to={buildScanPath(DEFAULT_RESTAURANT_SLUG, "checked-in")} replace />}
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </RestaurantProvider>
        </CustomerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
