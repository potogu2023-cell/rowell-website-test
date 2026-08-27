import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Eye, ArrowLeft, Share2 } from "lucide-react";
import { APP_TITLE } from "@/const";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { getResourceCatalogLinks } from "@/lib/resourceCatalogLinks";
// import { Helmet } from "react-helmet-async";

function normalizeTagLabels(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => {
      if (typeof tag === "string") return tag;
      if (tag && typeof tag === "object" && "name" in tag && typeof tag.name === "string") return tag.name;
      return "";
    }).filter(Boolean);
  }
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    return normalizeTagLabels(JSON.parse(value));
  } catch {
    return value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
}

export default function ResourceDetail() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: article, isLoading, error } = trpc.resources.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const tagLabels = normalizeTagLabels(article?.tags);
  const catalogLinks = getResourceCatalogLinks(tagLabels);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt || "",
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/resources">
            <a>
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Resources
              </Button>
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO meta tags removed - use document.title instead */}
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
                {APP_TITLE}
              </a>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/products">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Products
                </a>
              </Link>
              <Link href="/resources">
                <a className="text-sm font-medium text-foreground">
                  Resources
                </a>
              </Link>
              <Link href="/contact">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <article className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Link href="/resources">
            <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Resources
            </a>
          </Link>

          {isLoading ? (
            <>
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-8" />
              <Skeleton className="h-96 w-full mb-8" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </>
          ) : article ? (
            <>
              {/* Article Header */}
              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {article.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Draft"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{article.views ?? 0} views</span>
                  </div>
                  {article.author && (
                    <div>
                      By <span className="font-medium">{article.author}</span>
                    </div>
                  )}
                </div>

                {/* Category and Tags */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  {article.category && (
                    <Badge variant="secondary">{article.category}</Badge>
                  )}
                  {tagLabels.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>

                {/* Share Button */}
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </header>

              {/* Article Content */}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  components={{
                    // Custom iframe rendering for YouTube videos
                    iframe: ({ node, ...props }) => (
                      <div className="video-container my-8">
                        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                          <iframe
                            {...props}
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ),
                    // Custom code block styling
                    code: ({ className, children, ...props }) => (
                      <code
                        className={`bg-muted px-1.5 py-0.5 rounded text-sm font-mono ${className || ''}`}
                        {...props}
                      >
                        {children}
                      </code>
                    ),
                    // Custom link styling
                    a: ({ node, href, ...props }) => {
                      const isInternalLink = !!href && href.startsWith("/");
                      return (
                        <a
                          {...props}
                          href={href}
                          className="text-primary hover:underline"
                          {...(isInternalLink ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                        />
                      );
                    },
                  }}
                >
                  {article.content}
                </ReactMarkdown>
              </div>

              {catalogLinks.length > 0 && (
                <aside aria-label="Related catalog collections" className="mt-12 rounded-lg border border-emerald-100 bg-emerald-50 p-6">
                  <h2 className="text-xl font-bold text-slate-900">Explore related catalog collections</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">These links are based on this article’s recorded technical tags. Confirm the listed product facts and suitability for your application before inquiry.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {catalogLinks.map((link) => (
                      <Link key={link.href} href={link.href} className="rounded-md border border-emerald-200 bg-white p-4 transition-colors hover:border-emerald-400 hover:bg-emerald-50">
                        <span className="block font-semibold text-primary">{link.label}</span>
                        <span className="mt-1 block text-sm leading-5 text-slate-600">{link.description}</span>
                      </Link>
                    ))}
                  </div>
                </aside>
              )}

              {/* Call to Action */}
              <div className="mt-12 p-6 bg-primary/5 rounded-lg border border-primary/10">
                <h3 className="text-xl font-bold mb-2">Need Help with Your HPLC Analysis?</h3>
                <p className="text-muted-foreground mb-4">
                  Our team of chromatography experts is here to help you find the right solution for your application.
                </p>
                <div className="flex gap-4">
                  <Link href="/contact">
                    <a>
                      <Button>Contact Us</Button>
                    </a>
                  </Link>
                  <Link href="/products">
                    <a>
                      <Button variant="outline">Browse Products</Button>
                    </a>
                  </Link>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
    </>
  );
}
