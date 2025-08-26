// /api/mutar.js — Serverless Function en Vercel
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, mensaje: "Método no permitido" });
  }

  try {
    const { smiles } = req.body ?? {};
    if (!smiles || typeof smiles !== "string") {
      return res.status(400).json({ ok: false, mensaje: "Falta 'smiles' en el body" });
    }

    // --- mutación mock "menos tonta" ---
    const frags = ["N", "O", "Cl", "Br", "C=O", "C", "S"];
    let chars = smiles.split("");
    const op = Math.floor(Math.random() * 3);

    if (op === 0) {
      const frag = frags[Math.floor(Math.random() * frags.length)];
      const pos = Math.floor(Math.random() * (chars.length + 1));
      chars.splice(pos, 0, frag);
    } else if (op === 1 && chars.length > 0) {
      const frag = frags[Math.floor(Math.random() * frags.length)];
      const pos = Math.floor(Math.random() * chars.length);
      chars[pos] = frag;
    } else if (op === 2 && chars.length > 1) {
      const pos = Math.floor(Math.random() * chars.length);
      chars.splice(pos, 1);
    }

    const nuevo = chars.join("");

    // --- propiedades mock ---
    const peso = Number((100 + Math.random() * 400).toFixed(2));
    const pred = Number(Math.random().toFixed(3));
    const lip = Math.random() > 0.3;
    const tox = ["baja", "media", "alta"][Math.floor(Math.random() * 3)];

    return res.status(200).json({
      ok: true,
      data: {
        smiles: nuevo,
        peso_molecular: peso,
        prediccion_bioactiva: pred,
        lipinski_ok: lip,
        toxicidad_potencial: tox
      },
      mensaje: "mutación mock (serverless)"
    });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: String(e?.message || e) });
  }
}
