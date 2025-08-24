import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SplashScreen from "./components/SplashScreen";

const queryClient = new QueryClient();

const App = () => {
  // Always show splash screen on app load/refresh
  const [showSplash, setShowSplash] = useState(true);

  // If splash screen should be shown, render only splash
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Once splash is finished, render the main app
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
