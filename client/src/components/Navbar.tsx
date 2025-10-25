import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">ROWELL</span>
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              HPLC Solutions
            </span>
          </a>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
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
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.name || user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <a href={getLoginUrl()}>Login</a>
              </Button>
              <Button size="sm" asChild>
                <a href={getLoginUrl()}>Register</a>
              </Button>
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

