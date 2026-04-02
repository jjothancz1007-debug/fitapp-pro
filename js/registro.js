const API = "";

const usuarioInput = document.getElementById("usuario");
const passwordInput = document.getElementById("password");
const btnRegistro = document.getElementById("btnRegistro");
const msg = document.getElementById("msg");
const ver = document.getElementById("ver");
const loader = document.getElementById("loader");
const toggleTema = document.getElementById("toggleTema");

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

ver.addEventListener("click", () => {
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

btnRegistro.addEventListener("click", async () => {
  const usuario = usuarioInput.value.trim();
  const password = passwordInput.value.trim();

  if (!usuario || !password) {
    msg.textContent = "Completa todos los campos";
    msg.style.color = "red";
    return;
  }

  if (usuario.length < 4) {
    msg.textContent = "El usuario debe tener al menos 4 caracteres";
    msg.style.color = "red";
    return;
  }

  if (password.length < 4) {
    msg.textContent = "La contraseña debe tener al menos 4 caracteres";
    msg.style.color = "red";
    return;
  }

  loader.style.display = "block";
  msg.textContent = "";

  try {
    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();
    loader.style.display = "none";

    msg.textContent = data.mensaje;
    msg.style.color = data.ok ? "#22c55e" : "red";

    if (data.ok) {
      setTimeout(() => {
        location.href = "Index.html";
      }, 1200);
    }
  } catch (error) {
    loader.style.display = "none";
    msg.textContent = "No se pudo conectar con el servidor";
    msg.style.color = "red";
  }
});