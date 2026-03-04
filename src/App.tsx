import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/customer/Welcome";
import OTP from "./pages/customer/OTP";
import Reward from "./pages/customer/Reward";
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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/reward" element={<Reward />} />
          <Route path="/customer-feedback" element={<CustomerFeedback />} />
          <Route path="/google-review-prompt" element={<GoogleReviewPrompt />} />
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
