const API = "";
const user = localStorage.getItem("usuario");

if (!user) {
  location.href = "Index.html";
}

const usuarioInput = document.getElementById("usuario");
const edadInput = document.getElementById("edad");
const pesoInput = document.getElementById("peso");
const alturaInput = document.getElementById("altura");
const sexoInput = document.getElementById("sexo");
const objetivoInput = document.getElementById("objetivo");
const avatarUsuario = document.getElementById("avatarUsuario");
const btnGuardarPerfil = document.getElementById("btnGuardarPerfil");
const mensaje = document.getElementById("mensaje");
const logout = document.getElementById("logout");
const toggleTema = document.getElementById("toggleTema");

const passwordActual = document.getElementById("passwordActual");
const passwordNueva = document.getElementById("passwordNueva");
const verActual = document.getElementById("verActual");
const verNueva = document.getElementById("verNueva");
const btnVerificarPassword = document.getElementById("btnVerificarPassword");
const btnCambiarPassword = document.getElementById("btnCambiarPassword");
const btnEliminarCuenta = document.getElementById("btnEliminarCuenta");
const mensajePassword = document.getElementById("mensajePassword");
const mensajeCambio = document.getElementById("mensajeCambio");
const mensajeEliminar = document.getElementById("mensajeEliminar");

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

logout.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("usuario");
  location.href = "Index.html";
});

function obtenerAvatar(sexo) {
  return sexo === "mujer" ? "👩" : "👨";
}

function togglePassword(input) {
  input.type = input.type === "password" ? "text" : "password";
}

verActual.addEventListener("click", () => togglePassword(passwordActual));
verNueva.addEventListener("click", () => togglePassword(passwordNueva));

sexoInput.addEventListener("change", () => {
  avatarUsuario.textContent = obtenerAvatar(sexoInput.value);
});

async function cargarPerfil() {
  try {
    const res = await fetch("/api/perfil/" + user);
    const data = await res.json();

    if (!data.ok) {
      mensaje.textContent = data.mensaje;
      mensaje.style.color = "red";
      return;
    }

    usuarioInput.value = data.usuario.usuario;
    edadInput.value = data.usuario.edad ?? "";
    pesoInput.value = data.usuario.peso ?? "";
    alturaInput.value = data.usuario.altura ?? "";
    sexoInput.value = data.usuario.sexo ?? "hombre";
    objetivoInput.value = data.usuario.objetivo ?? "mantener";
    avatarUsuario.textContent = obtenerAvatar(data.usuario.sexo ?? "hombre");
  } catch (error) {
    mensaje.textContent = "Error al cargar perfil";
    mensaje.style.color = "red";
  }
}

btnGuardarPerfil.addEventListener("click", async () => {
  const edad = Number(edadInput.value);
  const peso = Number(pesoInput.value);
  const altura = Number(alturaInput.value);
  const sexo = sexoInput.value;
  const objetivo = objetivoInput.value;

  if (!edad || edad < 10 || edad > 100) {
    mensaje.textContent = "Edad inválida";
    mensaje.style.color = "red";
    return;
  }

  if (!peso || peso < 20 || peso > 300) {
    mensaje.textContent = "Peso inválido";
    mensaje.style.color = "red";
    return;
  }

  if (!altura || altura < 1 || altura > 2.5) {
    mensaje.textContent = "Altura inválida";
    mensaje.style.color = "red";
    return;
  }

  try {
    const res = await fetch("/api/perfil/" + user, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edad, peso, altura, sexo, objetivo })
    });

    const data = await res.json();

    if (!data.ok) {
      mensaje.textContent = data.mensaje;
      mensaje.style.color = "red";
      return;
    }

    avatarUsuario.textContent = obtenerAvatar(sexo);
    mensaje.textContent = data.mensaje;
    mensaje.style.color = "#22c55e";
  } catch (error) {
    mensaje.textContent = "Error al guardar cambios";
    mensaje.style.color = "red";
  }
});

btnVerificarPassword.addEventListener("click", async () => {
  const password = passwordActual.value.trim();

  if (!password) {
    mensajePassword.textContent = "Escribe tu contraseña actual";
    mensajePassword.style.color = "red";
    return;
  }

  try {
    const res = await fetch("/api/verificar-password/" + user, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await res.json();
    mensajePassword.textContent = data.mensaje;
    mensajePassword.style.color = data.ok ? "#22c55e" : "red";
  } catch (error) {
    mensajePassword.textContent = "Error al verificar contraseña";
    mensajePassword.style.color = "red";
  }
});

btnCambiarPassword.addEventListener("click", async () => {
  const actual = passwordActual.value.trim();
  const nueva = passwordNueva.value.trim();

  if (!actual || !nueva) {
    mensajeCambio.textContent = "Completa ambos campos";
    mensajeCambio.style.color = "red";
    return;
  }

  if (nueva.length < 4) {
    mensajeCambio.textContent = "La nueva contraseña debe tener mínimo 4 caracteres";
    mensajeCambio.style.color = "red";
    return;
  }

  try {
    const res = await fetch("/api/password/" + user, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual, nueva })
    });

    const data = await res.json();
    mensajeCambio.textContent = data.mensaje;
    mensajeCambio.style.color = data.ok ? "#22c55e" : "red";

    if (data.ok) {
      passwordActual.value = "";
      passwordNueva.value = "";
    }
  } catch (error) {
    mensajeCambio.textContent = "Error al cambiar contraseña";
    mensajeCambio.style.color = "red";
  }
});

btnEliminarCuenta.addEventListener("click", async () => {
  const password = passwordActual.value.trim();

  if (!password) {
    mensajeEliminar.textContent = "Escribe tu contraseña actual para eliminar la cuenta";
    mensajeEliminar.style.color = "red";
    return;
  }

  const confirmar = confirm("¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.");
  if (!confirmar) return;

  try {
    const res = await fetch("/api/usuario/eliminar/" + user, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await res.json();
    mensajeEliminar.textContent = data.mensaje;
    mensajeEliminar.style.color = data.ok ? "#22c55e" : "red";

    if (data.ok) {
      localStorage.removeItem("usuario");
      setTimeout(() => {
        location.href = "Index.html";
      }, 1200);
    }
  } catch (error) {
    mensajeEliminar.textContent = "Error al eliminar cuenta";
    mensajeEliminar.style.color = "red";
  }
});

cargarPerfil();
