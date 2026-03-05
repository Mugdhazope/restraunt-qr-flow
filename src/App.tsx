import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CustomerProvider } from "@/context/CustomerContext";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/customer/Welcome";
import OTP from "./pages/customer/OTP";
import CheckedIn from "./pages/customer/CheckedIn";
import Menu from "./pages/customer/Menu";
import CustomerFeedback from "./pages/customer/CustomerFeedback";
import GoogleReviewPrompt from "./pages/customer/GoogleReviewPrompt";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/dashboard/Home";
import Campaigns from "./pages/dashboard/Campaigns";
import Feedback from "./pages/dashboard/Feedback";
import GoogleReviews from "./pages/dashboard/GoogleReviews";
import Customers from "./pages/dashboard/Customers";
import Automations from "./pages/dashboard/Automations";
import QREntryFlow from "./pages/dashboard/QREntryFlow";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CustomerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Customer QR flow — multi-restaurant */}
            <Route path="/scan/:restaurantId" element={<Welcome />} />
            <Route path="/scan/:restaurantId/otp" element={<OTP />} />
            <Route path="/scan/:restaurantId/checked-in" element={<CheckedIn />} />
            <Route path="/scan/:restaurantId/menu" element={<Menu />} />
            <Route path="/scan/:restaurantId/feedback" element={<CustomerFeedback />} />
            <Route path="/scan/:restaurantId/review" element={<GoogleReviewPrompt />} />

            {/* Legacy routes redirect */}
            <Route path="/welcome" element={<Navigate to="/scan/doughandjoe" replace />} />
            <Route path="/otp" element={<Navigate to="/scan/doughandjoe/otp" replace />} />
            <Route path="/reward" element={<Navigate to="/scan/doughandjoe/checked-in" replace />} />

            {/* Admin dashboard */}
            <Route path="/dashboard" element={<DashboardLayout><DashboardHome /></DashboardLayout>} />
            <Route path="/dashboard/customers" element={<DashboardLayout><Customers /></DashboardLayout>} />
            <Route path="/dashboard/feedback" element={<DashboardLayout><Feedback /></DashboardLayout>} />
            <Route path="/dashboard/google-reviews" element={<DashboardLayout><GoogleReviews /></DashboardLayout>} />
            <Route path="/dashboard/campaigns" element={<DashboardLayout><Campaigns /></DashboardLayout>} />
            <Route path="/dashboard/automations" element={<DashboardLayout><Automations /></DashboardLayout>} />
            <Route path="/dashboard/qr-entry" element={<DashboardLayout><QREntryFlow /></DashboardLayout>} />
            <Route path="/dashboard/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
            <Route path="/dashboard/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CustomerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
