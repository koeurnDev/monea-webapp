/**
 * Dynamic Sitemap Generator for MONEA
 * 
 * Generates sitemap.xml with:
 * - Static pages (landing, templates, pricing, etc.)
 * - Dynamic wedding pages (from database)
 * - Public invite pages
 * 
 * Usage:
 *   node scripts/generate-sitemap.mjs
 * 
 * Run this script:
 * - After deploying new static pages
 * - Periodically (cron job) to include new weddings
 * - As part of build process (optional)
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(ROOT, '..', 'public');
const SITE_URL = 'https://moneoez.com';

// Static pages configuration
const STATIC_PAGES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/templates', priority: 0.9, changefreq: 'weekly' },
  { path: '/pricing', priority: 0.9, changefreq: 'weekly' },
  { path: '/khmer-digital-wedding-invitation', priority: 0.8, changefreq: 'monthly' },
  { path: '/contact', priority: 0.6, changefreq: 'monthly' },
  { path: '/support', priority: 0.6, changefreq: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changefreq: 'yearly' },
  { path: '/terms-and-conditions', priority: 0.3, changefreq: 'yearly' },
];

/**
 * Format date as YYYY-MM-DD for sitemap
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Fetch public wedding pages from API (optional)
 * Only include weddings that are:
 * - Published (not draft)
 * - Public (not private)
 * - Active (wedding date hasn't passed by more than 30 days)
 */
async function fetchPublicWeddings() {
  try {
    const API_URL = process.env.VITE_API_URL || 'https://api.moneoez.com';
    
    // This endpoint should be created in the API
    const response = await fetch(`${API_URL}/api/sitemaps/weddings`, {
      headers: {
        'User-Agent': 'MONEO-Sitemap-Generator/1.0'
      }
    });

    if (!response.ok) {
      console.warn('Could not fetch wedding data for sitemap. Skipping dynamic routes.');
      return [];
    }

    const weddings = await response.json();
    
    return weddings.map(w => ({
      path: `/w/${w.id}`,
      priority: 0.7,
      changefreq: 'weekly',
      lastmod: w.updatedAt || w.createdAt
    }));
  } catch (error) {
    console.warn('Error fetching weddings:', error.message);
    return [];
  }
}

/**
 * Generate XML sitemap
 */
function generateSitemapXML(urls) {
  const now = formatDate(new Date());
  
  const urlEntries = urls.map(url => {
    const lastmod = url.lastmod ? formatDate(new Date(url.lastmod)) : now;
    
    return `  <url>
    <loc>${SITE_URL}${url.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Generate sitemap index
 */
function generateSitemapIndex() {
  const now = formatDate(new Date());
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
}

/**
 * Main function
 */
async function main() {
  console.log('🗺️  Generating sitemaps...\n');

  // Generate main sitemap (static pages only)
  console.log('📄 Generating sitemap.xml (static pages)...');
  const staticSitemap = generateSitemapXML(STATIC_PAGES);
  writeFileSync(path.join(PUBLIC, 'sitemap.xml'), staticSitemap, 'utf8');
  console.log(`   ✅ Written ${STATIC_PAGES.length} static pages`);

  // Generate pages sitemap (duplicate for backwards compatibility)
  console.log('📄 Generating sitemap-pages.xml...');
  const pagesSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- This file is kept for backwards compatibility -->
  <!-- All URLs are now consolidated in sitemap.xml -->
${STATIC_PAGES.slice(1).map(url => {
  const now = formatDate(new Date());
  return `  <url>
    <loc>${SITE_URL}${url.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`;
}).join('\n')}
</urlset>`;
  writeFileSync(path.join(PUBLIC, 'sitemap-pages.xml'), pagesSitemap, 'utf8');
  console.log('   ✅ Written pages sitemap');

  // Fetch and generate dynamic wedding pages (optional)
  if (process.env.INCLUDE_DYNAMIC_PAGES === 'true') {
    console.log('📄 Fetching public wedding pages...');
    const weddingPages = await fetchPublicWeddings();
    
    if (weddingPages.length > 0) {
      console.log(`   ✅ Found ${weddingPages.length} public weddings`);
      
      const weddingSitemap = generateSitemapXML(weddingPages);
      writeFileSync(path.join(PUBLIC, 'sitemap-weddings.xml'), weddingSitemap, 'utf8');
      console.log('   ✅ Written sitemap-weddings.xml');
    } else {
      console.log('   ⚠️  No public weddings found');
    }
  }

  // Generate sitemap index
  console.log('📄 Generating sitemap-index.xml...');
  const sitemapIndex = generateSitemapIndex();
  writeFileSync(path.join(PUBLIC, 'sitemap-index.xml'), sitemapIndex, 'utf8');
  console.log('   ✅ Written sitemap index');

  console.log('\n✨ Sitemaps generated successfully!\n');
  console.log('📍 Files created:');
  console.log('   - public/sitemap.xml');
  console.log('   - public/sitemap-pages.xml');
  console.log('   - public/sitemap-index.xml');
  if (process.env.INCLUDE_DYNAMIC_PAGES === 'true') {
    console.log('   - public/sitemap-weddings.xml (if weddings found)');
  }
  console.log('\n💡 Next steps:');
  console.log('   1. Commit these files to git');
  console.log('   2. Deploy to production');
  console.log('   3. Submit to Google Search Console');
  console.log('   4. Verify accessibility at https://moneoez.com/sitemap-index.xml\n');
}

main().catch(err => {
  console.error('❌ Error generating sitemaps:', err);
  process.exit(1);
});
