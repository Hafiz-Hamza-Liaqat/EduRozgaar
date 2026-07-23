import { useEffect, useRef, useState } from 'react';

/**
 * IntersectionObserver enter animation with prefers-reduced-motion support (C.6.4.14).
 * @param {string} animation
 */
export function useBlockEnterAnimation(animation) {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!animation || animation === 'none') {
      setEntered(true);
      return undefined;
    }

    const reduced = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setEntered(true);
      return undefined;
    }

    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [animation]);

  return { ref, entered };
}
