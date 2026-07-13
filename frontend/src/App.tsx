import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { CustomerProvider } from "@/context/CustomerContext";
import { RestaurantProvider } from "@/context/RestaurantContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/customer/Welcome";
import CheckedIn from "./pages/customer/CheckedIn";
import Menu from "./pages/customer/Menu";
// WA_DISABLED — customer WhatsApp feedback / Google review prompt UI
// import CustomerFeedback from "./pages/customer/CustomerFeedback";
// import GoogleReviewPrompt from "./pages/customer/GoogleReviewPrompt";
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
import { DEFAULT_RESTAURANT_SLUG } from "@/lib/defaultRestaurantSlug";

const queryClient = new QueryClient();

function ScanOtpLegacyRedirect() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return <Navigate to={`/scan/${restaurantId ?? DEFAULT_RESTAURANT_SLUG}/menu`} replace />;
}

function ScanToMenuRedirect() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return <Navigate to={`/scan/${restaurantId ?? DEFAULT_RESTAURANT_SLUG}/menu`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CustomerProvider>
        <RestaurantProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Customer QR flow — menu-first; Welcome/check-in still available */}
                <Route path="/scan/:restaurantId" element={<Welcome />} />
                <Route path="/scan/:restaurantId/otp" element={<ScanOtpLegacyRedirect />} />
                <Route path="/scan/:restaurantId/checked-in" element={<CheckedIn />} />
                <Route path="/scan/:restaurantId/menu" element={<Menu />} />
                {/* WA_DISABLED — redirect old feedback/review deep links to menu */}
                <Route path="/scan/:restaurantId/feedback" element={<ScanToMenuRedirect />} />
                <Route path="/scan/:restaurantId/review" element={<ScanToMenuRedirect />} />

                {/* Legacy redirects */}
                <Route path="/welcome" element={<Navigate to={`/scan/${DEFAULT_RESTAURANT_SLUG}`} replace />} />
                <Route path="/otp" element={<Navigate to={`/scan/${DEFAULT_RESTAURANT_SLUG}/menu`} replace />} />
                <Route path="/reward" element={<Navigate to={`/scan/${DEFAULT_RESTAURANT_SLUG}/checked-in`} replace />} />

                {/* Admin dashboard */}
                <Route path="/dashboard/login" element={<Login />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardHome />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="import-customers" element={<ImportCustomers />} />
                  <Route path="menu" element={<MenuManagement />} />
                  <Route path="feedback" element={<Feedback />} />
                  <Route path="google-reviews" element={<GoogleReviews />} />
                  {/* Routes kept; nav links commented in DashboardLayout (WA_DISABLED) */}
                  <Route path="campaigns" element={<Campaigns />} />
                  <Route path="automations" element={<Automations />} />
                  <Route path="qr-entry" element={<QREntryFlow />} />
                  <Route path="layout" element={<LayoutEditor />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </RestaurantProvider>
      </CustomerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
