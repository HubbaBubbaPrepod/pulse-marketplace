'use client';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { copy } from '../lib/copy.mjs';
import { maskGeometry } from '../lib/hero-mask.mjs';
gsap.registerPlugin(useGSAP);
export function Hero({ lang }) {
  const scope = useRef(null),
    mask = useRef(null),
    t = copy[lang];
  useGSAP(
    () => {
      const root = scope.current,
        layer = mask.current;
      const mm = gsap.matchMedia();
      mm.add(
        '(prefers-reduced-motion: no-preference)',
        () => {
          gsap
            .timeline({ defaults: { ease: 'power3.out', duration: 0.8 } })
            .from('.hero-content > *', { y: 20, opacity: 0, stagger: 0.09, clearProps: 'all' });
        },
        root,
      );
      mm.add(
        '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)',
        () => {
          let bounds = root.getBoundingClientRect(),
            visible = true,
            inside = false,
            active = false;
          const state = {
            x: bounds.width / 2,
            y: bounds.height / 2,
            radius: 0,
          };
          const pointer = { x: state.x, y: state.y },
            deformation = { xx: 1, xy: 0, yy: 1 };
          const xTo = gsap.quickTo(state, 'x', { duration: 0.4, ease: 'power3.out' }),
            yTo = gsap.quickTo(state, 'y', { duration: 0.4, ease: 'power3.out' }),
            radiusTo = gsap.quickTo(state, 'radius', { duration: 0.35, ease: 'power2.out' });
          const tweens = [xTo, yTo, radiusTo];
          function render() {
            const shape = maskGeometry(inside ? pointer : state, state, state.radius);
            const blend = 1 - Math.exp(-Math.min(gsap.ticker.deltaRatio(), 3) / 7);
            let settling = false;
            for (const key of ['xx', 'xy', 'yy']) {
              deformation[key] += (shape[key] - deformation[key]) * blend;
              if (Math.abs(shape[key] - deformation[key]) > 0.0001) settling = true;
            }
            const points = [];
            for (let i = 0; i < 48; i++) {
              const a = (i / 48) * Math.PI * 2,
                px = Math.cos(a) * state.radius,
                py = Math.sin(a) * state.radius;
              points.push(
                `${(state.x + px * deformation.xx + py * deformation.xy).toFixed(1)}px ${(state.y + px * deformation.xy + py * deformation.yy).toFixed(1)}px`,
              );
            }
            layer.style.clipPath = `polygon(${points.join(',')})`;
            if (!settling && tweens.every((to) => !to.tween.isActive())) {
              gsap.ticker.remove(render);
              active = false;
            }
          }
          function wake() {
            if (!active && visible && !document.hidden) {
              active = true;
              gsap.ticker.add(render);
            }
          }
          function move(event) {
            if (!visible || document.hidden) return;
            bounds = root.getBoundingClientRect();
            pointer.x = event.clientX - bounds.left;
            pointer.y = event.clientY - bounds.top;
            xTo(pointer.x, inside ? undefined : pointer.x);
            yTo(pointer.y, inside ? undefined : pointer.y);
            inside = true;
            radiusTo(Math.min(bounds.width * 0.15, 165));
            wake();
          }
          function leave() {
            inside = false;
            radiusTo(0);
            wake();
          }
          function visibility() {
            if (document.hidden) {
              tweens.forEach((to) => to.tween.pause());
              gsap.ticker.remove(render);
              active = false;
            } else if (visible) {
              tweens.forEach((to) => to.tween.resume());
              wake();
            }
          }
          const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (!visible) {
              gsap.ticker.remove(render);
              active = false;
              tweens.forEach((to) => to.tween.pause());
            } else {
              tweens.forEach((to) => to.tween.resume());
              wake();
            }
          });
          const resize = new ResizeObserver(() => {
            bounds = root.getBoundingClientRect();
            if (!inside) {
              state.radius = 0;
              layer.style.clipPath = 'circle(0px at 50% 50%)';
            }
          });
          observer.observe(root);
          resize.observe(root);
          root.addEventListener('pointermove', move, { passive: true });
          root.addEventListener('pointerleave', leave);
          document.addEventListener('visibilitychange', visibility);
          return () => {
            observer.disconnect();
            resize.disconnect();
            root.removeEventListener('pointermove', move);
            root.removeEventListener('pointerleave', leave);
            document.removeEventListener('visibilitychange', visibility);
            gsap.ticker.remove(render);
            tweens.forEach((to) => to.tween.kill());
            layer.style.clipPath = 'circle(0px at 50% 50%)';
          };
        },
        root,
      );
      return () => mm.revert();
    },
    { scope },
  );
  const content = (
    <>
      <h1>
        {t.heading} <span>{t.headingEnd}</span>
      </h1>
      <p>{t.intro}</p>
    </>
  );
  return (
    <section
      className="catalog-hero"
      ref={scope}
      aria-label={lang === 'ru' ? 'Pulse Marketplace' : 'Pulse Marketplace'}
    >
      <div className="hero-pattern" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>PULSE PULSE PULSE PULSE PULSE PULSE PULSE PULSE</div>
        ))}
      </div>
      <div className="hero-content">{content}</div>
      <div className="hero-inverse" ref={mask} aria-hidden="true">
        <div className="hero-pattern">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>PULSE PULSE PULSE PULSE PULSE PULSE PULSE PULSE</div>
          ))}
        </div>
        <div className="hero-content">
          <div className="hero-title">
            {t.heading} <span>{t.headingEnd}</span>
          </div>
          <p>{t.intro}</p>
        </div>
      </div>
    </section>
  );
}
