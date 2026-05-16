import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Proxies from "./pages/Proxies";
import DumpPage from "./pages/Dump";
import Generator from "./pages/Generator";
import Gambling from "./pages/Gambling";
import AdminPanel from "./pages/AdminPanel";
import Chooser from "./pages/Chooser";
import Chat from "./pages/Chat";
import SettingsPage from "./pages/Settings";
import Announcements from "./pages/Announcements";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/chooser" element={<Chooser />} />
            <Route path="/proxies" element={<Proxies />} />
            <Route path="/dump" element={<DumpPage />} />
            <Route path="/generator" element={<Generator />} />
            <Route path="/gambling" element={<Gambling />} />
            <Route path="/vault" element={<Index />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
