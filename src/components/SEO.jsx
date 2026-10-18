import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DOMAIN = 'https://national-traders.vercel.app';

export default function SEO({
  title,
  description,
  keywords,
  canonicalPath
}) {
  const location = useLocation();
  const path = canonicalPath || location.pathname;
  const canonicalUrl = `${DOMAIN}${path === '/' ? '/' : path}`;

  useEffect(() => {
    // 1. Update Document Title
    if (title) {
      document.title = title;
    }

    // 2. Helper to set or create meta tag
    const setMeta = (attr, val, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${val}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 3. Helper to set or create canonical link
    const setCanonical = (href) => {
      let el = document.querySelector('link[rel="canonical"]');
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('property', 'twitter:description', description);
    }

    if (keywords) {
      setMeta('name', 'keywords', keywords);
    }

    if (title) {
      setMeta('property', 'og:title', title);
      setMeta('property', 'twitter:title', title);
    }

    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'twitter:url', canonicalUrl);
    setCanonical(canonicalUrl);
  }, [title, description, keywords, canonicalUrl]);

  return null;
}
