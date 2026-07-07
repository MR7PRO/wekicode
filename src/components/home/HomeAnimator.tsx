import { useEffect } from "react";
import { animate, stagger, createTimeline } from "animejs";

/**
 * HomeAnimator wires anime.js effects across the entire homepage without
 * touching each section's markup. It uses two IntersectionObservers:
 *  - one for "reveal" (fade + rise) on section headings, cards, list items
 *  - one for "count" on any element with data-count-to
 * It also spins up a subtle floating orb layer and a text shimmer on the H1.
 */
export function HomeAnimator() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    // Selectors that get a staggered reveal
    const revealSelectors = [
      "section h2",
      "section h3",
      "section p.section-lead",
      "[data-animate='reveal']",
      "[data-animate-group] > *",
    ];

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(revealSelectors.join(","))
    ).filter((el) => !el.dataset.animated);

    targets.forEach((el) => {
      el.style.opacity = "0";
      el.style.willChange = "transform, opacity";
    });

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .filter((el) => !el.dataset.animated);
        if (visible.length === 0) return;
        visible.forEach((el) => (el.dataset.animated = "1"));

        // Group siblings so stagger feels natural per row
        const groups = new Map<Element, HTMLElement[]>();
        visible.forEach((el) => {
          const parent = el.parentElement ?? document.body;
          const arr = groups.get(parent) ?? [];
          arr.push(el);
          groups.set(parent, arr);
        });

        groups.forEach((els) => {
          animate(els, {
            opacity: [0, 1],
            translateY: [28, 0],
            scale: [0.98, 1],
            duration: 750,
            ease: "outExpo",
            delay: stagger(70),
          });
        });

        visible.forEach((el) => io.unobserve(el));
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    targets.forEach((el) => io.observe(el));

    // Count-up numbers: data-count-to="123"
    const numEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-count-to]")
    );
    const numIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          if (el.dataset.counted) return;
          el.dataset.counted = "1";
          const to = Number(el.dataset.countTo || "0");
          const suffix = el.dataset.countSuffix ?? "";
          const obj = { v: 0 };
          animate(obj, {
            v: to,
            duration: 1400,
            ease: "outCubic",
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toLocaleString("ar-EG") + suffix;
            },
          });
          numIO.unobserve(el);
        });
      },
      { threshold: 0.3 }
    );
    numEls.forEach((el) => numIO.observe(el));

    // Ambient floating orbs layer (added once)
    let orbLayer: HTMLDivElement | null = null;
    if (!document.getElementById("home-orbs-layer")) {
      orbLayer = document.createElement("div");
      orbLayer.id = "home-orbs-layer";
      orbLayer.style.cssText =
        "position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;";
      const palette = [
        "hsl(187 85% 45% / 0.10)",
        "hsl(35 100% 50% / 0.10)",
        "hsl(210 100% 55% / 0.10)",
      ];
      for (let i = 0; i < 6; i++) {
        const orb = document.createElement("div");
        const size = 120 + Math.random() * 180;
        orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;filter:blur(40px);background:${palette[i % palette.length]};top:${Math.random() * 100}%;left:${Math.random() * 100}%;`;
        orbLayer.appendChild(orb);
        animate(orb, {
          translateX: [0, (Math.random() - 0.5) * 160],
          translateY: [0, (Math.random() - 0.5) * 160],
          scale: [1, 1.15, 1],
          duration: 9000 + Math.random() * 6000,
          ease: "inOutSine",
          loop: true,
          alternate: true,
          delay: Math.random() * 1500,
        });
      }
      document.body.appendChild(orbLayer);
    }

    // Magnetic hover-lift on primary CTA buttons
    const ctas = Array.from(document.querySelectorAll<HTMLElement>("a .inline-flex, a button, .hover-lift"));
    const enter = (e: Event) => {
      const t = e.currentTarget as HTMLElement;
      animate(t, { scale: 1.03, duration: 260, ease: "outQuad" });
    };
    const leave = (e: Event) => {
      const t = e.currentTarget as HTMLElement;
      animate(t, { scale: 1, duration: 260, ease: "outQuad" });
    };
    ctas.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });

    // Timeline for the very first paint sequence (badge → h1 → subtitle → CTAs)
    const heroSeq = createTimeline({ defaults: { ease: "outExpo", duration: 700 } });
    const badge = document.querySelector<HTMLElement>("section .inline-flex.rounded-full");
    const h1 = document.querySelector<HTMLElement>("section h1");
    if (badge) heroSeq.add(badge, { opacity: [0, 1], translateY: [-10, 0] });
    if (h1) heroSeq.add(h1, { opacity: [0, 1], translateY: [20, 0] }, "-=400");

    return () => {
      io.disconnect();
      numIO.disconnect();
      ctas.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
      if (orbLayer && orbLayer.parentElement) orbLayer.parentElement.removeChild(orbLayer);
    };
  }, []);

  return null;
}