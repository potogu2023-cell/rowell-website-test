import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import { USP_LANDING_CODES } from "@shared/uspLandingContent";

export default function USPStandards() {
  // The catalog only reads existing, audited USP fields; it never infers a classification from a product name.
  const { data: uspStandards, isLoading, error } = trpc.usp.listWithProductCount.useQuery();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="container">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Chromatography method discovery</p>
          <h1 className="mt-3 text-4xl font-bold">USP Column Classification (L-Codes)</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            Browse catalog products by recorded USP stationary-phase classification and compare exact product specifications before method evaluation.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="container py-12">
        <div className="mb-8">
          <p className="max-w-4xl text-muted-foreground">
            Use L-codes as a stationary-phase classification and catalog-discovery aid. Each product must still be reviewed by exact part number, product format, dimensions, operating limits, and method requirements.
          </p>
          <div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <p>USP L-codes do not mean USP approval, endorsement, certification, or automatic suitability as a method replacement. Confirm the complete method and system-suitability requirements before use.</p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading USP Standards...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load USP Standards. Please try again later.</p>
          </div>
        )}

        {/* USP Standards Grid */}
        {uspStandards && uspStandards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uspStandards.map((usp) => (
              <Card 
                key={usp.code} 
                className="hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl text-primary">{usp.code}</CardTitle>
                      <CardDescription className="font-semibold text-lg mt-1">
                        {usp.name}
                      </CardDescription>
                    </div>
                    {usp.isPopular === 1 && (
                      <Badge variant="secondary" className="ml-2">
                        Popular
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-3">
                    {usp.description}
                  </p>
                  
                  {/* Chemical Formula (if available) */}
                  {usp.chemicalName && (
                    <p className="text-xs text-muted-foreground mb-3">
                      <span className="font-semibold">Formula:</span> {usp.chemicalName}
                    </p>
                  )}
                  
                  {/* Applications (if available) */}
                  {usp.commonApplications && (
                    <p className="text-xs text-muted-foreground mb-4">
                      <span className="font-semibold">Applications:</span> {usp.commonApplications}
                    </p>
                  )}
                  
                  {/* Product Count and CTA */}
                  <div className="mt-auto pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {usp.productCount > 0 ? (
                          <span>
                            <span className="font-semibold text-primary">{usp.productCount}</span> products available
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">No products yet</span>
                        )}
                      </div>
                      
                      {usp.productCount > 0 && (
                        <Link href={USP_LANDING_CODES.includes(usp.code.toLowerCase()) ? `/usp/${usp.code.toLowerCase()}` : `/products?usp=${usp.code}`}>
                          <Button variant="ghost" size="sm" className="group">
                            {USP_LANDING_CODES.includes(usp.code.toLowerCase()) ? "View Guide" : "View Products"}
                            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {uspStandards && uspStandards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No USP Standards available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
