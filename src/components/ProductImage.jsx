import { useEffect, useState } from 'react';
import { findImage, peek } from '../lib.js';

export default function ProductImage({ p }) {
  const primary = p.img || '';
  const fallback = p.fallback_url || p.fallbackUrl || '';
  const q = p.q || p.name;

  // stages: 'primary' -> 'fallback' -> 'auto' -> 'emoji'
  const [stage, setStage] = useState(primary ? 'primary' : fallback ? 'fallback' : 'auto');
  const [autoSrc, setAutoSrc] = useState(peek(q));

  useEffect(() => {
    let live = true;
    if (primary) {
      setStage('primary');
    } else if (fallback) {
      setStage('fallback');
    } else {
      setStage('auto');
      setAutoSrc(peek(q));
      findImage(q).then(u => {
        if (live && u) setAutoSrc(u);
      });
    }
    return () => { live = false; };
  }, [primary, fallback, q]);

  const handlePrimaryError = () => {
    if (fallback) {
      setStage('fallback');
    } else {
      setStage('auto');
      findImage(q).then(u => { if (u) setAutoSrc(u); });
    }
  };

  const handleFallbackError = () => {
    setStage('auto');
    findImage(q).then(u => { if (u) setAutoSrc(u); });
  };

  const handleAutoError = () => {
    setStage('emoji');
  };

  if (stage === 'primary' && primary) {
    return (
      <div className="thumb">
        <img
          src={primary}
          alt={p.name}
          loading="lazy"
          onError={handlePrimaryError}
        />
      </div>
    );
  }

  if (stage === 'fallback' && fallback) {
    return (
      <div className="thumb">
        <img
          src={fallback}
          alt={`${p.name} (fallback)`}
          loading="lazy"
          onError={handleFallbackError}
        />
      </div>
    );
  }

  if (stage === 'auto' && autoSrc) {
    return (
      <div className="thumb">
        <img
          src={autoSrc}
          alt={p.name}
          loading="lazy"
          onError={handleAutoError}
        />
      </div>
    );
  }

  return (
    <div className="thumb">
      <span aria-hidden="true">{p.e || '🛍️'}</span>
    </div>
  );
}
