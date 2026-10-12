const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const navigation = document.querySelector("#site-nav");

if (header && toggle && navigation) {
  const closeMenu = () => {
    header.classList.remove("is-nav-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const willOpen = !header.classList.contains("is-nav-open");
    header.classList.toggle("is-nav-open", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      toggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeMenu();
  });
}
