/**
 * app.js — Auth con localStorage como JSON "database".
 *
 * localStorage key: "superapp_users"
 * Formato: [ { nombre, apellido, email, usuario, password }, ... ]
 *
 * Usuario hardcodeado por defecto: admin / admin
 */

(function () {
  "use strict";

  var STORAGE_KEY = "superapp_users";

  // ── Helpers ──────────────────────────────────────

  function getUsers() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  function findUser(username) {
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].usuario === username) return users[i];
    }
    return null;
  }

  // ── Seed default admin user ─────────────────────

  function seedAdmin() {
    if (!findUser("admin")) {
      var users = getUsers();
      users.push({
        nombre: "Admin",
        apellido: "User",
        email: "admin@superapp.com",
        usuario: "admin",
        password: "admin",
      });
      saveUsers(users);
      console.log("[SuperApp] Usuario por defecto creado → admin / admin");
    }
  }

  // ── Show message inside form ────────────────────

  function showMessage(form, text, isError) {
    var existing = form.querySelector(".form-message");
    if (existing) existing.remove();

    var msg = document.createElement("p");
    msg.className = "form-message";
    msg.textContent = text;

    if (isError) {
      msg.classList.add("form-message--error");
    } else {
      msg.classList.add("form-message--success");
    }

    var btn = form.querySelector("button[type='submit']");
    if (btn) {
      form.insertBefore(msg, btn);
    } else {
      form.appendChild(msg);
    }
  }

  // ── LOGIN logic ─────────────────────────────────

  function initLogin() {
    var form = document.getElementById("login-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var usuario = document.getElementById("login-usuario").value.trim();
      var password = document.getElementById("login-password").value;

      if (!usuario || !password) {
        showMessage(form, "Por favor completa todos los campos.", true);
        return;
      }

      var user = findUser(usuario);

      if (!user) {
        showMessage(form, "El usuario no existe.", true);
        console.warn(
          "[SuperApp] Login fallido: usuario '" + usuario + "' no encontrado.",
        );
        return;
      }

      if (user.password !== password) {
        showMessage(form, "Contraseña incorrecta.", true);
        console.warn(
          "[SuperApp] Login fallido: contraseña incorrecta para '" +
            usuario +
            "'.",
        );
        return;
      }

      // Login exitoso
      console.log("[SuperApp] Login exitoso:", JSON.stringify(user, null, 2));
      showMessage(
        form,
        "¡Bienvenido, " + user.nombre + "! Redirigiendo...",
        false,
      );

      // Guardar sesión
      localStorage.setItem("superapp_session", JSON.stringify(user));

      setTimeout(function () {
        window.location.href = "2.html";
      }, 1200);
    });
  }

  // ── REGISTER logic ──────────────────────────────

  function initRegister() {
    var form = document.getElementById("register-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nombre = document.getElementById("reg-nombre").value.trim();
      var apellido = document.getElementById("reg-apellido").value.trim();
      var email = document.getElementById("reg-email").value.trim();
      var usuario = document.getElementById("reg-usuario").value.trim();
      var password = document.getElementById("reg-password").value;
      var confirm = document.getElementById("reg-confirm").value;

      // Validaciones
      if (!nombre || !apellido || !email || !usuario || !password || !confirm) {
        showMessage(form, "Por favor completa todos los campos.", true);
        return;
      }

      if (password.length < 4) {
        showMessage(
          form,
          "La contraseña debe tener al menos 4 caracteres.",
          true,
        );
        return;
      }

      if (password !== confirm) {
        showMessage(form, "Las contraseñas no coinciden.", true);
        return;
      }

      if (findUser(usuario)) {
        showMessage(form, "El usuario '" + usuario + "' ya existe.", true);
        console.warn(
          "[SuperApp] Registro fallido: usuario '" + usuario + "' ya existe.",
        );
        return;
      }

      // Crear nuevo usuario
      var newUser = {
        nombre: nombre,
        apellido: apellido,
        email: email,
        usuario: usuario,
        password: password,
      };

      var users = getUsers();
      users.push(newUser);
      saveUsers(users);

      // Imprimir en consola
      console.log("[SuperApp] Nuevo usuario registrado:");
      console.log(JSON.stringify(newUser, null, 2));
      console.log("[SuperApp] Total usuarios en JSON:", users.length);
      console.log("[SuperApp] BD completa:", JSON.stringify(users, null, 2));

      showMessage(
        form,
        "¡Cuenta creada con éxito! Redirigiendo al login...",
        false,
      );

      setTimeout(function () {
        window.location.href = "index.html";
      }, 1500);
    });
  }

  // ── Init ────────────────────────────────────────

  seedAdmin();
  initLogin();
  initRegister();
})();
