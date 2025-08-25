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
    const resp = await fetch("http://localhost:3000/mutar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ smiles })
    });

    const json = await resp.json();
    if (!json.ok) {
      respuestaDiv.innerHTML = `<div class="alerta error">⚠️ Error del backend: ${json.mensaje || "desconocido"}</div>`;
      return;
    }

    const nuevo = json.data?.smiles || "(sin dato)";
    respuestaDiv.innerHTML = `
      <div class="alerta exito">
        <h3>✅ Molécula generada</h3>
        <p><strong>SMILES original:</strong> ${smiles}</p>
        <p><strong>SMILES nuevo:</strong> ${nuevo}</p>
      </div>
    `;
  } catch (e) {
    console.error(e);
    respuestaDiv.innerHTML = `<div class="alerta error">❌ Ocurrió un error al conectar con el backend.</div>`;
  }
});
