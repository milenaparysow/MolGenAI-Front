// let db;
// let repository =async ()=>{
//   db = await fetch("https://proyecto-25.vercel.app/all",{
//   method:"POST",
// })
// console.log(await db.json())

// }
// repository()


 // let nombresDiv = document.getElementById("nombres")
  //for (let index = 0; index < db.length; index++) {
    //    let nombre = document.createElement("h2")
      //  nombre.innerText = db[index].toxicidad_potencial
        //nombresDiv.appendChild(nombre)
  //}

  // haria una lista que tenga las moleculas que quiero, que si no son alugna de esas no me deje mandar y me ponga un alert y despues me las mande la back 
  // y recibir lo que tenga que recibir 
  const BASE_URL = "https://proyecto-25.vercel.app/all";
  const userMoleculas = document.getElementById("moleculas-input").value
  const botonGenerar = document.getElementById("generar")
   botonGenerar.addEventListener("click", GetMoleculasNuevas )

  async function GetMoleculasNuevas (moleculas) {
    const response = await fetch(`${BASE_URL}/cambiar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userMoleculas),
    });
    if (!response.ok) throw new Error("Error obteniendo las moleculas nuevas");
    console.log(response.json)
    return response.json();
  }

