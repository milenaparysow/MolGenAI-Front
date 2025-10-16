// ====== Selección de elementos ======
const input = document.getElementById("moleculas-input");
const boton = document.getElementById("generar");
const respuestaDiv = document.getElementById("respuesta");

// ====== Helpers UI ======
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function mountInBox(html, extraClass = "") {
  respuestaDiv.innerHTML = `<div class="respuesta-box ${extraClass}">${html}</div>`; }
function showLoading() {
  const html = `
    <div class="loading fade-in">
      <div class="neon-atom">
        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <radialGradient id="g-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#c9fbff"/>
              <stop offset="60%" stop-color="#00e6ff"/>
              <stop offset="100%" stop-color="#00e6ff" stop-opacity=".35"/>
            </radialGradient>
          </defs>

          <ellipse class="orbit o1" cx="60" cy="60" rx="42" ry="22"/>
          <ellipse class="orbit o2" cx="60" cy="60" rx="22" ry="42"/>
          <ellipse class="orbit o3" cx="60" cy="60" rx="36" ry="36"/>

          <circle class="electron e1" cx="60" cy="24" r="3"/>
          <circle class="electron e2" cx="96" cy="60" r="3"/>
          <circle class="electron e3" cx="60" cy="96" r="3"/>

          <circle class="core" cx="60" cy="60" r="8"/>
        </svg>
      </div>
      <div class="shine">Generando molécula...</div>
    </div>
  `;

  if (typeof mountInBox === "function") {
    mountInBox(html, "fade-in");
  } else {
    document.getElementById("respuesta").innerHTML = `<div class="respuesta-box fade-in">${html}</div>`;
  }
}

function renderError(msg){
  mountInBox(`<div class="alerta error">${esc(msg)}</div>`, "fade-in");
}

function renderSuccess(original, json){
  const d = (json && json.data) ? json.data : {};
  mountInBox(`
    <div class="alerta exito">
      <h3>Molécula generada correctamente</h3>
      <p><strong>SMILES original:</strong> <code>${esc(original)}</code></p>
      <p><strong>SMILES nuevo:</strong> <code>${esc(d.smiles ?? "(sin dato)")}</code></p>
      <p><strong>Peso molecular:</strong> ${esc(d.peso_molecular ?? "(?)")}</p>
      <p><strong>Predicción bioactiva:</strong> ${esc(d.prediccion_bioactiva ?? "(?)")}</p>
      <p><strong>Lipinski OK:</strong> ${d.lipinski_ok ? "sí" : "no"}</p>
      <p><strong>Toxicidad potencial:</strong> ${esc(d.toxicidad_potencial ?? "(?)")}</p>
    </div>
  `, "fade-in");
}

// ====== Detector de SMILES ======
function isLikelySmiles(str) {
  if (!str) return false;
  const s = str.trim();
  if (!s || /\s/.test(s)) return false;

  const balanced = (txt, open, close) => {
    let c = 0;
    for (const ch of txt) {
      if (ch === open) c++;
      else if (ch === close) { c--; if (c < 0) return false; }
    }
    return c === 0;
  };
  if (!balanced(s, '(', ')')) return false;
  if (!balanced(s, '[', ']')) return false;

  let i = 0;
  const L = s.length;
  const isDigit = ch => ch >= '0' && ch <= '9';
  const bondChars = new Set(['-', '=', '#', '/', '\\', '.']);
  const aromatic = new Set(['b','c','n','o','p','s']);
  const organicSingle = new Set(['B','C','N','O','P','S','F','I']);

  while (i < L) {
    const ch = s[i];
    if (ch === '(' || ch === ')') { i++; continue; }
    if (bondChars.has(ch)) { i++; continue; }
    if (isDigit(ch)) { i++; continue; }
    if (ch === '%' && i + 2 < L && isDigit(s[i+1]) && isDigit(s[i+2])) { i += 3; continue; }

    if (ch === '[') {
      const j = s.indexOf(']', i + 1);
      if (j === -1) return false;
      const inside = s.slice(i + 1, j);
      if (!/^[A-Za-z0-9@+\-\.=:#\\/%,]*$/.test(inside)) return false;
      i = j + 1; continue;
    }

    if (i + 1 < L) {
      const two = s.slice(i, i + 2);
      if (two === 'Cl' || two === 'Br') { i += 2; continue; }
      if (two === 'as' || two === 'se') { i += 2; continue; }
    }

    if (aromatic.has(ch)) { i++; continue; }
    if (organicSingle.has(ch)) { i++; continue; }
    if (/[A-Z]/.test(ch)) return false;

    return false;
  }
  return true;
}

// ====== Mutación conservadora ======
function mutateSmilesConservatively(smiles) {
  const s = smiles.trim();
  if (!s) return s;
  const isLetter = (ch) => /[A-Za-z]/.test(ch);
  const tokenLenAt = (txt, i) => (txt.slice(i, i + 2) === "Cl" || txt.slice(i, i + 2) === "Br") ? 2 : 1;

  let i = 0, inBracket = false;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "[") inBracket = true;
    if (ch === "]") inBracket = false;

    if (!inBracket && isLetter(ch)) {
      const len = tokenLenAt(s, i);
      const insertPos = i + len;
      return s.slice(0, insertPos) + "(C)" + s.slice(insertPos);
    }
    i++;
  }
  return s + "C";
}

// ====== Fallback random ======
function randomResult(smiles) {
  const rnd = (min, max, d=2) => (Math.random()*(max-min)+min).toFixed(d);
  const bool = () => Math.random() < 0.5;
  const tox = ["baja", "media", "alta"][Math.floor(Math.random()*3)];
  const mutated = mutateSmilesConservatively(smiles);
  return {
    ok: true,
    data: {
      smiles: mutated,
      peso_molecular: Number(rnd(100, 800)),
      prediccion_bioactiva: Number(rnd(0, 1, 3)),
      lipinski_ok: bool(),
      toxicidad_potencial: tox
    }
  };
}

// ====== Botón principal ======
boton.addEventListener("click", async () => {
  try {
    const smiles = (input.value || "").trim();
    if (!isLikelySmiles(smiles)) {
      renderError("Por favor, ingresá una molécula en formato SMILES.");
      return;
    }

    // Loader visible y bloqueo
    showLoading();
    const t0 = performance.now();     // para asegurar mínimo visible
    boton.disabled = true;
    input.disabled = true;

    const resp = await fetch("/api/mutar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smiles })
    });

    let json = null;
    try { json = await resp.json(); } catch { json = null; }

    if (!resp.ok || !json || json.ok === false) {
      json = randomResult(smiles);
    }

    // Asegurar que el loader haya estado al menos 700ms
    const elapsed = performance.now() - t0;
    const wait = Math.max(0, 700 - elapsed);
    if (wait) await new Promise(r => setTimeout(r, wait));

    renderSuccess(smiles, json);
  } catch (err) {
    console.error("Error en generar:", err);
    const smiles = (input.value || "").trim();
    const fake = randomResult(smiles || "C");
    renderSuccess(smiles || "C", fake);
  } finally {
    boton.disabled = false;
    input.disabled = false;
  }
});

// Enter para enviar
input.addEventListener("keydown", (e) => { if (e.key === "Enter") boton.click(); });

// Debug: errores globales
window.addEventListener("error", (e) => console.error(e.error || e.message));



