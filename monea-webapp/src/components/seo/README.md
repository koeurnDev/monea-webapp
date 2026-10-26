# SEO Components

This directory contains reusable SEO components for the MONEA platform.

## Components

### `SEOHead`

A centralized component for managing all SEO meta tags, Open Graph, Twitter Cards, and structured data.

#### Usage

```tsx
import { SEOHead } from '@/components/seo/SEOHead';

export default function MyPage() {
  return (
    <>
      <SEOHead
        title="My Page Title"
        description="My page description"
        canonical="https://moneoez.com/my-page"
        keywords="keyword1, keyword2"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "My Page"
        }}
        breadcrumbs={[
          { name: "Home", url: "https://moneoez.com/" },
          { name: "My Page", url: "https://moneoez.com/my-page" }
        ]}
      />
      {/* Your page content */}
    </>
  );
}
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | ✅ | - | Page title |
| `description` | string | ✅ | - | Meta description |
| `canonical` | string | ❌ | Current URL | Canonical URL |
| `ogType` | 'website' \| 'article' \| 'profile' | ❌ | 'website' | Open Graph type |
| `ogImage` | string | ❌ | Logo URL | Open Graph image |
| `ogImageAlt` | string | ❌ | Default alt | OG image alt text |
| `twitterCard` | string | ❌ | 'summary_large_image' | Twitter card type |
| `keywords` | string | ❌ | - | Meta keywords |
| `author` | string | ❌ | - | Author name |
| `robots` | string | ❌ | 'index, follow...' | Robots directive |
| `structuredData` | object \| object[] | ❌ | - | JSON-LD structured data |
| `breadcrumbs` | Array | ❌ | - | Breadcrumb navigation |
| `languageAlternates` | Array | ❌ | km/x-default | Language alternatives |

## Utilities

### `generateWeddingOGImage()`

Generates dynamic Open Graph images for wedding pages using Cloudinary transformations.

```tsx
import { generateWeddingOGImage } from '@/components/seo/SEOHead';

const ogImage = generateWeddingOGImage({
  coupleName: 'John & Jane',
  date: '2026-12-25',
  venue: 'Grand Palace',
  templateId: 'elegant-rose'
});
```

## Best Practices

### 1. Title Tags
- Keep under 60 characters
- Include primary keyword
- Format: `Primary Keyword | Brand Name`

### 2. Meta Descriptions
- Keep between 150-160 characters
- Include call-to-action
- Use active voice

### 3. Structured Data
- Always include breadcrumbs for non-homepage pages
- Use specific schema types (Event, Product, FAQPage, etc.)
- Test with [Google Rich Results Test](https://search.google.com/test/rich-results)

### 4. Open Graph Images
- Minimum 1200x630px for best display
- Use dynamic OG images for unique content (weddings)
- Include descriptive alt text

### 5. Canonical URLs
- Always specify canonical URLs
- Use absolute URLs (https://moneoez.com/path)
- Avoid duplicate content issues

## Examples

### Landing Page

```tsx
<SEOHead
  title="ធៀបការឌីជីថល | TheapKa Digital - Online Invitation Khmer"
  description="បង្កើតធៀបអញ្ជើញមង្គលការឌីជីថលបានយ៉ាងងាយស្រួល..."
  canonical="https://moneoez.com/"
  keywords="MONEO, ធៀបអញ្ជើញមង្គលការ, digital wedding invitation Cambodia"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MONEO",
    "url": "https://moneoez.com/"
  }}
/>
```

### Wedding Page (Dynamic)

```tsx
<SEOHead
  title={`${coupleName} - មង្គលការឌីជីថល | MONEO`}
  description={`ធៀបអញ្ជើញមង្គលការរបស់ ${coupleName} នៅថ្ងៃទី ${weddingDate}`}
  canonical={`https://moneoez.com/w/${weddingId}`}
  ogImage={generateWeddingOGImage({ coupleName, date: weddingDate, venue })}
  structuredData={{
    "@context": "https://schema.org",
    "@type": "Event",
    "name": `មង្គលការរបស់ ${coupleName}`,
    "startDate": weddingDate,
    "location": { "@type": "Place", "name": venue }
  }}
/>
```

### Blog Article

```tsx
<SEOHead
  title="How to Create Digital Wedding Invitations"
  description="Complete guide to creating beautiful digital wedding invitations..."
  canonical="https://moneoez.com/blog/digital-wedding-invitations"
  ogType="article"
  author="MONEO Team"
  publishedTime="2026-10-23T00:00:00Z"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "How to Create Digital Wedding Invitations",
    "datePublished": "2026-10-23"
  }}
  breadcrumbs={[
    { name: "Home", url: "https://moneoez.com/" },
    { name: "Blog", url: "https://moneoez.com/blog" },
    { name: "Article", url: "https://moneoez.com/blog/digital-wedding-invitations" }
  ]}
/>
```

## Testing

Before deploying SEO changes:

1. **Validate Structured Data**
   - [Google Rich Results Test](https://search.google.com/test/rich-results)
   - [Schema.org Validator](https://validator.schema.org/)

2. **Check Social Previews**
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
   - [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

3. **Mobile Preview**
   - Google Search Console Mobile-Friendly Test
   - Test on actual devices

4. **Lighthouse SEO Score**
   - Run `npm run build` and `npm run preview`
   - Open DevTools → Lighthouse → SEO audit

## Monitoring

Track SEO performance:
- Google Search Console (search performance, indexing status)
- Google Analytics 4 (organic traffic, user behavior)
- Crawl errors and coverage reports

## Related Files

- `/public/sitemap.xml` - Main sitemap
- `/public/sitemap-pages.xml` - Static pages sitemap
- `/public/robots.txt` - Crawler directives
- `/scripts/prerender.mjs` - SSR prerendering script
