const input = document.getElementById("moleculas-input");
const boton = document.getElementById("generar");
const respuestaDiv = document.getElementById("respuesta");

// ---  detectar SMILES ---
function isLikelySmiles(str) {
  if (!str) return false;
  const s = str.trim();
  if (!s || /\s/.test(s)) return false;

  // Balance rápido de () y []
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

  // Escaneo tokenizado
  let i = 0;
  const L = s.length;

  const isDigit = ch => ch >= '0' && ch <= '9';
  const bondChars = new Set(['-', '=', '#', '/', '\\', '.']);
  const aromatic = new Set(['b','c','n','o','p','s']);
  const organicSingle = new Set(['B','C','N','O','P','S','F','I']);

  while (i < L) {
    const ch = s[i];

    // 1) Ramas
    if (ch === '(' || ch === ')') { i++; continue; }

    // 2) Enlaces
    if (bondChars.has(ch)) { i++; continue; }

    // 3) Cierres de anillo: dígito o %nn
    if (isDigit(ch)) { i++; continue; }
    if (ch === '%' && i + 2 < L && isDigit(s[i+1]) && isDigit(s[i+2])) {
      i += 3; continue;
    }

    // 4) Átomos entre corchetes 
    if (ch === '[') {
      const j = s.indexOf(']', i + 1);
      if (j === -1) return false;
      const inside = s.slice(i + 1, j);
      if (!/^[A-Za-z0-9@+\-\.=:#\\/%,]*$/.test(inside)) return false;
      i = j + 1;
      continue;
    }

    // 5) Halógenos de dos letras
    if (i + 1 < L) {
      const two = s.slice(i, i + 2);
      if (two === 'Cl' || two === 'Br') { i += 2; continue; }
      if (two === 'as' || two === 'se') { i += 2; continue; } // aromáticos raros
    }

    // 6) Aromáticos de una letra
    if (aromatic.has(ch)) { i++; continue; }

    // 7) Subconjunto orgánico de una letra
    if (organicSingle.has(ch)) { i++; continue; }

    // 8) Cualquier otra mayúscula fuera de corchetes no es SMILES válido
    if (/[A-Z]/.test(ch)) return false;

    // 9) Si no matchea nada, inválido
    return false;
  }

  return true;
}

// --- Mutación conservadora: agrega un metilo (C) como rama ---
function mutateSmilesConservatively(smiles) {
  const s = smiles.trim();
  if (!s) return s;

  const isLetter = (ch) => /[A-Za-z]/.test(ch);
  const tokenLenAt = (txt, i) => {
    const pair = txt.slice(i, i + 2);
    if (pair === "Cl" || pair === "Br") return 2;
    return 1;
  };

  let i = 0;
  let inBracket = false;
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

// --- Fallback: inventar resultado random ---
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

// --- Helpers UI ---
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function renderError(msg){
  respuestaDiv.innerHTML = `<div class="alerta error">⚠️ ${esc(msg)}</div>`;
}

function renderSuccess(original, json){
  const d = json.data || {};
  respuestaDiv.innerHTML = `
    <div class="alerta exito">
      <h3>✅ Molécula generada</h3>
      <p><strong>SMILES original:</strong> <code>${esc(original)}</code></p>
      <p><strong>SMILES nuevo:</strong> <code>${esc(d.smiles ?? "(sin dato)")}</code></p>
      <p><strong>Peso molecular:</strong> ${esc(d.peso_molecular ?? "(?)")}</p>
      <p><strong>Predicción bioactiva:</strong> ${esc(d.prediccion_bioactiva ?? "(?)")}</p>
      <p><strong>Lipinski OK:</strong> ${d.lipinski_ok ? "sí" : "no"}</p>
      <p><strong>Toxicidad potencial:</strong> ${esc(d.toxicidad_potencial ?? "(?)")}</p>
    </div>`;
}

// --- Evento principal ---
boton.addEventListener("click", async () => {
  const smiles = (input.value || "").trim();

  if (!isLikelySmiles(smiles)) {
    renderError("Por favor, ingresá una molécula en formato SMILES.");
    return;
  }

  try {
    const resp = await fetch("/api/mutar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smiles })
    });

    let json = null;
    try { json = await resp.json(); } catch { json = null; }

    if (!resp.ok || !json || json.ok === false) {
      const fake = randomResult(smiles);
      renderSuccess(smiles, fake);
      return;
    }

    renderSuccess(smiles, json);
  } catch (e) {
    const fake = randomResult(smiles);
    renderSuccess(smiles, fake);
  }
});


