import { useEffect } from "react";
import { animate, createTimeline, stagger } from "animejs";

/**
 * HomeAnimator — pronounced, clearly visible animations across the homepage.
 * - Hero: bold entry timeline on first paint
 * - Sections: dramatic scroll-in reveals (translate + scale + rotate) for headings, cards, and grid items
 * - Ambient: floating orbs, pulsing nodes, scanning line, gradient shimmer on headings
 * - Buttons/cards: pronounced hover lift
 * Respects prefers-reduced-motion.
 */
export function HomeAnimator() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    document.documentElement.classList.add("home-anime-ready");

    // ── Ambient floating orbs layer (visible background motion) ──────────────
    const orbLayer = document.createElement("div");
    orbLayer.setAttribute("aria-hidden", "true");
    orbLayer.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;";
    const orbColors = [
      "hsl(var(--primary) / 0.28)",
      "hsl(var(--accent) / 0.25)",
      "hsl(var(--success) / 0.22)",
      "hsl(var(--warning) / 0.22)",
      "hsl(var(--primary) / 0.20)",
    ];
    const orbs: HTMLDivElement[] = [];
    for (let i = 0; i < 5; i++) {
      const orb = document.createElement("div");
      const size = 220 + Math.random() * 260;
      orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:${orbColors[i]};filter:blur(90px);top:${Math.random() * 100}%;left:${Math.random() * 100}%;transform:translate(-50%,-50%);will-change:transform,opacity;`;
      orbLayer.appendChild(orb);
      orbs.push(orb);
    }
    document.body.appendChild(orbLayer);
    orbs.forEach((orb, i) => {
      animate(orb, {
        translateX: [`${(Math.random() - 0.5) * 40}vw`, `${(Math.random() - 0.5) * 40}vw`],
        translateY: [`${(Math.random() - 0.5) * 30}vh`, `${(Math.random() - 0.5) * 30}vh`],
        scale: [0.9, 1.25, 0.95],
        opacity: [0.5, 0.9, 0.5],
        duration: 12000 + i * 1800,
        ease: "inOutSine",
        loop: true,
        alternate: true,
      });
    });

    // ── Hero entry timeline ─────────────────────────────────────────────────
    const heroTimeline = createTimeline({ defaults: { ease: "outExpo" } });
    heroTimeline
      .add("[data-home-hero='badge']", { opacity: [0, 1], translateY: [-24, 0], duration: 700 })
      .add("[data-home-hero='title']", { opacity: [0, 1], translateY: [56, 0], scale: [0.94, 1], duration: 950 }, "-=380")
      .add("[data-home-hero='copy']", { opacity: [0, 1], translateY: [30, 0], duration: 750 }, "-=520")
      .add("[data-home-hero='actions'] > *", { opacity: [0, 1], translateY: [30, 0], scale: [0.9, 1], delay: stagger(110), duration: 700 }, "-=380")
      .add("[data-stat-card]", { opacity: [0, 1], translateY: [40, 0], scale: [0.85, 1], rotate: [-4, 0], delay: stagger(90), duration: 820 }, "-=320")
      .add(".home-command-center", { opacity: [0, 1], translateX: [-60, 0], scale: [0.9, 1], duration: 1000 }, "-=820");

    // ── Persistent ambient loops on hero decor ──────────────────────────────
    animate(".home-scan-line", {
      translateY: ["-12%", "112%"],
      opacity: [0, 0.85, 0],
      duration: 2800,
      ease: "inOutSine",
      loop: true,
    });
    animate(".home-pulse-node", {
      scale: [1, 1.4, 1],
      opacity: [0.5, 1, 0.5],
      delay: stagger(180),
      duration: 1600,
      ease: "inOutSine",
      loop: true,
    });
    animate(".home-flow-chip", {
      translateY: [0, -12, 0],
      delay: stagger(220),
      duration: 2400,
      ease: "inOutSine",
      loop: true,
    });

    // ── Scroll-triggered pronounced reveals ─────────────────────────────────
    const revealSelectors = [
      "main section:not(:first-child) h1",
      "main section:not(:first-child) h2",
      "main section:not(:first-child) h3",
      "main section:not(:first-child) > div > p",
      "main section:not(:first-child) .glass",
      "main section:not(:first-child) [class*='rounded-xl']",
      "main section:not(:first-child) [class*='rounded-2xl']",
      "main section:not(:first-child) [class*='rounded-3xl']",
      "main section:not(:first-child) .grid > *",
    ].join(",");

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .filter((el) => !el.dataset.homeAnimated);
        if (visible.length === 0) return;
        visible.forEach((el) => {
          el.dataset.homeAnimated = "1";
        });

        animate(visible, {
          opacity: [0, 1],
          translateY: [60, 0],
          scale: [0.9, 1],
          rotate: [(_el: HTMLElement, i: number) => (i % 2 === 0 ? -2 : 2), 0],
          duration: 900,
          delay: stagger(70),
          ease: "outExpo",
          complete: () =>
            visible.forEach((el) => {
              el.style.willChange = "auto";
              el.style.transform = "";
            }),
        });
        visible.forEach((el) => io.unobserve(el));
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    const prepareEl = (el: HTMLElement) => {
      el.dataset.homeObserved = "1";
      el.style.opacity = "0";
      el.style.transform = "translateY(60px) scale(0.9)";
      el.style.willChange = "transform, opacity";
      io.observe(el);
    };

    const observeRevealTargets = () => {
      Array.from(document.querySelectorAll<HTMLElement>(revealSelectors))
        .filter(
          (el) =>
            !el.dataset.homeObserved &&
            !el.dataset.homeAnimated &&
            !el.closest("[role='dialog']") &&
            !el.closest("[data-home-hero]")
        )
        .forEach(prepareEl);
    };

    observeRevealTargets();
    const mutationObserver = new MutationObserver(() => observeRevealTargets());
    mutationObserver.observe(document.querySelector("main") ?? document.body, {
      childList: true,
      subtree: true,
    });

    // ── Pronounced hover lift on cards & CTAs ───────────────────────────────
    const hoverTargets = new Set<HTMLElement>();
    const collectHoverTargets = () => {
      Array.from(
        document.querySelectorAll<HTMLElement>(
          "main .glass, main [class*='rounded-xl'], main [class*='rounded-2xl'], main a > button, main section button"
        )
      ).forEach((el) => hoverTargets.add(el));
    };
    collectHoverTargets();
    const enter = (e: Event) => {
      const t = e.currentTarget as HTMLElement;
      animate(t, { translateY: -8, scale: 1.035, duration: 320, ease: "outBack" });
    };
    const leave = (e: Event) => {
      const t = e.currentTarget as HTMLElement;
      animate(t, { translateY: 0, scale: 1, duration: 320, ease: "outQuad" });
    };
    hoverTargets.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });

    return () => {
      document.documentElement.classList.remove("home-anime-ready");
      io.disconnect();
      mutationObserver.disconnect();
      hoverTargets.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
      orbLayer.remove();
    };
  }, []);

  return null;
}