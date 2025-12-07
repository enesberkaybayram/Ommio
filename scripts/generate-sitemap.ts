// scripts/generate-sitemap.ts
import * as fs from 'fs';
import * as path from 'path';
import { allBlogPosts, SupportedLangs } from '../data/blog';

const BASE_URL = 'https://www.ommio.app'; // www ekledim, canonical için daha iyidir

function generateSitemap() {
  console.log('🗺️  SEO dosyaları oluşturuluyor...');

  const languages = Object.keys(allBlogPosts) as SupportedLangs[];
  let urls: string[] = [];

  // --- 1. Linkleri Hazırla ---
  urls.push(`${BASE_URL}`); 

  languages.forEach(lang => {
    urls.push(`${BASE_URL}/${lang}/blog`);
    urls.push(`${BASE_URL}/${lang}/privacy`);
  });

  languages.forEach((lang) => {
    const posts = allBlogPosts[lang];
    if (posts) {
      posts.forEach((post) => {
        urls.push(`${BASE_URL}/${lang}/blog/${post.slug}`);
      });
    }
  });

  // --- 2. İçerikleri Oluştur ---
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

  // --- 3. KRİTİK DEĞİŞİKLİK: 'dist' KLASÖRÜNE YAZMA ---
  // Expo export işlemi bittikten sonra 'dist' klasörü oluşmuş olacak.
  // Biz de dosyaları direkt oraya atıyoruz.
  const distDir = path.resolve(__dirname, '../dist');

  // Eğer dist klasörü yoksa (export hatası vs.) oluştur ki script patlamasın
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent);
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxtContent);

  console.log(`✅ Başarılı! Dosyalar 'dist' klasörüne yazıldı: ${urls.length} URL.`);
}

generateSitemap();