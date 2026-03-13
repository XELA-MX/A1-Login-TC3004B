/**
 * battle.js — Pokémon Battle Game using PokéAPI v2
 *
 * Features:
 *  - Search & select 2 Pokémon from the API
 *  - Turn-based battle with step-by-step log
 *  - Normal attack, special attack (unlocks after 3 turns), special defense (unlocks after 2 turns)
 *  - Random miss chance on attacks and defenses
 *  - Winner screen with Pokémon image
 */

(function () {
  "use strict";

  var API = "https://pokeapi.co/api/v2";

  var TYPE_COLORS = {
    normal: "#a8a878", fire: "#f08030", water: "#6890f0", electric: "#f8d030",
    grass: "#78c850", ice: "#98d8d8", fighting: "#c03028", poison: "#a040a0",
    ground: "#e0c068", flying: "#a890f0", psychic: "#f85888", bug: "#a8b820",
    rock: "#b8a038", ghost: "#705898", dragon: "#7038f8", dark: "#705848",
    steel: "#b8b8d0", fairy: "#ee99ac",
  };

  // ── State ──────────────────────────────────────

  var pokemon1 = null; // selected pokemon data
  var pokemon2 = null;
  var fighter1 = null; // battle state objects
  var fighter2 = null;
  var currentTurn = 0;
  var battleOver = false;
  var autoInterval = null;

  // ── DOM refs ───────────────────────────────────

  var selectionScreen = document.getElementById("btl-selection");
  var arenaScreen = document.getElementById("btl-arena");
  var winnerScreen = document.getElementById("btl-winner");

  var search1 = document.getElementById("btl-search1");
  var search2 = document.getElementById("btl-search2");
  var results1 = document.getElementById("btl-results1");
  var results2 = document.getElementById("btl-results2");
  var selected1 = document.getElementById("btl-selected1");
  var selected2 = document.getElementById("btl-selected2");
  var startBtn = document.getElementById("btl-start-btn");

  var fighterEl1 = document.getElementById("btl-fighter1");
  var fighterEl2 = document.getElementById("btl-fighter2");
  var logEl = document.getElementById("btl-log");
  var nextBtn = document.getElementById("btl-next-btn");
  var autoBtn = document.getElementById("btl-auto-btn");

  var winnerCard = document.getElementById("btl-winner-card");
  var restartBtn = document.getElementById("btl-restart-btn");

  // ── Helpers ────────────────────────────────────

  function fetchJSON(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getSprite(poke) {
    return poke.sprites.other["official-artwork"].front_default ||
      poke.sprites.front_default || "";
  }

  function typeBadgesHtml(poke) {
    return poke.types.map(function (t) {
      var bg = TYPE_COLORS[t.type.name] || "#888";
      return '<span class="pkdx-type" style="background:' + bg + '">' + t.type.name + '</span>';
    }).join(" ");
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ── Search Pokémon ─────────────────────────────

  var allPokemonList = []; // {name, url}

  function loadPokemonList() {
    return fetchJSON(API + "/pokemon?limit=1025&offset=0").then(function (data) {
      allPokemonList = data.results;
    });
  }

  function searchPokemon(query) {
    query = query.toLowerCase().trim();
    if (!query) return [];
    var isNum = /^\d+$/.test(query);
    return allPokemonList.filter(function (p, idx) {
      if (isNum) return String(idx + 1).indexOf(query) === 0;
      return p.name.indexOf(query) !== -1;
    }).slice(0, 8);
  }

  function renderSearchResults(matches, containerEl, slot) {
    if (matches.length === 0) {
      containerEl.innerHTML = "";
      return;
    }
    containerEl.innerHTML = matches.map(function (m, i) {
      var id = allPokemonList.indexOf(m) + 1;
      return '<div class="btl-result-item" data-name="' + m.name + '">' +
        '<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + id + '.png" alt="' + m.name + '" />' +
        '<span>#' + String(id).padStart(3, "0") + ' ' + capitalize(m.name) + '</span>' +
        '</div>';
    }).join("");

    containerEl.querySelectorAll(".btl-result-item").forEach(function (el) {
      el.addEventListener("click", function () {
        var name = el.getAttribute("data-name");
        selectPokemon(name, slot);
        containerEl.innerHTML = "";
      });
    });
  }

  function selectPokemon(name, slot) {
    var targetInput = slot === 1 ? search1 : search2;
    var targetCard = slot === 1 ? selected1 : selected2;
    targetInput.value = "";
    targetCard.innerHTML = '<div class="btl-mini-loading"><div class="pkdx-spinner"></div></div>';

    fetchJSON(API + "/pokemon/" + name).then(function (poke) {
      if (slot === 1) pokemon1 = poke;
      else pokemon2 = poke;
      renderSelectedCard(poke, targetCard);
      checkStartButton();
    }).catch(function () {
      targetCard.innerHTML = '<p style="color:#ff6b6b;font-size:0.85rem">Error al cargar.</p>';
    });
  }

  function renderSelectedCard(poke, container) {
    var img = getSprite(poke);
    var primaryType = poke.types[0].type.name;
    var bg = TYPE_COLORS[primaryType] || "#888";

    container.innerHTML =
      '<div class="btl-sel-card" style="border-color:' + bg + '44">' +
        '<img src="' + img + '" alt="' + poke.name + '" />' +
        '<div class="btl-sel-info">' +
          '<span class="pkdx-card-num">#' + String(poke.id).padStart(3, "0") + '</span>' +
          '<h4>' + capitalize(poke.name) + '</h4>' +
          '<div class="pkdx-card-types">' + typeBadgesHtml(poke) + '</div>' +
          '<div class="btl-sel-stats">' +
            '<span>ATK: ' + poke.stats[1].base_stat + '</span>' +
            '<span>DEF: ' + poke.stats[2].base_stat + '</span>' +
            '<span>SP.ATK: ' + poke.stats[3].base_stat + '</span>' +
            '<span>SP.DEF: ' + poke.stats[4].base_stat + '</span>' +
            '<span>SPD: ' + poke.stats[5].base_stat + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function checkStartButton() {
    startBtn.disabled = !(pokemon1 && pokemon2);
  }

  // Search input handlers
  var searchTimer1 = null;
  var searchTimer2 = null;

  search1.addEventListener("input", function () {
    clearTimeout(searchTimer1);
    searchTimer1 = setTimeout(function () {
      var matches = searchPokemon(search1.value);
      renderSearchResults(matches, results1, 1);
    }, 250);
  });

  search2.addEventListener("input", function () {
    clearTimeout(searchTimer2);
    searchTimer2 = setTimeout(function () {
      var matches = searchPokemon(search2.value);
      renderSearchResults(matches, results2, 2);
    }, 250);
  });

  // Close results on click outside
  document.addEventListener("click", function (e) {
    if (!results1.contains(e.target) && e.target !== search1) results1.innerHTML = "";
    if (!results2.contains(e.target) && e.target !== search2) results2.innerHTML = "";
  });

  // ── Battle System ──────────────────────────────

  function buildFighter(poke) {
    var moves = poke.moves.slice(0, 20); // take first 20 available moves
    var normalMoves = [];
    var specialMoves = [];

    // categorize by learning method or just split
    moves.forEach(function (m) {
      normalMoves.push(capitalize(m.move.name.replace(/-/g, " ")));
    });

    // Pick 4 normal moves and 2 special moves
    // Shuffle and pick
    normalMoves = shuffleArray(normalMoves);
    var picked = normalMoves.slice(0, 4);
    var specials = normalMoves.slice(4, 6);
    if (specials.length === 0) specials = [picked[0]];
    if (picked.length === 0) picked = ["Tackle"];

    return {
      name: capitalize(poke.name),
      img: getSprite(poke),
      types: poke.types.map(function (t) { return t.type.name; }),
      maxHp: 100,
      hp: 100,
      attack: poke.stats[1].base_stat,
      defense: poke.stats[2].base_stat,
      spAttack: poke.stats[3].base_stat,
      spDefense: poke.stats[4].base_stat,
      speed: poke.stats[5].base_stat,
      moves: picked,
      specialMoves: specials,
      turnsPlayed: 0,
      defending: false,
      spDefending: false,
    };
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = a[i];
      a[i] = a[j];
      a[j] = temp;
    }
    return a;
  }

  function calcDamage(attacker, defender, isSpecial) {
    var atk = isSpecial ? attacker.spAttack : attacker.attack;
    var def;
    if (defender.spDefending && isSpecial) {
      def = defender.spDefense * 1.8;
    } else if (defender.defending) {
      def = defender.defense * 1.5;
    } else {
      def = isSpecial ? defender.spDefense : defender.defense;
    }

    // Damage formula (simplified)
    var baseDmg = ((atk * 0.4) / (def * 0.25 + 1)) * (rand(85, 115) / 100);
    baseDmg = Math.max(Math.round(baseDmg), 1);

    // Special attacks do 1.5x
    if (isSpecial) baseDmg = Math.round(baseDmg * 1.5);

    return Math.min(baseDmg, 35); // cap damage at 35 per hit for balance
  }

  function chooseMoveAI(fighter) {
    // AI decision
    var canSpecialAtk = fighter.turnsPlayed >= 3;
    var canSpecialDef = fighter.turnsPlayed >= 2;

    // Random choice weighted
    var roll = Math.random();

    if (canSpecialAtk && roll < 0.3) {
      return { type: "special_attack" };
    }
    if (canSpecialDef && roll < 0.15) {
      return { type: "special_defense" };
    }
    if (roll < 0.12) {
      return { type: "defend" };
    }
    return { type: "attack" };
  }

  function executeTurn() {
    if (battleOver) return;
    currentTurn++;

    // Determine who goes first by speed
    var first, second, firstEl, secondEl;
    if (fighter1.speed >= fighter2.speed) {
      first = fighter1; second = fighter2;
      firstEl = "p1"; secondEl = "p2";
    } else {
      first = fighter2; second = fighter1;
      firstEl = "p2"; secondEl = "p1";
    }

    addLogEntry("turn", "── Turno " + currentTurn + " ──");

    // Reset defense flags
    first.defending = false;
    first.spDefending = false;
    second.defending = false;
    second.spDefending = false;

    // First attacks
    first.turnsPlayed++;
    var move1 = chooseMoveAI(first);
    executeMoveAction(first, second, move1, firstEl, secondEl);

    // Check if second is dead
    if (second.hp <= 0) {
      second.hp = 0;
      updateFighterDisplay();
      endBattle(first);
      return;
    }

    // Second attacks
    second.turnsPlayed++;
    var move2 = chooseMoveAI(second);
    executeMoveAction(second, first, move2, secondEl, firstEl);

    // Check if first is dead
    if (first.hp <= 0) {
      first.hp = 0;
      updateFighterDisplay();
      endBattle(second);
      return;
    }

    updateFighterDisplay();
  }

  function executeMoveAction(attacker, defender, action, atkId, defId) {
    var MISS_CHANCE = 0.15; // 15% chance to miss

    if (action.type === "attack") {
      var moveName = attacker.moves[rand(0, attacker.moves.length - 1)];
      // Check miss
      if (Math.random() < MISS_CHANCE) {
        addLogEntry(atkId, attacker.name + " usó <strong>" + moveName + "</strong> pero <em>falló</em>!");
        return;
      }
      var dmg = calcDamage(attacker, defender, false);
      defender.hp = Math.max(defender.hp - dmg, 0);
      addLogEntry(atkId, attacker.name + " usó <strong>" + moveName + "</strong> e hizo <strong>" + dmg + "</strong> de daño. " + defender.name + " tiene <strong>" + defender.hp + "%</strong> HP.");

    } else if (action.type === "special_attack") {
      var spMove = attacker.specialMoves[rand(0, attacker.specialMoves.length - 1)];
      // Check miss (slightly higher for special)
      if (Math.random() < MISS_CHANCE + 0.05) {
        addLogEntry(atkId, attacker.name + " intentó el ataque especial <strong>" + spMove + "</strong> pero <em>falló</em>!");
        return;
      }
      var spDmg = calcDamage(attacker, defender, true);
      defender.hp = Math.max(defender.hp - spDmg, 0);
      addLogEntry(atkId, "⚡ " + attacker.name + " usó el ataque especial <strong>" + spMove + "</strong> e hizo <strong>" + spDmg + "</strong> de daño! " + defender.name + " tiene <strong>" + defender.hp + "%</strong> HP.");

    } else if (action.type === "defend") {
      if (Math.random() < 0.1) {
        addLogEntry(atkId, attacker.name + " intentó defenderse pero <em>falló la postura</em>!");
        return;
      }
      attacker.defending = true;
      addLogEntry(atkId, "🛡️ " + attacker.name + " se puso en posición de <strong>defensa</strong>! Daño reducido este turno.");

    } else if (action.type === "special_defense") {
      if (Math.random() < 0.12) {
        addLogEntry(atkId, attacker.name + " intentó la defensa especial pero <em>falló</em>!");
        return;
      }
      attacker.spDefending = true;
      addLogEntry(atkId, "🛡️⚡ " + attacker.name + " activó <strong>defensa especial</strong>! Gran reducción de daño especial.");
    }
  }

  function addLogEntry(type, text) {
    var div = document.createElement("div");
    div.className = "btl-log-entry btl-log-" + type;
    div.innerHTML = text;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function updateFighterDisplay() {
    renderFighter(fighter1, fighterEl1, "1");
    renderFighter(fighter2, fighterEl2, "2");
  }

  function renderFighter(f, el, num) {
    var pct = Math.max(f.hp, 0);
    var barColor = pct > 50 ? "#51cf66" : pct > 20 ? "#f8d030" : "#ff6b6b";
    var primaryType = f.types[0];
    var bg = TYPE_COLORS[primaryType] || "#888";

    el.innerHTML =
      '<div class="btl-fighter-card">' +
        '<div class="btl-fighter-img" style="background:' + bg + '18">' +
          '<img src="' + f.img + '" alt="' + f.name + '" />' +
        '</div>' +
        '<div class="btl-fighter-info">' +
          '<h4>' + f.name + '</h4>' +
          '<div class="btl-hp-bar-wrap">' +
            '<div class="btl-hp-bar">' +
              '<div class="btl-hp-fill" style="width:' + pct + '%;background:' + barColor + '"></div>' +
            '</div>' +
            '<span class="btl-hp-text">' + pct + '% HP</span>' +
          '</div>' +
          '<div class="btl-fighter-badges">' +
            '<span class="btl-badge">Turno: ' + f.turnsPlayed + '</span>' +
            (f.turnsPlayed >= 3 ? '<span class="btl-badge btl-badge-sp">⚡ Esp. ATK</span>' : '<span class="btl-badge btl-badge-locked">⚡ ATK en ' + (3 - f.turnsPlayed) + 't</span>') +
            (f.turnsPlayed >= 2 ? '<span class="btl-badge btl-badge-sp">🛡️ Esp. DEF</span>' : '<span class="btl-badge btl-badge-locked">🛡️ DEF en ' + (2 - f.turnsPlayed) + 't</span>') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function endBattle(winner) {
    battleOver = true;
    clearInterval(autoInterval);
    autoInterval = null;

    addLogEntry("winner", "🏆 <strong>" + winner.name + "</strong> ha ganado la batalla!");

    nextBtn.disabled = true;
    autoBtn.disabled = true;

    // Show winner screen after 1.5s
    setTimeout(function () {
      arenaScreen.style.display = "none";
      winnerScreen.style.display = "block";

      var primaryType = winner.types[0];
      var bg = TYPE_COLORS[primaryType] || "#888";

      winnerCard.innerHTML =
        '<div class="btl-winner-img" style="background:' + bg + '22">' +
          '<img src="' + winner.img + '" alt="' + winner.name + '" />' +
        '</div>' +
        '<h2>' + winner.name + '</h2>' +
        '<p>HP restante: ' + winner.hp + '%</p>';
    }, 1500);
  }

  // ── Start Battle ───────────────────────────────

  startBtn.addEventListener("click", function () {
    if (!pokemon1 || !pokemon2) return;

    fighter1 = buildFighter(pokemon1);
    fighter2 = buildFighter(pokemon2);
    currentTurn = 0;
    battleOver = false;
    logEl.innerHTML = "";

    nextBtn.disabled = false;
    autoBtn.disabled = false;

    selectionScreen.style.display = "none";
    arenaScreen.style.display = "block";

    updateFighterDisplay();
    addLogEntry("turn", "🔔 ¡La batalla entre <strong>" + fighter1.name + "</strong> y <strong>" + fighter2.name + "</strong> va a comenzar!");
  });

  // Next turn button
  nextBtn.addEventListener("click", function () {
    executeTurn();
  });

  // Auto battle
  autoBtn.addEventListener("click", function () {
    if (autoInterval) {
      clearInterval(autoInterval);
      autoInterval = null;
      autoBtn.textContent = "Auto Batalla";
      autoBtn.classList.remove("btl-auto-active");
      return;
    }
    autoBtn.textContent = "Detener Auto";
    autoBtn.classList.add("btl-auto-active");
    autoInterval = setInterval(function () {
      if (battleOver) {
        clearInterval(autoInterval);
        autoInterval = null;
        return;
      }
      executeTurn();
    }, 1200);
  });

  // Restart
  restartBtn.addEventListener("click", function () {
    pokemon1 = null;
    pokemon2 = null;
    fighter1 = null;
    fighter2 = null;
    currentTurn = 0;
    battleOver = false;
    clearInterval(autoInterval);
    autoInterval = null;

    selected1.innerHTML = "";
    selected2.innerHTML = "";
    search1.value = "";
    search2.value = "";
    results1.innerHTML = "";
    results2.innerHTML = "";
    logEl.innerHTML = "";
    startBtn.disabled = true;
    nextBtn.disabled = false;
    autoBtn.disabled = false;
    autoBtn.textContent = "Auto Batalla";
    autoBtn.classList.remove("btl-auto-active");

    winnerScreen.style.display = "none";
    arenaScreen.style.display = "none";
    selectionScreen.style.display = "block";
  });

  // ── Init ───────────────────────────────────────

  loadPokemonList().catch(function (err) {
    console.error("[Battle] Error loading pokemon list:", err);
  });

})();
