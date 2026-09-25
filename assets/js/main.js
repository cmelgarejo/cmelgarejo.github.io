document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("navbar");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
  const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const closeMenu = () => {
    nav.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("menu-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      navToggle.focus();
    }
  });

  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const activeObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveLink(visible.target.id);
    },
    { rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.15, 0.5] }
  );
  sections.forEach((section) => activeObserver.observe(section));

  const groupEntries = (section) => {
    const children = [...section.querySelector(".col-full").children];
    children.forEach((heading) => {
      if (!heading.classList.contains("flex-container")) return;
      const details = heading.nextElementSibling;
      if (!details?.classList.contains("content-left-offset")) return;
      const card = document.createElement("article");
      card.className = "entry-card reveal";
      heading.before(card);
      card.append(heading, details);
    });
  };

  ["experience", "education", "projects"].forEach((id) => {
    const section = document.getElementById(id);
    if (section) groupEntries(section);
  });

  const revealItems = document.querySelectorAll(
    "section > .col-full > h2, .entry-card, .card-container .card"
  );

  if (motionAllowed && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion-ready");
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 }
    );
    revealItems.forEach((item) => {
      item.classList.add("reveal");
      revealObserver.observe(item);
    });
  }

  if (motionAllowed && window.matchMedia("(pointer: fine)").matches) {
    const hero = document.querySelector("header .title");
    window.addEventListener(
      "pointermove",
      (event) => {
        const x = (event.clientX / window.innerWidth - 0.5) * 8;
        const y = (event.clientY / window.innerHeight - 0.5) * 8;
        hero.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      },
      { passive: true }
    );
  }
});
