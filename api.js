//src/data/api.js

const BASE_URL = "https://proyecto-25.vercel.app/all";

export async function GetMoleculasNuevas (moleculas) {
  const response = await fetch(`${BASE_URL}/cambiar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userMoleculas),
  });
  if (!response.ok) throw new Error("Error obteniendo las moleculas nuevas");
  console.log(response.json)
  return response.json();
}


function hola(nombre) {
    console.log("hola" + nombre)
}

hola(brigitte)