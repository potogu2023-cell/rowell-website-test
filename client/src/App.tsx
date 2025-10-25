import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import InquiryCart from "./pages/InquiryCart";
import InquiryHistory from "./pages/InquiryHistory";
import Admin from "./pages/Admin";
import AdminInquiries from "./pages/AdminInquiries";
import AdminCustomers from "./pages/AdminCustomers";
import AdminAnalytics from "./pages/AdminAnalytics";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/products"} component={Products} />
          <Route path={"/about"} component={About} />
          <Route path={"/usp-standards"} component={USPStandards} />
          <Route path={"/applications"} component={Applications} />
          <Route path={"/contact"} component={Contact} />
          <Route path={"/register"} component={Register} />
          <Route path={"/login"} component={Login} />
          <Route path={"/profile"} component={Profile} />
          <Route path={"/inquiry-cart"} component={InquiryCart} />
          <Route path={"/inquiry-history"} component={InquiryHistory} />
          <Route path={"/admin"} component={Admin} />
          <Route path={"/admin/inquiries"} component={AdminInquiries} />
          <Route path={"/admin/customers"} component={AdminCustomers} />
          <Route path={"/admin/analytics"} component={AdminAnalytics} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
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

