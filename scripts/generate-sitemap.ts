// scripts/generate-sitemap.ts
import * as fs from 'fs';
import * as path from 'path';

// Blog verilerini import ediyoruz
import { allBlogPosts, SupportedLangs } from '../data/blog';

// Sitenizin CANLI URL'si
const BASE_URL = 'https://ommio.app';

function generateSitemap() {
  console.log('🗺️  SEO dosyaları (Sitemap & Robots) oluşturuluyor...');

  const languages = Object.keys(allBlogPosts) as SupportedLangs[];
  let urls: string[] = [];

  // --- 1. Statik Sayfalar ---
  // Ana sayfa (Root)
  urls.push(`${BASE_URL}`); 

  languages.forEach(lang => {
    urls.push(`${BASE_URL}/${lang}/blog`); // Blog ana sayfası
    urls.push(`${BASE_URL}/${lang}/privacy`); // Gizlilik politikası
  });

  // --- 2. Dinamik Blog Yazıları ---
  languages.forEach((lang) => {
    const posts = allBlogPosts[lang];
    if (posts) {
      posts.forEach((post) => {
        // URL Yapısı: domain.com/tr/blog/zaman-yonetimi
        urls.push(`${BASE_URL}/${lang}/blog/${post.slug}`);
      });
    }
  });

  // --- 3. SITEMAP.XML OLUŞTURMA ---
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => {
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  })
  .join('\n')}
</urlset>`;

  // --- 4. ROBOTS.TXT OLUŞTURMA ---
  // Google'a sitemap'in yerini gösteren dosya
  const robotsTxtContent = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;

  // --- 5. DOSYALARI KAYDETME ---
  // Expo Router kullanıyorsan genellikle 'public' klasörü kök dizindedir.
  const publicDir = path.resolve(__dirname, '../public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  // sitemap.xml yaz
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent);
  console.log(`✅ Sitemap oluşturuldu: ${urls.length} URL.`);

  // robots.txt yaz
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxtContent);
  console.log(`✅ Robots.txt oluşturuldu.`);
}

generateSitemap();