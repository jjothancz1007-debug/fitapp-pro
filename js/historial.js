const API = "http://127.0.0.1:3000";
const user = localStorage.getItem("usuario");

if (!user) {
  location.href = "Index.html";
}

const historial = document.getElementById("historial");
const resumenBox = document.getElementById("resumenBox");
const filtroTexto = document.getElementById("filtroTexto");
const btnPdf = document.getElementById("btnPdf");
const logout = document.getElementById("logout");
const toggleTema = document.getElementById("toggleTema");

let historialGlobal = [];

const temaGuardado = localStorage.getItem("tema") || "dark";
document.body.classList.remove("dark", "light");
document.body.classList.add(temaGuardado);
toggleTema.textContent = temaGuardado === "dark" ? "🌙" : "☀️";

toggleTema.addEventListener("click", () => {
  const dark = document.body.classList.contains("dark");
  if (dark) {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
    toggleTema.textContent = "☀️";
    localStorage.setItem("tema", "light");
  } else {
    document.body.classList.remove("light");
    document.body.classList.add("dark");
    toggleTema.textContent = "🌙";
    localStorage.setItem("tema", "dark");
  }
});

if (logout) {
  logout.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("usuario");
    location.href = "Index.html";
  });
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString();
}

function claseObjetivo(objetivo) {
  const valor = String(objetivo).toLowerCase();
  if (valor === "subir") return "subir";
  if (valor === "bajar") return "bajar";
  return "mantener";
}

function claseTag(objetivo) {
  const valor = String(objetivo).toLowerCase();
  if (valor === "subir") return "tag-subir";
  if (valor === "bajar") return "tag-bajar";
  return "tag-mantener";
}

function obtenerColorObjetivo(objetivo) {
  const valor = String(objetivo).toLowerCase();
  if (valor === "subir") return [124, 58, 237];
  if (valor === "bajar") return [37, 99, 235];
  return [22, 163, 74];
}

async function eliminarRutina(id) {
  const confirmar = confirm("¿Seguro que quieres eliminar esta rutina?");
  if (!confirmar) return;

  try {
    const idLimpio = String(id).trim();
    console.log("Eliminando ID por POST:", idLimpio);

    const res = await fetch(`${API}/api/rutina/eliminar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: idLimpio })
    });

    const data = await res.json();
    console.log("Respuesta eliminar:", data);

    if (!data.ok) {
      alert(data.mensaje || "No se pudo eliminar la rutina");
      return;
    }

    historialGlobal = historialGlobal.filter(item => String(item._id) !== idLimpio);
    aplicarFiltro();
    alert("Rutina eliminada correctamente");
  } catch (error) {
    console.error("Error eliminando rutina:", error);
    alert("Error al eliminar la rutina");
  }
}

function pintarResumen(lista) {
  if (!lista.length) {
    resumenBox.innerHTML = `<p>No hay datos</p>`;
    return;
  }

  const total = lista.length;
  const calorias = lista.reduce((acc, item) => acc + (item.calorias || 0), 0);
  const mejor = Math.min(...lista.map((item) => item.imc));
  const ultimo = lista[0];
  const promedio = (
    lista.reduce((acc, item) => acc + Number(item.imc), 0) / lista.length
  ).toFixed(2);

  resumenBox.innerHTML = `
    <p><strong>Rutinas guardadas:</strong> ${total}</p>
    <p><strong>Calorías acumuladas:</strong> ${calorias}</p>
    <p><strong>Mejor IMC:</strong> ${Number(mejor).toFixed(2)}</p>
    <p><strong>Promedio IMC:</strong> ${promedio}</p>
    <p><strong>Último objetivo:</strong> ${ultimo.objetivo}</p>
  `;
}

function render(lista) {
  if (!lista.length) {
    historial.innerHTML = `<p class="vacio">No hay resultados.</p>`;
    resumenBox.innerHTML = `<p class="vacio">Sin resumen.</p>`;
    return;
  }

  historial.innerHTML = "";

  lista.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = `item ${claseObjetivo(r.objetivo)}`;

    div.innerHTML = `
      <div class="item-top">
        <div>
          <h3>Rutina ${lista.length - i}</h3>
          <span class="tag-objetivo ${claseTag(r.objetivo)}">${String(r.objetivo).toUpperCase()}</span>
        </div>
      </div>

      <div class="meta">
        <p><strong>Fecha:</strong> ${formatearFecha(r.fecha)}</p>
        <p><strong>Edad:</strong> ${r.edad}</p>
        <p><strong>Peso:</strong> ${r.peso} kg</p>
        <p><strong>Altura:</strong> ${r.altura} m</p>
        <p><strong>IMC:</strong> ${Number(r.imc).toFixed(2)}</p>
        <p><strong>Calorías:</strong> ${r.calorias || 0}</p>
      </div>

      <p class="ejercicios-title">Ejercicios:</p>
      <ul>
        ${r.rutina.map((item) => `<li>${item}</li>`).join("")}
      </ul>

      <button class="btn-eliminar">Eliminar</button>
    `;

    const botonEliminar = div.querySelector(".btn-eliminar");
    botonEliminar.addEventListener("click", () => {
      eliminarRutina(r._id);
    });

    historial.appendChild(div);
  });

  pintarResumen(lista);
}

function aplicarFiltro() {
  const texto = filtroTexto.value.trim().toLowerCase();

  if (!texto) {
    render(historialGlobal);
    return;
  }

  const filtrado = historialGlobal.filter((item) => {
    return (
      String(item.objetivo).toLowerCase().includes(texto) ||
      String(item.edad).includes(texto) ||
      String(item.sexo || "").toLowerCase().includes(texto)
    );
  });

  render(filtrado);
}

if (filtroTexto) {
  filtroTexto.addEventListener("input", aplicarFiltro);
}

if (btnPdf) {
  btnPdf.addEventListener("click", () => {
    if (!historialGlobal.length) {
      alert("No hay rutinas para exportar");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const fechaActual = new Date().toLocaleString();
    const totalRutinas = historialGlobal.length;
    const totalCalorias = historialGlobal.reduce((acc, item) => acc + (item.calorias || 0), 0);
    const mejorIMC = Math.min(...historialGlobal.map((item) => item.imc)).toFixed(2);

    let y = 20;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 34, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("FitApp Pro", 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Reporte premium de historial fitness", 14, 24);

    y = 45;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Datos generales", 14, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Nombre del usuario: ${user}`, 14, y);
    y += 6;
    doc.text(`Fecha de exportación: ${fechaActual}`, 14, y);
    y += 6;
    doc.text(`Rutinas guardadas: ${totalRutinas}`, 14, y);
    y += 6;
    doc.text(`Calorías acumuladas: ${totalCalorias}`, 14, y);
    y += 6;
    doc.text(`Mejor IMC: ${mejorIMC}`, 14, y);

    y += 12;

    historialGlobal.forEach((item, index) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      const color = obtenerColorObjetivo(item.objetivo);

      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(12, y, 186, 48, 4, 4, "FD");

      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(12, y, 5, 48, "F");

      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`Rutina ${index + 1} - ${String(item.objetivo).toUpperCase()}`, 22, y + 8);

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      doc.text(`Fecha: ${formatearFecha(item.fecha)}`, 22, y + 15);
      doc.text(`Edad: ${item.edad}`, 22, y + 21);
      doc.text(`Peso: ${item.peso} kg`, 55, y + 21);
      doc.text(`Altura: ${item.altura} m`, 90, y + 21);
      doc.text(`IMC: ${Number(item.imc).toFixed(2)}`, 128, y + 21);
      doc.text(`Calorías: ${item.calorias || 0}`, 160, y + 21);

      const ejercicios = doc.splitTextToSize(`Ejercicios: ${item.rutina.join(" | ")}`, 165);
      doc.text(ejercicios, 22, y + 30);

      y += 56;
    });

    doc.save(`historial_${user}.pdf`);
  });
}

async function cargarHistorial() {
  try {
    const res = await fetch(`${API}/api/historial/${user}`);
    const data = await res.json();

    console.log("Historial cargado:", data);

    if (!data.ok) {
      historial.innerHTML = `<p class="vacio">${data.mensaje || "No se pudo cargar el historial"}</p>`;
      return;
    }

    historialGlobal = (data.historial || []).map(item => ({
      ...item,
      _id: String(item._id)
    }));

    aplicarFiltro();
  } catch (error) {
    console.error("Error cargando historial:", error);
    historial.innerHTML = `<p class="vacio">Error al cargar historial</p>`;
  }
}

cargarHistorial();