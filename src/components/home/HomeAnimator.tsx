import { useEffect } from "react";
import { animate, createTimeline, stagger } from "animejs";

export function HomeAnimator() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    document.documentElement.classList.add("home-anime-ready");

    const heroTimeline = createTimeline({ defaults: { ease: "outExpo" } });
    heroTimeline
      .add("[data-home-hero='badge']", { opacity: [0, 1], translateY: [-18, 0], duration: 650 })
      .add("[data-home-hero='title']", { opacity: [0, 1], translateY: [44, 0], duration: 850 }, "-=360")
      .add("[data-home-hero='copy']", { opacity: [0, 1], translateY: [24, 0], duration: 700 }, "-=420")
      .add("[data-home-hero='actions'] > *", { opacity: [0, 1], translateY: [24, 0], scale: [0.96, 1], delay: stagger(95), duration: 620 }, "-=360")
      .add("[data-home-hero='stat']", { opacity: [0, 1], translateY: [28, 0], rotateX: [-12, 0], delay: stagger(75), duration: 760 }, "-=240")
      .add(".home-command-center", { opacity: [0, 1], translateX: [-36, 0], scale: [0.95, 1], duration: 900 }, "-=760");

    animate(".home-scan-line", {
      translateY: ["-12%", "112%"],
      opacity: [0, 0.7, 0],
      duration: 3200,
      ease: "inOutSine",
      loop: true,
    });

    animate(".home-pulse-node", {
      scale: [1, 1.28, 1],
      opacity: [0.55, 1, 0.55],
      delay: stagger(180),
      duration: 1800,
      ease: "inOutSine",
      loop: true,
    });

    animate(".home-flow-chip", {
      translateY: [0, -9, 0],
      delay: stagger(220),
      duration: 2600,
      ease: "inOutSine",
      loop: true,
    });

    animate(".home-logo-code", {
      filter: ["drop-shadow(0 0 0 hsl(var(--primary) / 0))", "drop-shadow(0 0 18px hsl(var(--primary) / .42))", "drop-shadow(0 0 0 hsl(var(--primary) / 0))"],
      duration: 2800,
      ease: "inOutSine",
      loop: true,
    });

    const revealSelectors = "main section:not(:first-child) h2, main section:not(:first-child) h3, main section:not(:first-child) p, main section:not(:first-child) a, main section:not(:first-child) button, main section:not(:first-child) .glass, main section:not(:first-child) .rounded-xl, main section:not(:first-child) .rounded-2xl, main section:not(:first-child) [class*='grid'] > .p-5, main section:not(:first-child) [class*='grid'] > .p-3";

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .filter((el) => !el.dataset.homeAnimated);
        if (visible.length === 0) return;
        visible.forEach((el) => {
          el.dataset.homeAnimated = "1";
          el.style.transform = "";
        });

        animate(visible, {
          opacity: [0, 1],
          translateY: [34, 0],
          scale: [0.985, 1],
          duration: 820,
          delay: stagger(55),
          ease: "outExpo",
          complete: () => visible.forEach((el) => (el.style.willChange = "auto")),
        });
        visible.forEach((el) => io.unobserve(el));
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    const observeRevealTargets = () => {
      Array.from(document.querySelectorAll<HTMLElement>(revealSelectors))
        .filter((el) => !el.dataset.homeObserved && !el.dataset.homeAnimated && !el.closest("[role='dialog']"))
        .forEach((el) => {
          el.dataset.homeObserved = "1";
          el.style.opacity = "0";
          el.style.transform = "translateY(30px) scale(.985)";
          el.style.willChange = "transform, opacity";
          io.observe(el);
        });
    };

    observeRevealTargets();
    const mutationObserver = new MutationObserver(observeRevealTargets);
    mutationObserver.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });

    const sections = Array.from(document.querySelectorAll<HTMLElement>("main section"));
    const sectionIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const section = entry.target as HTMLElement;
          animate(section, {
            backgroundPositionX: ["0%", "100%"],
            duration: 1600,
            ease: "outQuad",
          });
        });
      },
      { threshold: 0.22 }
    );
    sections.forEach((section) => sectionIO.observe(section));

    const ctas = Array.from(document.querySelectorAll<HTMLElement>("main a, main button, .hover-lift"));
    const enter = (e: Event) => {
      const t = e.currentTarget as HTMLElement;
      animate(t, { translateY: -4, scale: 1.025, duration: 260, ease: "outQuad" });
    };
    const leave = (e: Event) => {
      const t = e.currentTarget as HTMLElement;
      animate(t, { translateY: 0, scale: 1, duration: 260, ease: "outQuad" });
    };
    ctas.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });

    return () => {
      document.documentElement.classList.remove("home-anime-ready");
      io.disconnect();
      mutationObserver.disconnect();
      sectionIO.disconnect();
      ctas.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, []);

  return null;
}