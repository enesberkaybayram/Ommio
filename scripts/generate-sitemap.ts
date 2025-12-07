import * as fs from 'fs';
import * as path from 'path';
import { allBlogPosts, SupportedLangs } from '../data/blog';

const BASE_URL = 'https://www.ommio.app';

function generateSitemap() {
  console.log('🚀 Sitemap scripti başladı...');

  const languages = Object.keys(allBlogPosts) as SupportedLangs[];
  let urls: string[] = [];

  // 1. Linkleri Hazırla
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

  // 2. XML İçeriği
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

  // 3. DOĞRUDAN 'dist' KLASÖRÜNE YAZMA
  // process.cwd() projenin ana klasörünü verir.
  const distDir = path.join(process.cwd(), 'dist');

  console.log(`📂 Hedef Klasör: ${distDir}`);

  // Eğer dist klasörü yoksa (Expo build başarısız olduysa) hata verip duralım
  if (!fs.existsSync(distDir)) {
    console.error("❌ HATA: 'dist' klasörü bulunamadı! Önce 'expo export' çalışmalıydı.");
    process.exit(1);
  }

  // Dosyaları yaz
  try {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent);
    console.log(`✅ sitemap.xml oluşturuldu.`);
    
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxtContent);
    console.log(`✅ robots.txt oluşturuldu.`);
    
    console.log(`🎉 SEO dosyaları başarıyla 'dist' içine enjekte edildi.`);
  } catch (error) {
    console.error("❌ Dosya yazma hatası:", error);
    process.exit(1);
  }
}

generateSitemap();