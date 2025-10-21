import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import Home from "./pages/Home";
import DeIdentify from "./pages/DeIdentify";
import Batch from "./pages/Batch";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { config } from "./config";

function AppInner() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/deidentify" element={<DeIdentify />} />
            <Route path="/batch" element={<Batch />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={config.clerkPublishableKey}>
      <AppInner />
    </ClerkProvider>
  );
}
