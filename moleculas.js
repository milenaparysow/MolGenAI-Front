const input = document.getElementById("moleculas-input");
const boton = document.getElementById("generar");
const respuestaDiv = document.getElementById("respuesta");

boton.addEventListener("click", async () => {
  const smiles = input.value.trim();
  if (!smiles) {
    respuestaDiv.innerHTML = `<p style="color:red;">Por favor, ingresá un SMILES válido.</p>`;
    return;
  }

  try {
    // 👇 Ahora apunta a tu función serverless en Vercel
    const resp = await fetch("/api/mutar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smiles })
    });

    const json = await resp.json();
    if (!json.ok) {
      respuestaDiv.innerHTML = `<div class="alerta error">⚠️ Error del backend: ${json.mensaje || "desconocido"}</div>`;
      return;
    }

    const data = json.data || {};
    const nuevo = data.smiles || "(sin dato)";
    const peso = data.peso_molecular ?? "(?)";
    const bio = data.prediccion_bioactiva ?? "(?)";
    const lip = data.lipinski_ok ? "sí" : "no";
    const tox = data.toxicidad_potencial ?? "(?)";

    respuestaDiv.innerHTML = `
      <div class="alerta exito">
        <h3>✅ Molécula generada</h3>
        <p><strong>SMILES original:</strong> ${smiles}</p>
        <p><strong>SMILES nuevo:</strong> ${nuevo}</p>
        <p><strong>Peso molecular:</strong> ${peso}</p>
        <p><strong>Predicción bioactiva:</strong> ${bio}</p>
        <p><strong>Lipinski OK:</strong> ${lip}</p>
        <p><strong>Toxicidad potencial:</strong> ${tox}</p>
      </div>
    `;
  } catch (e) {
    console.error(e);
    respuestaDiv.innerHTML = `<div class="alerta error">❌ Ocurrió un error al conectar con el backend.</div>`;
  }
});
