// data/blog/index.ts

// 1. Tip Tanımı
export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  date: string;
  content: string;
  image?: string;
}

export type SupportedLangs = 'en' | 'tr' | 'nl' | 'de' | 'es' | 'fr' | 'ar' | 'id' | 'pt' | 'hi' | 'ko' | 'ja' | 'ru' | 'it' | 'pl' | 'uk';

// 2. Yazıları İçe Aktar (Import)
// Türkçe Yazılar
import { zamanYonetimiTr } from './tr/zaman-yonetimi';

// İngilizce Yazılar
import { timeManagementEn } from './en/time-management';
// ... diğer diller ...

// 3. Hepsini Tek Objede Topla
export const allBlogPosts: Record<SupportedLangs, BlogPost[]> = {
  tr: [
    zamanYonetimiTr,
    // Yeni yazı ekledikçe buraya koyacaksınız
  ],
  en: [
    timeManagementEn,
    // ...
  ],
  // Diğer diller için boş diziler veya yazılar
  nl: [], de: [], es: [], fr: [], ar: [], id: [], pt: [], hi: [], ko: [], ja: [], ru: [], it: [], pl: [], uk: []
};