document.addEventListener("DOMContentLoaded", () => {
  const translations = window.PORTFOLIO_TRANSLATIONS?.es || {};
  const normalizeText = (value) => value.replace(/\s+/g, " ").trim();
  const textNodes = [];
  const translatedAttributes = [];
  const englishTitle = document.title;
  const languageButtons = [...document.querySelectorAll("[data-language]")];
  const textWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!normalizeText(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        if (["SCRIPT", "STYLE"].includes(node.parentElement?.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  while (textWalker.nextNode()) {
    const node = textWalker.currentNode;
    textNodes.push({
      node,
      english: node.nodeValue,
      key: normalizeText(node.nodeValue),
    });
  }

  document.querySelectorAll("[aria-label], [title], [alt], meta[content]").forEach((element) => {
    ["aria-label", "title", "alt", "content"].forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const english = element.getAttribute(attribute);
      if (!translations[english]) return;
      translatedAttributes.push({ element, attribute, english });
    });
  });

  const localizeTextNode = ({ node, english, key }, language) => {
    if (language === "en" || !translations[key]) {
      node.nodeValue = english;
      return;
    }
    const leadingWhitespace = english.match(/^\s*/)?.[0] || "";
    const trailingWhitespace = english.match(/\s*$/)?.[0] || "";
    node.nodeValue = `${leadingWhitespace}${translations[key]}${trailingWhitespace}`;
  };

  const applyLanguage = (language, persist = false) => {
    const selectedLanguage = language === "es" ? "es" : "en";
    textNodes.forEach((entry) => localizeTextNode(entry, selectedLanguage));
    translatedAttributes.forEach(({ element, attribute, english }) => {
      element.setAttribute(
        attribute,
        selectedLanguage === "es" ? translations[english] : english
      );
    });
    document.title =
      selectedLanguage === "es" ? translations[englishTitle] : englishTitle;
    document.documentElement.lang = selectedLanguage;
    document.documentElement.dataset.currentLanguage = selectedLanguage;
    languageButtons.forEach((button) => {
      const active = button.dataset.language === selectedLanguage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (persist) {
      try {
        localStorage.setItem("portfolio-language", selectedLanguage);
      } catch (_) {}
    }
    window.dispatchEvent(
      new CustomEvent("portfolio:languagechange", {
        detail: { language: selectedLanguage },
      })
    );
  };

  let initialLanguage = "en";
  try {
    initialLanguage =
      localStorage.getItem("portfolio-language") === "es" ? "es" : "en";
  } catch (_) {}

  try {
    applyLanguage(initialLanguage);
  } finally {
    document.documentElement.removeAttribute("data-language-loading");
  }

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyLanguage(button.dataset.language, true);
    });
  });

  window.portfolioI18n = Object.freeze({
    applyLanguage: (language) => applyLanguage(language, true),
    getLanguage: () => document.documentElement.lang,
    translationCount: Object.keys(translations).length,
  });

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

  let navUpdateQueued = false;
  const updateActiveLink = () => {
    const marker = window.scrollY + nav.offsetHeight + 48;
    const activeSection = sections.reduce(
      (current, section) => (section.offsetTop <= marker ? section : current),
      sections[0]
    );
    if (activeSection) setActiveLink(activeSection.id);
    navUpdateQueued = false;
  };
  const queueNavUpdate = () => {
    if (navUpdateQueued) return;
    navUpdateQueued = true;
    requestAnimationFrame(updateActiveLink);
  };
  document.addEventListener("scroll", queueNavUpdate, { passive: true });
  window.addEventListener("hashchange", queueNavUpdate);
  window.addEventListener("resize", queueNavUpdate);

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
  queueNavUpdate();

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
