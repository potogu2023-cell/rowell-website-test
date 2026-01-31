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
  description = "Leading supplier of HPLC columns, accessories, and consumables. Offering Agilent, Waters, Shimadzu compatible products with worldwide shipping.",
  keywords = "HPLC columns, chromatography, analytical chemistry, laboratory equipment, Agilent columns, Waters columns",
  image = "https://www.rowellhplc.com/og-image.jpg",
  url,
  type = "website",
  publishedTime,
  author = "Rowell HPLC"
}: SEOHeadProps) {
  const siteUrl = "https://www.rowellhplc.com";
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = title.includes("Rowell HPLC") ? title : `${title} | Rowell HPLC`;

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
