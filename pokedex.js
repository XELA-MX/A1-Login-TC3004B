/**
 * pokedex.js — Pokédex usando PokéAPI v2
 *
 * Features:
 *  - Carga inicial de 40 Pokémon con "Cargar más"
 *  - Búsqueda por nombre o número
 *  - Filtro por tipo
 *  - Modal de detalle con stats, habilidades, info
 */

(function () {
  "use strict";

  var API = "https://pokeapi.co/api/v2";
  var BATCH = 40;
  var offset = 0;
  var allLoaded = []; // cached pokemon basic data
  var pokemonCache = {}; // id -> full detail

  // Type colors
  var TYPE_COLORS = {
    normal: "#a8a878",
    fire: "#f08030",
    water: "#6890f0",
    electric: "#f8d030",
    grass: "#78c850",
    ice: "#98d8d8",
    fighting: "#c03028",
    poison: "#a040a0",
    ground: "#e0c068",
    flying: "#a890f0",
    psychic: "#f85888",
    bug: "#a8b820",
    rock: "#b8a038",
    ghost: "#705898",
    dragon: "#7038f8",
    dark: "#705848",
    steel: "#b8b8d0",
    fairy: "#ee99ac",
  };

  // DOM refs
  var grid = document.getElementById("pkdx-grid");
  var loading = document.getElementById("pkdx-loading");
  var loadMoreBtn = document.getElementById("pkdx-load-more");
  var searchInput = document.getElementById("pkdx-search");
  var typeFilter = document.getElementById("pkdx-type-filter");
  var modal = document.getElementById("pkdx-modal");
  var modalBody = document.getElementById("pkdx-modal-body");
  var modalClose = document.getElementById("pkdx-modal-close");
  var modalBackdrop = modal.querySelector(".pkdx-modal-backdrop");

  // ── Fetch helpers ───────────────────────────────

  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function getPokemonDetail(idOrName) {
    if (pokemonCache[idOrName]) {
      return Promise.resolve(pokemonCache[idOrName]);
    }
    return fetchJSON(API + "/pokemon/" + idOrName).then(function (data) {
      pokemonCache[data.id] = data;
      pokemonCache[data.name] = data;
      return data;
    });
  }

  function getSpecies(id) {
    return fetchJSON(API + "/pokemon-species/" + id);
  }

  // ── Type badge HTML ─────────────────────────────

  function typeBadge(typeName) {
    var bg = TYPE_COLORS[typeName] || "#888";
    return (
      '<span class="pkdx-type" style="background:' +
      bg +
      '">' +
      typeName +
      "</span>"
    );
  }

  // ── Render a single card ────────────────────────

  function renderCard(poke) {
    var id = poke.id;
    var name = poke.name;
    var img =
      poke.sprites.other["official-artwork"].front_default ||
      poke.sprites.front_default ||
      "";
    var types = poke.types
      .map(function (t) {
        return typeBadge(t.type.name);
      })
      .join(" ");

    var primaryType = poke.types[0].type.name;
    var bg = TYPE_COLORS[primaryType] || "#888";

    var card = document.createElement("div");
    card.className = "pkdx-card";
    card.setAttribute("data-id", id);
    card.innerHTML =
      '<div class="pkdx-card-img" style="background:' +
      bg +
      '22">' +
      '<img src="' +
      img +
      '" alt="' +
      name +
      '" loading="lazy" />' +
      "</div>" +
      '<div class="pkdx-card-info">' +
      '<span class="pkdx-card-num">#' +
      String(id).padStart(3, "0") +
      "</span>" +
      '<h3 class="pkdx-card-name">' +
      name +
      "</h3>" +
      '<div class="pkdx-card-types">' +
      types +
      "</div>" +
      "</div>";

    card.addEventListener("click", function () {
      openModal(id);
    });

    return card;
  }

  // Carga algunos pokemones

  function loadBatch() {
    loading.style.display = "flex";
    loadMoreBtn.style.display = "none";

    return fetchJSON(API + "/pokemon?limit=" + BATCH + "&offset=" + offset)
      .then(function (data) {
        var promises = data.results.map(function (p) {
          return getPokemonDetail(p.name);
        });
        return Promise.all(promises);
      })
      .then(function (pokemons) {
        pokemons.forEach(function (poke) {
          allLoaded.push(poke);
          grid.appendChild(renderCard(poke));
        });
        offset += BATCH;
        loading.style.display = "none";
        loadMoreBtn.style.display = "inline-block";
      })
      .catch(function (err) {
        console.error("[Pokédex] Error al cargar:", err);
        loading.innerHTML =
          '<p style="color:#ff6b6b">Error al cargar Pokémon.</p>';
      });
  }

  // ── Busqueda ──────────────────────────────────────

  var searchTimer = null;

  function handleSearch() {
    var query = searchInput.value.trim().toLowerCase();
    var selectedType = typeFilter.value;

    // Si se busca por numero exacto
    if (/^\d+$/.test(query)) {
      var numId = parseInt(query, 10);
      loading.style.display = "flex";
      grid.innerHTML = "";
      loadMoreBtn.style.display = "none";

      getPokemonDetail(numId)
        .then(function (poke) {
          loading.style.display = "none";
          grid.appendChild(renderCard(poke));
        })
        .catch(function () {
          loading.style.display = "none";
          grid.innerHTML =
            '<p class="pkdx-empty">No se encontró el Pokémon #' +
            query +
            "</p>";
        });
      return;
    }

    // Filter from loaded list
    if (query || selectedType) {
      grid.innerHTML = "";
      var filtered = allLoaded.filter(function (poke) {
        var matchesName = !query || poke.name.indexOf(query) !== -1;
        var matchesType =
          !selectedType ||
          poke.types.some(function (t) {
            return t.type.name === selectedType;
          });
        return matchesName && matchesType;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '<p class="pkdx-empty">No se encontraron Pokémon.</p>';
      } else {
        filtered.forEach(function (poke) {
          grid.appendChild(renderCard(poke));
        });
      }
      loadMoreBtn.style.display = "none";
    } else {
      // Reset: show all loaded
      grid.innerHTML = "";
      allLoaded.forEach(function (poke) {
        grid.appendChild(renderCard(poke));
      });
      loadMoreBtn.style.display = "inline-block";
    }
  }

  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(handleSearch, 300);
  });

  typeFilter.addEventListener("change", handleSearch);

  // ── Modal ───────────────────────────────────────

  function openModal(id) {
    modal.classList.add("active");
    modalBody.innerHTML =
      '<div class="pkdx-loading" style="display:flex"><div class="pkdx-spinner"></div></div>';

    Promise.all([getPokemonDetail(id), getSpecies(id)])
      .then(function (results) {
        var poke = results[0];
        var species = results[1];

        var img =
          poke.sprites.other["official-artwork"].front_default ||
          poke.sprites.front_default ||
          "";
        var primaryType = poke.types[0].type.name;
        var bg = TYPE_COLORS[primaryType] || "#888";

        var types = poke.types
          .map(function (t) {
            return typeBadge(t.type.name);
          })
          .join(" ");

        // Find Spanish flavor text
        var flavorEntry = null;
        for (var i = 0; i < species.flavor_text_entries.length; i++) {
          if (species.flavor_text_entries[i].language.name === "es") {
            flavorEntry = species.flavor_text_entries[i];
            break;
          }
        }
        if (!flavorEntry && species.flavor_text_entries.length > 0) {
          // fallback to English
          for (var j = 0; j < species.flavor_text_entries.length; j++) {
            if (species.flavor_text_entries[j].language.name === "en") {
              flavorEntry = species.flavor_text_entries[j];
              break;
            }
          }
        }
        var description = flavorEntry
          ? flavorEntry.flavor_text.replace(/[\n\f]/g, " ")
          : "";

        // Find Spanish genus
        var genus = "";
        for (var g = 0; g < species.genera.length; g++) {
          if (species.genera[g].language.name === "es") {
            genus = species.genera[g].genus;
            break;
          }
        }
        if (!genus) {
          for (var g2 = 0; g2 < species.genera.length; g2++) {
            if (species.genera[g2].language.name === "en") {
              genus = species.genera[g2].genus;
              break;
            }
          }
        }

        // Stats
        var statsHtml = poke.stats
          .map(function (s) {
            var pct = Math.min((s.base_stat / 255) * 100, 100);
            return (
              '<div class="pkdx-stat">' +
              '<span class="pkdx-stat-name">' +
              s.stat.name.replace("special-", "sp. ").replace("hp", "HP") +
              "</span>" +
              '<span class="pkdx-stat-val">' +
              s.base_stat +
              "</span>" +
              '<div class="pkdx-stat-bar">' +
              '<div class="pkdx-stat-fill" style="width:' +
              pct +
              "%;background:" +
              bg +
              '"></div>' +
              "</div>" +
              "</div>"
            );
          })
          .join("");

        // Abilities
        var abilities = poke.abilities
          .map(function (a) {
            return (
              '<span class="pkdx-ability">' +
              a.ability.name.replace("-", " ") +
              (a.is_hidden ? " (oculta)" : "") +
              "</span>"
            );
          })
          .join("");

        var heightM = (poke.height / 10).toFixed(1);
        var weightKg = (poke.weight / 10).toFixed(1);

        modalBody.innerHTML =
          '<div class="pkdx-detail">' +
          '<div class="pkdx-detail-header" style="background:' +
          bg +
          '22">' +
          '<img src="' +
          img +
          '" alt="' +
          poke.name +
          '" />' +
          "</div>" +
          '<div class="pkdx-detail-body">' +
          '<span class="pkdx-card-num">#' +
          String(poke.id).padStart(3, "0") +
          "</span>" +
          '<h2 class="pkdx-detail-name">' +
          poke.name +
          "</h2>" +
          (genus ? '<p class="pkdx-detail-genus">' + genus + "</p>" : "") +
          '<div class="pkdx-card-types" style="justify-content:center">' +
          types +
          "</div>" +
          (description
            ? '<p class="pkdx-detail-desc">' + description + "</p>"
            : "") +
          '<div class="pkdx-detail-metrics">' +
          "<div><strong>" +
          heightM +
          " m</strong><span>Altura</span></div>" +
          "<div><strong>" +
          weightKg +
          " kg</strong><span>Peso</span></div>" +
          "<div><strong>" +
          poke.base_experience +
          "</strong><span>Exp. base</span></div>" +
          "</div>" +
          '<h4 class="pkdx-section-title">Estadísticas base</h4>' +
          '<div class="pkdx-stats">' +
          statsHtml +
          "</div>" +
          '<h4 class="pkdx-section-title">Habilidades</h4>' +
          '<div class="pkdx-abilities">' +
          abilities +
          "</div>" +
          "</div>" +
          "</div>";
      })
      .catch(function (err) {
        console.error("[Pokédex] Error al cargar detalle:", err);
        modalBody.innerHTML =
          '<p style="color:#ff6b6b;text-align:center;padding:2rem">Error al cargar detalles.</p>';
      });
  }

  function closeModal() {
    modal.classList.remove("active");
  }

  modalClose.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });

  function loadTypes() {
    fetchJSON(API + "/type")
      .then(function (data) {
        data.results.forEach(function (t) {
          if (t.name === "unknown" || t.name === "shadow") return;
          var opt = document.createElement("option");
          opt.value = t.name;
          opt.textContent = t.name.charAt(0).toUpperCase() + t.name.slice(1);
          typeFilter.appendChild(opt);
        });
      })
      .catch(function () {});
  }

  loadMoreBtn.addEventListener("click", function () {
    loadBatch();
  });

  loadTypes();
  loadBatch();
})();
