const LOCALE_STORAGE_KEY = "cmelgarejo.locale";
const DEFAULT_LOCALE = "en";

const cacheOriginal = (el, attr, value) => {
  const store = `i18nDefault${attr}`;
  if (!el.dataset[store]) el.dataset[store] = value;
};

document.addEventListener("DOMContentLoaded", () => {
  let translations = { es: {} };
  let currentLocale = DEFAULT_LOCALE;

  const langButtons = [...document.querySelectorAll(".lang-btn")];
  const langGroup = document.querySelector(".lang-switcher");

  const storeDefaults = () => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      cacheOriginal(el, "Text", el.textContent);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      cacheOriginal(el, "Html", el.innerHTML);
    });
    document.querySelectorAll("[data-i18n-content]").forEach((el) => {
      cacheOriginal(el, "Content", el.getAttribute("content") || "");
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      cacheOriginal(el, "AriaLabel", el.getAttribute("aria-label") || "");
    });
  };

  const applyLocale = (locale) => {
    currentLocale = locale;
    document.documentElement.lang = locale;

    const isEs = locale === "es";
    const dict = isEs ? translations.es : null;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (isEs && dict?.[key]) el.textContent = dict[key];
      else if (el.dataset.i18nDefaultText) el.textContent = el.dataset.i18nDefaultText;
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (isEs && dict?.[key]) el.innerHTML = dict[key];
      else if (el.dataset.i18nDefaultHtml) el.innerHTML = el.dataset.i18nDefaultHtml;
    });

    document.querySelectorAll("[data-i18n-content]").forEach((el) => {
      const key = el.getAttribute("data-i18n-content");
      if (isEs && dict?.[key]) el.setAttribute("content", dict[key]);
      else if (el.dataset.i18nDefaultContent) el.setAttribute("content", el.dataset.i18nDefaultContent);
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      const label = isEs && dict?.[key] ? dict[key] : el.dataset.i18nDefaultAriaLabel || "Language";
      el.setAttribute("aria-label", label);
    });

    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) {
      const key = titleEl.getAttribute("data-i18n");
      if (isEs && dict?.[key]) document.title = dict[key];
      else if (titleEl.dataset.i18nDefaultText) document.title = titleEl.dataset.i18nDefaultText;
    }

    langButtons.forEach((btn) => {
      const active = btn.dataset.lang === locale;
      btn.setAttribute("aria-pressed", String(active));
      btn.classList.toggle("is-active", active);
    });

    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }

    document.dispatchEvent(new CustomEvent("localechange", { detail: { locale } }));
  };

  const setLocale = (locale) => {
    if (locale !== "en" && locale !== "es") return;
    applyLocale(locale);
  };

  storeDefaults();

  const saved = (() => {
    try {
      return localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      return null;
    }
  })();

  const initial = saved === "es" || saved === "en" ? saved : DEFAULT_LOCALE;

  fetch("./assets/i18n/es.json")
    .then((res) => (res.ok ? res.json() : {}))
    .then((es) => {
      translations = { es };
      applyLocale(initial);
    })
    .catch(() => applyLocale(initial));

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => setLocale(btn.dataset.lang));
  });

  window.cmelgarejoI18n = { setLocale, getLocale: () => currentLocale };
});
