import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  keywords?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  robots?: string;
  structuredData?: Record<string, any> | Record<string, any>[];
  breadcrumbs?: Array<{ name: string; url: string }>;
  languageAlternates?: Array<{ lang: string; url: string }>;
  children?: React.ReactNode;
}

/**
 * SEOHead Component
 * 
 * Centralized SEO meta tag management for MONEA platform.
 * Handles title, description, Open Graph, Twitter Cards, and structured data.
 */
export function SEOHead({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = 'https://moneoez.com/icons/SE.png',
  ogImageAlt = 'MONEO — ធៀបអញ្ជើញមង្គលការឌីជីថលនៅកម្ពុជា',
  ogImageWidth = 1200,
  ogImageHeight = 630,
  twitterCard = 'summary_large_image',
  keywords,
  author,
  publishedTime,
  modifiedTime,
  robots = 'index, follow, max-image-preview:large',
  structuredData,
  breadcrumbs,
  languageAlternates,
  children,
}: SEOProps) {
  const url = canonical || `https://moneoez.com${typeof window !== 'undefined' ? window.location.pathname : ''}`;

  // Generate breadcrumb structured data if provided
  const breadcrumbSchema = breadcrumbs ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  } : null;

  // Combine all structured data
  const allStructuredData = [
    structuredData,
    breadcrumbSchema,
  ].flat().filter(Boolean);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {author && <meta name="author" content={author} />}
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Language Alternates */}
      {languageAlternates?.map(({ lang, url: altUrl }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={altUrl} />
      ))}
      {!languageAlternates && (
        <>
          <link rel="alternate" hrefLang="km" href={url} />
          <link rel="alternate" hrefLang="x-default" href={url} />
        </>
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content={String(ogImageWidth)} />
      <meta property="og:image:height" content={String(ogImageHeight)} />
      <meta property="og:site_name" content="MONEO" />
      <meta property="og:locale" content="km_KH" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />
      
      {/* Structured Data */}
      {allStructuredData.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(allStructuredData.length === 1 ? allStructuredData[0] : { '@graph': allStructuredData })}
        </script>
      )}
      
      {/* Children (additional head elements) */}
      {children}
    </Helmet>
  );
}

/**
 * Utility function to generate wedding-specific OG image URL
 * Uses Cloudinary transformation to overlay text on template
 */
export function generateWeddingOGImage(params: {
  coupleName?: string;
  date?: string;
  venue?: string;
  templateId?: string;
}): string {
  const { coupleName, date, venue, templateId } = params;
  
  // If no data, return default social media image
  if (!coupleName) {
    return 'https://moneoez.com/icons/SE.png';
  }
  
  // Use Cloudinary transformation to generate OG image
  // Format: https://res.cloudinary.com/[cloud]/image/upload/l_text:[font]:[text]/[image]
  const cloudinaryBase = 'https://res.cloudinary.com/dqtw2lfit/image/upload';
  const baseTemplate = templateId || 'og-template-default';
  
  // Encode text for URL
  const encodedCouple = encodeURIComponent(coupleName);
  const encodedDate = date ? encodeURIComponent(date) : '';
  const encodedVenue = venue ? encodeURIComponent(venue) : '';
  
  // Build Cloudinary transformation URL
  // This is a placeholder - adjust based on your Cloudinary setup
  const transformations = [
    'c_fill',
    'w_1200',
    'h_630',
    'g_center',
    `l_text:arial_60_bold:${encodedCouple}`,
    'co_rgb:ffffff',
    'g_north',
    'y_200',
  ].join(',');
  
  return `${cloudinaryBase}/${transformations}/${baseTemplate}.jpg`;
}
