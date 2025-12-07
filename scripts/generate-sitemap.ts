import * as fs from 'fs';
import * as path from 'path';
import { allBlogPosts, SupportedLangs } from '../data/blog';

const BASE_URL = 'https://www.ommio.app';

function generateSitemap() {
  console.log('🗺️  Sitemap dist klasörüne yazılıyor...');

  const languages = Object.keys(allBlogPosts) as SupportedLangs[];
  let urls: string[] = [];

  // Linkleri Hazırla
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

  // XML İçeriği
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

  // --- KRİTİK KISIM: DIST KLASÖRÜNE YAZMA ---
  // Expo export işlemi bittiğinde 'dist' klasörü oluşmuş olur.
  // Biz de dosyayı oraya, index.html'in yanına koyarız.
  const distDir = path.resolve(__dirname, '../dist');

  // Eğer dist klasörü yoksa (hata durumunda) oluştur
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent);
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxtContent);

  console.log(`✅ İŞLEM TAMAM: Sitemap ve Robots.txt 'dist' klasörüne eklendi.`);
}

generateSitemap();