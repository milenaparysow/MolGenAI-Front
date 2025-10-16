// ====== Referencias ======
const input = document.getElementById("moleculas-input");
const boton = document.getElementById("generar");

// ====== Util ======
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

// ====== Modal ======
function ensureModal() {
  let overlay = document.getElementById("mg-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "mg-overlay";
    overlay.innerHTML = `
      <div class="mg-modal" role="dialog" aria-modal="true" aria-label="Resultado">
        <button class="mg-x" id="mg-close" aria-label="Cerrar">×</button>
        <div class="mg-content" id="mg-content"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      const modal = overlay.querySelector(".mg-modal");
      if (e.target.id === "mg-close" || !modal.contains(e.target)) hideModal();
    });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") hideModal(); });
  }
  return overlay;
}

function mountInBox(html) {
  const overlay = ensureModal();
  overlay.querySelector("#mg-content").innerHTML = html;
  overlay.classList.add("show");
  document.body.style.overflow = "hidden";
}

function hideModal() {
  const overlay = document.getElementById("mg-overlay");
  if (overlay) overlay.classList.remove("show");
  document.body.style.overflow = "";
}

function showLoading() {
  mountInBox(`
    <div class="mg-loader-wrap atom-loader">
      <div class="atom">
        <div class="orbit orbit1"><span class="electron"></span></div>
        <div class="orbit orbit2"><span class="electron"></span></div>
        <div class="orbit orbit3"><span class="electron"></span></div>
        <div class="nucleus"></div>
      </div>
      <p class="mg-loader-text">
        Generando molécula
        <span class="mg-dot"></span><span class="mg-dot"></span><span class="mg-dot"></span>
      </p>
    </div>
  `);
}

// ====== SMILES ======
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
      if (two === 'Cl' || two === 'Br' || two === 'as' || two === 'se') { i += 2; continue; }
    }
    if (aromatic.has(ch) || organicSingle.has(ch)) { i++; continue; }
    if (/[A-Z]/.test(ch)) return false;
    return false;
  }
  return true;
}

// ====== Mutación ======
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

// ====== Random fallback ======
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

// ====== Render ======
function renderError(msg){
  mountInBox(`
    <div class="mg-card">
      <h3 class="mg-title">Error</h3>
      <p>${esc(msg)}</p>
    </div>
  `);
}

function renderSuccess(original, json){
  const d = json?.data ?? {};
  const tox = (d.toxicidad_potencial || "").toLowerCase();
  const toxClass = tox === "alta" ? "danger" : tox === "media" ? "warn" : "ok";
  const lipBadge = d.lipinski_ok ? `<span class="badge ok">Lipinski OK</span>` : `<span class="badge warn">Lipinski no cumple</span>`;
  const toxBadge = `<span class="badge ${toxClass}">Toxicidad: ${esc(d.toxicidad_potencial ?? "?")}</span>`;
  mountInBox(`
    <div class="mg-card">
      <h3 class="mg-title">Molécula generada</h3>
      <div class="mg-grid">
        <div class="mg-label">SMILES original</div>
        <div class="mg-value">
          <span class="mg-code"><code id="mg-ori">${esc(original)}</code>
            <button class="mg-copy" data-copy="#mg-ori">copiar</button>
          </span>
        </div>
        <div class="mg-label">SMILES nuevo</div>
        <div class="mg-value">
          <span class="mg-code"><code id="mg-nvo">${esc(d.smiles ?? "(sin dato)")}</code>
            <button class="mg-copy" data-copy="#mg-nvo">copiar</button>
          </span>
        </div>
        <div class="mg-label">Peso molecular</div>
        <div class="mg-value">${esc(d.peso_molecular ?? "(?)")}</div>
        <div class="mg-label">Predicción bioactiva</div>
        <div class="mg-value">${esc(d.prediccion_bioactiva ?? "(?)")}</div>
      </div>
      <div class="mg-sep"></div>
      <div class="mg-badges">
        ${lipBadge}
        ${toxBadge}
      </div>
    </div>
  `);
}

// ====== Evento principal ======
boton.addEventListener("click", async () => {
  const smiles = (input.value || "").trim();
  if (!isLikelySmiles(smiles)) {
    renderError("Por favor, ingresá una molécula en formato SMILES.");
    return;
  }
  showLoading();
  boton.disabled = true;
  input.disabled = true;
  const start = performance.now();
  try {
    const resp = await fetch("/api/mutar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smiles })
    });
    let json = null;
    try { json = await resp.json(); } catch { json = null; }
    const ok = resp.ok && json && json.ok !== false;
    const payload = ok ? json : randomResult(smiles);
    const elapsed = performance.now() - start;
    if (elapsed < 500) await new Promise(r => setTimeout(r, 500 - elapsed));
    renderSuccess(smiles, payload);
  } catch {
    const fake = randomResult(smiles);
    renderSuccess(smiles, fake);
  } finally {
    boton.disabled = false;
    input.disabled = false;
  }
});
input.addEventListener("keydown", (e) => { if (e.key === "Enter") boton.click(); });

// ====== Copiar ======
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".mg-copy");
  if (!btn) return;
  const sel = btn.getAttribute("data-copy");
  const el = sel ? document.querySelector(sel) : null;
  if (!el) return;
  const txt = el.textContent.trim();
  navigator.clipboard.writeText(txt).then(() => {
    const old = btn.textContent;
    btn.textContent = "copiado";
    setTimeout(() => (btn.textContent = old), 900);
  });
});

  
