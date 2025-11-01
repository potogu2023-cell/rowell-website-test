import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, ShoppingCart, LogOut, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get cart count
  const { data: cartItems } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const cartCount = cartItems?.length || 0;

  const handleLogout = () => {
    logout();
    setLocation("/");
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center space-x-3">
            <img 
              src="/rowell-logo.png" 
              alt="ROWELL" 
              className="h-10 w-auto"
            />
            <span className="text-sm text-muted-foreground hidden sm:inline">
              HPLC Solutions
            </span>
          </a>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <LanguageSwitcher />
          <Link href="/">
            <a className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Home
            </a>
          </Link>
          <Link href="/about">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              About Us
            </a>
          </Link>
          <Link href="/products">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Products
            </a>
          </Link>
          <Link href="/usp-standards">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              USP Standards
            </a>
          </Link>
          <Link href="/applications">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Applications
            </a>
          </Link>
          <Link href="/contact">
            <a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link href="/inquiry-cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Inquiry Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{user?.name || "Account"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/inquiry-history")}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    <span>Inquiry History</span>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation("/admin")}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Register
                </Button>
              </Link>
            </>
          )}
          
          {/* Language Selector (placeholder) */}
          <Button variant="ghost" size="sm" className="hidden lg:flex">
            🇺🇸 EN
          </Button>
        </div>
      </nav>
    </header>
  );
}

