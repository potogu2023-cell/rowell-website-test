import { Toaster } from "@/components/ui/sonner";
import './i18n/config'; // Initialize i18n
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { getLanguageDir } from './i18n/config';
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import About from "./pages/About";
import USPStandards from "./pages/USPStandards";
import Applications from "./pages/Applications";
import Contact from "./pages/Contact";

import TestFilters from "./pages/TestFilters";
import ProductDetail from "./pages/ProductDetail";
import Resources from "./pages/Resources";
import ResourceDetail from "./pages/ResourceDetail";
import AdminMessages from "./pages/AdminMessages";
import WhatsAppButton from "./components/WhatsAppButton";


function Router() {
  const { i18n } = useTranslation();

  // Update document direction when language changes
  useEffect(() => {
    const dir = getLanguageDir(i18n.language);
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/products"} component={Products} />
          <Route path={"/products/:id"} component={ProductDetail} />
          <Route path={"/resources"} component={Resources} />
          <Route path={"/resources/:slug"} component={ResourceDetail} />
          <Route path={"/about"} component={About} />
          <Route path={"/usp-standards"} component={USPStandards} />
          <Route path={"/applications"} component={Applications} />
          <Route path={"/contact"} component={Contact} />
          <Route path={"/admin/messages"} component={AdminMessages} />

          <Route path={"/test-filters"} component={TestFilters} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <WhatsAppButton />

    </div>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

