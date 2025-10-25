import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * All content in this page are only for example, delete if unneeded
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  // If theme is switchable in App.tsx, we can implement theme toggling like this:
  // const { theme, toggleTheme } = useTheme();

  // Use APP_LOGO (as image src) and APP_TITLE if needed

  const { data: products } = trpc.products.list.useQuery();
  const productCount = products?.length || 0;
  const brandCount = new Set(products?.map(p => p.brand)).size;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">{APP_TITLE}</h1>
            <nav className="flex gap-6">
              <Link href="/">
                <a className="text-foreground font-medium">Home</a>
              </Link>
              <Link href="/products">
                <a className="text-muted-foreground hover:text-foreground">Products</a>
              </Link>
              {isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <a href={getLoginUrl()}>Login</a>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6">
              ROWELL HPLC Test Website
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Testing new product additions and website upgrades
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/products">
                  <a>Browse Products</a>
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-2">{productCount}</div>
              <div className="text-muted-foreground">Total Products</div>
            </div>
            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-2">{brandCount}</div>
              <div className="text-muted-foreground">Brands</div>
            </div>
            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-2">NEW</div>
              <div className="text-muted-foreground">Status</div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-16 max-w-2xl mx-auto">
            <div className="bg-muted/50 border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">About This Test Site</h3>
              <p className="text-muted-foreground mb-4">
                This is a test environment for the ROWELL HPLC website. It contains {productCount} products
                from {brandCount} different brands, all marked as "new" status.
              </p>
              <p className="text-muted-foreground">
                You can browse all products, filter by brand, and search by product ID or part number.
                Once testing is complete and all products are verified, this data can be deployed to
                the production website.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>ROWELL HPLC Test Website - For Testing Purposes Only</p>
        </div>
      </footer>
    </div>
  );
}
