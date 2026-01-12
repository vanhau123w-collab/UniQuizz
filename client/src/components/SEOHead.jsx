import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEOHead Component - Dynamic Meta Tags
 * Updates meta tags for better SEO and social sharing
 */
export default function SEOHead({ 
  title, 
  description, 
  image, 
  type = 'website',
  author,
  keywords 
}) {
  const location = useLocation();
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://uniquizz.com';
  const currentUrl = `${baseUrl}${location.pathname}`;

  // Default values
  const defaultTitle = 'UniQuizz - Tạo Quiz Tự Động Bằng AI';
  const defaultDescription = 'Học nhanh, nhớ lâu, tiết kiệm thời gian với AI. Tạo quiz từ file .docx chỉ trong vài giây!';
  const defaultImage = `${baseUrl}/logo.png`;

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalImage = image || defaultImage;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;

    // Update or create meta tags
    const updateMetaTag = (property, content, isProperty = true) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', finalDescription, false);
    if (keywords) {
      updateMetaTag('keywords', keywords, false);
    }
    if (author) {
      updateMetaTag('author', author, false);
    }

    // Open Graph tags
    updateMetaTag('og:title', finalTitle);
    updateMetaTag('og:description', finalDescription);
    updateMetaTag('og:image', finalImage);
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:type', type);

    // Twitter tags
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', finalDescription);
    updateMetaTag('twitter:image', finalImage);
    updateMetaTag('twitter:url', currentUrl);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

  }, [finalTitle, finalDescription, finalImage, currentUrl, type, author, keywords]);

  return null; // This component doesn't render anything
}

/**
 * Helper function to generate quiz meta tags
 */
export function getQuizMeta(quiz) {
  return {
    title: `${quiz.title} - UniQuizz`,
    description: `Làm quiz "${quiz.title}" với ${quiz.questions?.length || 0} câu hỏi. ${quiz.summary?.[0] || 'Học nhanh, nhớ lâu với UniQuizz!'}`,
    type: 'article',
    keywords: `quiz, ${quiz.courseCode || 'học tập'}, ${quiz.title}, ôn thi`,
  };
}

/**
 * Helper function to generate flashcard meta tags
 */
export function getFlashcardMeta(flashcardSet) {
  return {
    title: `${flashcardSet.title} - Flashcard - UniQuizz`,
    description: `Học flashcard "${flashcardSet.title}" với ${flashcardSet.flashcards?.length || 0} thẻ. Ghi nhớ nhanh, hiệu quả với UniQuizz!`,
    type: 'article',
    keywords: `flashcard, ${flashcardSet.courseCode || 'học tập'}, ${flashcardSet.title}, từ vựng`,
  };
}

/**
 * Helper function to generate topic meta tags
 */
export function getTopicMeta(topic) {
  return {
    title: `${topic.title} - Từ Vựng - UniQuizz`,
    description: `Học từ vựng chủ đề "${topic.title}" với ${topic.words?.length || 0} từ. Nâng cao vốn từ vựng hiệu quả!`,
    type: 'article',
    keywords: `từ vựng, ${topic.title}, học tiếng anh, vocabulary`,
  };
}
