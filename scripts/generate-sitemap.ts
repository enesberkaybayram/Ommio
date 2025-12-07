// scripts/generate-sitemap.ts
import * as fs from 'fs';
import * as path from 'path';
import { allBlogPosts, SupportedLangs } from '../data/blog';

const BASE_URL = 'https://www.ommio.app';

function generateSitemap() {
  console.log('🗺️  Sitemap ve Robots.txt public klasörüne hazırlanıyor...');

  const languages = Object.keys(allBlogPosts) as SupportedLangs[];
  let urls: string[] = [];

  // 1. Statik Sayfalar
  urls.push(`${BASE_URL}`); 
  languages.forEach(lang => {
    urls.push(`${BASE_URL}/${lang}/blog`);
    urls.push(`${BASE_URL}/${lang}/privacy`);
  });

  // 2. Blog Yazıları
  languages.forEach((lang) => {
    const posts = allBlogPosts[lang];
    if (posts) {
      posts.forEach((post) => {
        urls.push(`${BASE_URL}/${lang}/blog/${post.slug}`);
      });
    }
  });

  // 3. İçerik Oluşturma
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  const robotsTxtContent = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;

  // 4. 'public' KLASÖRÜNE YAZMA (Expo burayı otomatik kopyalar)
  const publicDir = path.resolve(__dirname, '../public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent);
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxtContent);

  console.log(`✅ Dosyalar 'public' klasörüne yazıldı! Expo export sırasında kopyalanacak.`);
}

generateSitemap();