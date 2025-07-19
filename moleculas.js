const input = document.getElementById("moleculas-input");
const boton = document.getElementById("generar");
const respuestaDiv = document.getElementById("respuesta");

boton.addEventListener("click", async () => {
  const smiles = input.value.trim();

  if (!smiles) {
    respuestaDiv.innerHTML = `<p style="color:red;">Por favor, ingresá un SMILES válido.</p>`;
    return;
  }

  const nuevaMolecula = {
    lipinski_ok: true,
    peso_molecular: 3213.31231,
    prediccion_bioactiva: 3,
    smiles: smiles,
    toxicidad_potencial: "Alta"
  };

  try {
    const response = await fetch("https://proyecto-25-4ecu.vercel.app/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nuevaMolecula),
    });

    const json = await response.json();
    console.log("Respuesta completa del backend:", JSON.stringify(json, null, 2));

    if (!json.ok) {
      respuestaDiv.innerHTML = `<div class="alerta error">⚠️ Error del backend: ${json.mensaje || "desconocido"}</div>`;
      return;
    }

    const molecula = json.data;

    respuestaDiv.innerHTML = `
      <div class="alerta exito">
        <h3>✅ Molécula enviada correctamente</h3>
        <p><strong>ID:</strong> ${molecula.id || "sin ID"}</p>
        <p><strong>SMILES:</strong> ${molecula.smiles || "no devuelto"}</p>
      </div>
    `;
  } catch (error) {
    console.error("Error real:", error);
    respuestaDiv.innerHTML = `<div class="alerta error">❌ Ocurrió un error al conectar con el backend.</div>`;
  }
});
