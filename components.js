/**
 * components.js — Shared header & footer injected via JS.
 *
 * Each page must have:
 *   <div id="site-header" data-active="pageName"></div>
 *   <div id="site-footer"></div>
 *
 * data-active values: inicio | servicios | nosotros | contacto
 *
 * The header adapts based on session state:
 *   - Logged out  → shows Login / Registro buttons
 *   - Logged in   → shows user badge + Cerrar sesión
 */

(function () {
  "use strict";

  var SESSION_KEY = "superapp_session";

  function getSession() {
    var raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // ── HEADER ──────────────────────────────────────

  function renderHeader() {
    var container = document.getElementById("site-header");
    if (!container) return;

    var activePage = (
      container.getAttribute("data-active") || ""
    ).toLowerCase();
    var session = getSession();

    var navItems = [
      { label: "Inicio", href: "index.html", key: "inicio" },
      { label: "Servicios", href: "services.html", key: "servicios" },
      { label: "Nosotros", href: "about.html", key: "nosotros" },
      { label: "Contacto", href: "contact.html", key: "contacto" },
      { label: "Pok\u00e9dex", href: "pokedex.html", key: "pokedex" },
      { label: "Batalla", href: "battle.html", key: "batalla" },
    ];

    var navLinksHtml = navItems
      .map(function (item) {
        var cls = item.key === activePage ? ' class="active"' : "";
        return (
          '<li><a href="' +
          item.href +
          '"' +
          cls +
          ">" +
          item.label +
          "</a></li>"
        );
      })
      .join("\n          ");

    var actionsHtml;
    if (session) {
      var initials =
        (session.nombre ? session.nombre[0] : "") +
        (session.apellido ? session.apellido[0] : "");
      initials = initials.toUpperCase() || "U";

      actionsHtml =
        '<div class="header-actions">' +
        '<div class="user-badge">' +
        '<span class="user-avatar">' +
        initials +
        "</span>" +
        '<span class="user-name">' +
        session.nombre +
        "</span>" +
        "</div>" +
        '<a href="#" class="btn-outline" id="btn-logout">Cerrar sesi\u00f3n</a>' +
        "</div>";
    } else {
      actionsHtml =
        '<div class="header-actions">' +
        '<a href="index.html" class="btn-outline">Login</a>' +
        '<a href="register.html" class="btn-primary-sm">Registro</a>' +
        "</div>";
    }

    var html =
      '<header class="site-header">' +
      '<div class="header-inner">' +
      '<a href="index.html" class="logo">Super<span>App</span></a>' +
      '<ul class="nav-links">' +
      navLinksHtml +
      "</ul>" +
      actionsHtml +
      "</div>" +
      "</header>";

    container.innerHTML = html;

    // Bind logout
    var logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem(SESSION_KEY);
        console.log("[SuperApp] Sesi\u00f3n cerrada.");
        window.location.href = "index.html";
      });
    }
  }

  // ── FOOTER ──────────────────────────────────────

  function renderFooter() {
    var container = document.getElementById("site-footer");
    if (!container) return;

    container.innerHTML =
      '<footer class="site-footer">' +
      '<div class="footer-inner">' +
      '<div class="footer-brand">' +
      '<a href="index.html" class="logo">Super<span>App</span></a>' +
      "<p>Una plataforma moderna para gestionar tus proyectos de forma sencilla y eficiente.</p>" +
      "</div>" +
      '<div class="footer-col">' +
      "<h4>Producto</h4>" +
      "<ul>" +
      '<li><a href="services.html">Servicios</a></li>' +
      '<li><a href="#">Precios</a></li>' +
      '<li><a href="#">Documentaci\u00f3n</a></li>' +
      "</ul>" +
      "</div>" +
      '<div class="footer-col">' +
      "<h4>Empresa</h4>" +
      "<ul>" +
      '<li><a href="about.html">Nosotros</a></li>' +
      '<li><a href="contact.html">Contacto</a></li>' +
      '<li><a href="#">Blog</a></li>' +
      "</ul>" +
      "</div>" +
      '<div class="footer-col">' +
      "<h4>Legal</h4>" +
      "<ul>" +
      '<li><a href="#">Privacidad</a></li>' +
      '<li><a href="#">T\u00e9rminos</a></li>' +
      '<li><a href="#">Cookies</a></li>' +
      "</ul>" +
      "</div>" +
      "</div>" +
      '<div class="footer-bottom">' +
      "<p>&copy; 2026 SuperApp. Todos los derechos reservados.</p>" +
      "</div>" +
      "</footer>";
  }

  // ── ROUTE PROTECTION ────────────────────────────

  function protectRoute() {
    var body = document.body;
    if (!body.hasAttribute("data-protected")) return;

    var session = getSession();
    if (!session) {
      console.warn(
        "[SuperApp] Acceso denegado — sesi\u00f3n no iniciada. Redirigiendo al login.",
      );
      window.location.href = "index.html";
    }
  }

  // ── Init ────────────────────────────────────────

  protectRoute();
  renderHeader();
  renderFooter();
})();
