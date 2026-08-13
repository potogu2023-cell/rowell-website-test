import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  author?: string;
}

export function SEOHead({
  title = "Rowell HPLC - High-Performance Liquid Chromatography Columns & Accessories",
  description = "Chromatography consumables catalog with HPLC columns, GC columns, SPE products, and recorded specifications. Submit an inquiry to confirm current product details for your application.",
  keywords = "HPLC columns, chromatography, analytical chemistry, laboratory equipment, Agilent columns, Waters columns",
  image = "https://www.rowellhplc.com/og-image.jpg",
  url,
  type = "website",
  publishedTime,
  author = "Rowell HPLC"
}: SEOHeadProps) {
  // Always use HTTPS canonical URL to ensure consistent indexing
  const siteUrl = "https://www.rowellhplc.com";
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = (title.includes("Rowell HPLC") || title.includes("ROWELL") || title.includes("ROWELL")) ? title : `${title} | ROWELL`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Rowell HPLC" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="language" content="English" />
      <meta httpEquiv="Content-Language" content="en" />
    </Helmet>
  );
}
