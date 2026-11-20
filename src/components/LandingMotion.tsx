'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export default function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = root.current;
    const hero = page?.querySelector<HTMLElement>('.launch-hero');
    if (!page || !hero) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    let observer: IntersectionObserver | undefined;

    function move(event: PointerEvent) {
      if (preference.matches || !pointer.matches || !hero) return;
      const bounds = hero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        hero.style.setProperty('--shift-x', `${x * 17}px`);
        hero.style.setProperty('--shift-y', `${y * 17}px`);
      });
    }

    function reset() {
      cancelAnimationFrame(frame);
      hero?.style.removeProperty('--shift-x');
      hero?.style.removeProperty('--shift-y');
    }

    const cards = page.querySelectorAll('[data-reveal]');
    function configureReveal() {
      observer?.disconnect();
      if (preference.matches || !('IntersectionObserver' in window)) {
        cards.forEach(card => card.classList.remove('reveal-pending'));
        reset();
        return;
      }

      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.remove('reveal-pending');
          observer?.unobserve(entry.target);
        }
      }, { threshold: .12 });
      cards.forEach(card => {
        if (card.getBoundingClientRect().top < window.innerHeight) return;
        card.classList.add('reveal-pending');
        observer?.observe(card);
      });
    }

    configureReveal();
    preference.addEventListener('change', configureReveal);
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', reset);
    return () => {
      observer?.disconnect();
      preference.removeEventListener('change', configureReveal);
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', reset);
      cards.forEach(card => card.classList.remove('reveal-pending'));
      reset();
    };
  }, []);

  return <div className="launch" ref={root}>{children}</div>;
}
