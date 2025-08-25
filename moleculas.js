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
    // Ahora pedimos al backend que hable con la IA y guarde la molécula
    const response = await fetch("http://localhost:3000/suggest-raw?save=true", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ smiles }), // mandamos solo el smiles
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
        <h3>✅ Molécula generada correctamente</h3>
        <p><strong>SMILES:</strong> ${molecula.smiles}</p>
        <p><strong>Peso molecular:</strong> ${molecula.peso_molecular}</p>
        <p><strong>Predicción bioactiva:</strong> ${molecula.prediccion_bioactiva}</p>
        <p><strong>Lipinski OK:</strong> ${molecula.lipinski_ok}</p>
        <p><strong>Toxicidad potencial:</strong> ${molecula.toxicidad_potencial}</p>
      </div>
    `;
  } catch (error) {
    console.error("Error real:", error);
    respuestaDiv.innerHTML = `<div class="alerta error">❌ Ocurrió un error al conectar con el backend.</div>`;
  }
});
