import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';
import { lazy, Suspense, useEffect } from 'react';
import { getLanguageDir } from './i18n/config';
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

// Route-level code splitting keeps the initial application payload focused on the current page.
const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CategoryLanding = lazy(() => import("./pages/CategoryLanding"));
const Resources = lazy(() => import("./pages/Resources"));
const ResourceDetail = lazy(() => import("./pages/ResourceDetail"));
const About = lazy(() => import("./pages/About"));
const USPStandards = lazy(() => import("./pages/USPStandards"));
const Contact = lazy(() => import("./pages/Contact"));
const LearningCenter = lazy(() => import("./pages/LearningCenter"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const AuthorDetail = lazy(() => import("./pages/AuthorDetail"));
const LiteratureDetail = lazy(() => import("./pages/LiteratureDetail"));
const AdminSeed = lazy(() => import("./pages/AdminSeed"));
const AdminMessages = lazy(() => import("./pages/AdminMessages"));
const TestFilters = lazy(() => import("./pages/TestFilters"));
const Standards = lazy(() => import("./pages/Standards"));
const StandardsCategory = lazy(() => import("./pages/StandardsCategory"));
const StandardsProductDetail = lazy(() => import("./pages/StandardsProductDetail"));
const StandardsSearch = lazy(() => import("./pages/StandardsSearch"));
const ApplicationsHub = lazy(() => import("./pages/ApplicationsHub"));
const IndustryApplication = lazy(() => import("./pages/IndustryApplication"));


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
        <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/products"} component={Products} />
          <Route path={"/products/:id"} component={ProductDetail} />
          <Route path={"/categories/:slug"} component={CategoryLanding} />
          
          {/* Learning Center routes (replacing Applications and Resources) */}
          <Route path={"/learning"} component={LearningCenter} />
          <Route path={"/learning-center"} component={LearningCenter} />
          <Route path={"/learning/authors/:slug"} component={AuthorDetail} />
          <Route path={"/learning/literature/:slug"} component={LiteratureDetail} />
          <Route path={"/learning/:slug"} component={ArticleDetail} />
          <Route path={"/applications"} component={ApplicationsHub} />
          <Route path={"/applications/:industry"} component={IndustryApplication} />
          <Route path={"/resources/:slug"} component={ResourceDetail} />
          <Route path={"/resources"} component={Resources} />
          
          <Route path={"/about"} component={About} />
          <Route path={"/usp-standards"} component={USPStandards} />
          <Route path={"/contact"} component={Contact} />
          <Route path={"/admin/messages"} component={AdminMessages} />
          <Route path={"/admin/seed"} component={AdminSeed} />

          {/* ANPEL Reference Standards routes */}
          <Route path={"/standards"} component={Standards} />
          <Route path={"/standards/search"} component={StandardsSearch} />
          <Route path={"/standards/category/:slug"} component={StandardsCategory} />
          <Route path={"/standards/product/:slug"} component={StandardsProductDetail} />

          <Route path={"/test-filters"} component={TestFilters} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
        </Suspense>
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

