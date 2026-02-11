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
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/dashboard/Home";
import WhatsAppCRM from "./pages/dashboard/WhatsAppCRM";
import Campaigns from "./pages/dashboard/Campaigns";
import Rewards from "./pages/dashboard/Rewards";
import Feedback from "./pages/dashboard/Feedback";
import Customers from "./pages/dashboard/Customers";

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
          <Route path="/dashboard" element={<DashboardLayout><DashboardHome /></DashboardLayout>} />
          <Route path="/dashboard/crm" element={<DashboardLayout><WhatsAppCRM /></DashboardLayout>} />
          <Route path="/dashboard/campaigns" element={<DashboardLayout><Campaigns /></DashboardLayout>} />
          <Route path="/dashboard/rewards" element={<DashboardLayout><Rewards /></DashboardLayout>} />
          <Route path="/dashboard/feedback" element={<DashboardLayout><Feedback /></DashboardLayout>} />
          <Route path="/dashboard/customers" element={<DashboardLayout><Customers /></DashboardLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
