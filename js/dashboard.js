const API = "";
const user = localStorage.getItem("usuario");

if (!user) {
  location.href = "Index.html";
}

const saludo = document.getElementById("saludo");
const motivacion = document.getElementById("motivacion");
const edadInput = document.getElementById("edad");
const pesoInput = document.getElementById("peso");
const alturaInput = document.getElementById("altura");
const sexoInput = document.getElementById("sexo");
const objetivoInput = document.getElementById("objetivo");
const gen = document.getElementById("gen");
const save = document.getElementById("save");
const logout = document.getElementById("logout");
const avatar = document.getElementById("avatar");
const imcText = document.getElementById("imc");
const clasificacionText = document.getElementById("clasificacion");
const caloriasDiaText = document.getElementById("caloriasDia");
const rutinaUl = document.getElementById("rutina");
const msg = document.getElementById("msg");
const toggleTema = document.getElementById("toggleTema");

const rutinasTotales = document.getElementById("rutinasTotales");
const caloriasTotales = document.getElementById("caloriasTotales");
const mejorImc = document.getElementById("mejorImc");
const rachaDias = document.getElementById("rachaDias");

const errorEdad = document.getElementById("errorEdad");
const errorPeso = document.getElementById("errorPeso");
const errorAltura = document.getElementById("errorAltura");

const calendario = document.getElementById("calendario");
const calendarioHeader = document.getElementById("calendarioHeader");
const calendarioSemana = document.getElementById("calendarioSemana");

let rutinaActual = [];
let imcActual = 0;
let caloriasActual = 0;
let chartIMC = null;
let chartRutina = null;

const temaGuardado = localStorage.getItem("tema") || "dark";
document.body.classList.remove("dark", "light");
document.body.classList.add(temaGuardado);
toggleTema.textContent = temaGuardado === "dark" ? "🌙" : "☀️";

saludo.textContent = "Hola " + user;

const frases = [
  "🔥 Tú puedes lograrlo",
  "💪 Hoy toca superarte",
  "🏃 Sigue avanzando",
  "⚡ La constancia gana",
  "🏆 Vas por buen camino"
];

motivacion.textContent = frases[Math.floor(Math.random() * frases.length)];

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

logout.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("usuario");
  location.href = "Index.html";
});

function obtenerAvatar(sexo) {
  return sexo === "mujer" ? "👩" : "👨";
}

function limpiarErrores() {
  errorEdad.textContent = "";
  errorPeso.textContent = "";
  errorAltura.textContent = "";
}

function validarCampos(edad, peso, altura) {
  let valido = true;
  limpiarErrores();

  if (!edad || edad < 10 || edad > 100) {
    errorEdad.textContent = "Edad entre 10 y 100";
    valido = false;
  }

  if (!peso || peso < 20 || peso > 300) {
    errorPeso.textContent = "Peso entre 20 y 300";
    valido = false;
  }

  if (!altura || altura < 1 || altura > 2.5) {
    errorAltura.textContent = "Altura entre 1.00 y 2.50";
    valido = false;
  }

  return valido;
}

function clasificarIMC(imc) {
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidad";
}

function generarRutina(objetivo, imc) {
  if (objetivo === "bajar") {
    return [
      "30 min caminata rápida",
      "20 jumping jacks",
      "15 sentadillas",
      "20 abdominales",
      "10 min cuerda"
    ];
  }

  if (objetivo === "subir") {
    return [
      "20 flexiones",
      "20 sentadillas con peso corporal",
      "15 fondos en silla",
      "30 segundos de plancha",
      "Rutina de fuerza de 25 minutos"
    ];
  }

  if (imc >= 25) {
    return [
      "25 min cardio moderado",
      "15 sentadillas",
      "15 desplantes",
      "20 abdominales",
      "5 min estiramiento"
    ];
  }

  return [
    "15 min caminata",
    "15 sentadillas",
    "15 abdominales",
    "10 flexiones",
    "10 min estiramiento"
  ];
}

function calcularCalorias(rutina) {
  return rutina.length * 55;
}

function pintarGraficas() {
  const ctxIMC = document.getElementById("graficaIMC");
  const ctxRutina = document.getElementById("graficaRutina");

  if (chartIMC) chartIMC.destroy();
  if (chartRutina) chartRutina.destroy();

  chartIMC = new Chart(ctxIMC, {
    type: "bar",
    data: {
      labels: ["Tu IMC", "Límite normal"],
      datasets: [{
        label: "Valor",
        data: [Number(imcActual.toFixed(2)), 24.9]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  let cardio = 0;
  let fuerza = 0;
  let movilidad = 0;

  rutinaActual.forEach((item) => {
    const t = item.toLowerCase();
    if (t.includes("caminata") || t.includes("cardio") || t.includes("jumping") || t.includes("cuerda")) {
      cardio++;
    } else if (t.includes("flexiones") || t.includes("sentadillas") || t.includes("fondos") || t.includes("abdominales") || t.includes("desplantes")) {
      fuerza++;
    } else {
      movilidad++;
    }
  });

  chartRutina = new Chart(ctxRutina, {
    type: "doughnut",
    data: {
      labels: ["Cardio", "Fuerza", "Movilidad"],
      datasets: [{
        data: [cardio, fuerza, movilidad]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function pintarCalendario(diasActivos) {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = hoy.getMonth();

  const nombreMes = hoy.toLocaleString("es-MX", { month: "long", year: "numeric" });
  calendarioHeader.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

  calendarioSemana.innerHTML = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]
    .map(d => `<div>${d}</div>`)
    .join("");

  calendario.innerHTML = "";

  const primerDia = new Date(year, month, 1).getDay();
  const diasDelMes = new Date(year, month + 1, 0).getDate();
  const hoyNumero = hoy.getDate();

  for (let i = 0; i < primerDia; i++) {
    const vacio = document.createElement("div");
    vacio.className = "dia vacio";
    calendario.appendChild(vacio);
  }

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const celda = document.createElement("div");
    celda.className = "dia";
    celda.textContent = dia;

    if (diasActivos.includes(dia)) {
      celda.classList.add("activo");
    }

    if (dia === hoyNumero) {
      celda.classList.add("hoy");
    }

    calendario.appendChild(celda);
  }
}

gen.addEventListener("click", () => {
  const edad = Number(edadInput.value);
  const peso = Number(pesoInput.value);
  const altura = Number(alturaInput.value);
  const objetivo = objetivoInput.value;
  const sexo = sexoInput.value;

  avatar.textContent = obtenerAvatar(sexo);

  if (!validarCampos(edad, peso, altura)) {
    msg.textContent = "Corrige los campos";
    msg.style.color = "red";
    return;
  }

  imcActual = peso / (altura * altura);
  rutinaActual = generarRutina(objetivo, imcActual);
  caloriasActual = calcularCalorias(rutinaActual);

  imcText.textContent = "IMC: " + imcActual.toFixed(2);
  clasificacionText.textContent = "Clasificación: " + clasificarIMC(imcActual);
  caloriasDiaText.textContent = "Calorías estimadas: " + caloriasActual;

  rutinaUl.innerHTML = rutinaActual.map((item) => `<li>${item}</li>`).join("");

  pintarGraficas();

  msg.textContent = "Rutina generada correctamente";
  msg.style.color = "#22c55e";
});

save.addEventListener("click", async () => {
  const edad = Number(edadInput.value);
  const peso = Number(pesoInput.value);
  const altura = Number(alturaInput.value);
  const sexo = sexoInput.value;
  const objetivo = objetivoInput.value;

  if (!rutinaActual.length) {
    msg.textContent = "Primero genera una rutina";
    msg.style.color = "red";
    return;
  }

  try {
    const res = await fetch("/api/rutina", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario: user,
        edad,
        peso,
        altura,
        sexo,
        objetivo,
        imc: imcActual,
        calorias: caloriasActual,
        rutina: rutinaActual
      })
    });

    const data = await res.json();

    if (!data.ok) {
      msg.textContent = data.mensaje;
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Rutina guardada correctamente";
    msg.style.color = "#22c55e";
    await cargarProgreso();
  } catch (error) {
    msg.textContent = "Error al guardar";
    msg.style.color = "red";
  }
});

async function cargarPerfil() {
  try {
    const res = await fetch("/api/perfil/" + user);
    const data = await res.json();

    if (!data.ok) return;

    edadInput.value = data.usuario.edad ?? "";
    pesoInput.value = data.usuario.peso ?? "";
    alturaInput.value = data.usuario.altura ?? "";
    sexoInput.value = data.usuario.sexo ?? "hombre";
    objetivoInput.value = data.usuario.objetivo ?? "mantener";
    avatar.textContent = obtenerAvatar(data.usuario.sexo ?? "hombre");
  } catch (error) {
    console.log("No se pudo cargar perfil");
  }
}

async function cargarProgreso() {
  try {
    const res = await fetch("/api/progreso/" + user);
    const data = await res.json();

    if (!data.ok) return;

    rutinasTotales.textContent = data.progreso.rutinas;
    caloriasTotales.textContent = data.progreso.calorias;
    mejorImc.textContent = data.progreso.mejorIMC ? data.progreso.mejorIMC.toFixed(2) : "0";
    rachaDias.textContent = data.progreso.racha;
    pintarCalendario(data.progreso.diasActivosMes || []);
  } catch (error) {
    console.log("No se pudo cargar progreso");
  }
}

cargarPerfil();
cargarProgreso();
