const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado 🔥"))
  .catch(err => console.log("Error MongoDB:", err));

const usuarioSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, trim: true },
  edad: { type: Number, default: null },
  peso: { type: Number, default: null },
  altura: { type: Number, default: null },
  sexo: { type: String, default: "hombre" },
  objetivo: { type: String, default: "mantener" },
  creado: { type: Date, default: Date.now }
}, { versionKey: false });

const rutinaSchema = new mongoose.Schema({
  usuario: { type: String, required: true, trim: true },
  edad: { type: Number, required: true },
  peso: { type: Number, required: true },
  altura: { type: Number, required: true },
  sexo: { type: String, required: true },
  objetivo: { type: String, required: true },
  imc: { type: Number, required: true },
  calorias: { type: Number, default: 0 },
  rutina: { type: [String], required: true },
  fecha: { type: Date, default: Date.now }
}, { versionKey: false });

const Usuario = mongoose.model("Usuario", usuarioSchema);
const Rutina = mongoose.model("Rutina", rutinaSchema);

/* =========================
   FUNCIONES
========================= */

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function validarPerfil({ edad, peso, altura }) {
  const edadNum = Number(edad);
  const pesoNum = Number(peso);
  const alturaNum = Number(altura);

  if (!edadNum || edadNum < 10 || edadNum > 100) return "Edad inválida";
  if (!pesoNum || pesoNum < 20 || pesoNum > 300) return "Peso inválido";
  if (!alturaNum || alturaNum < 1 || alturaNum > 2.5) return "Altura inválida";

  return null;
}

function calcularRachaPorDias(historial) {
  if (!historial.length) return 0;

  const diasUnicos = [...new Set(
    historial.map(item => {
      const d = new Date(item.fecha);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    })
  )].sort((a, b) => a - b);

  let rachaActual = 1;
  let mejorRacha = 1;

  for (let i = 1; i < diasUnicos.length; i++) {
    const diff = (diasUnicos[i] - diasUnicos[i - 1]) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      rachaActual++;
      if (rachaActual > mejorRacha) mejorRacha = rachaActual;
    } else {
      rachaActual = 1;
    }
  }

  return mejorRacha;
}

/* =========================
   RUTAS GENERALES
========================= */

app.get("/api/prueba", (req, res) => {
  res.json({ ok: true, mensaje: "Servidor funcionando correctamente" });
});

/* =========================
   REGISTRO
========================= */

app.post("/api/registro", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ ok: false, mensaje: "Completa todos los campos" });
    }

    const usuarioLimpio = usuario.trim().toLowerCase();
    const passwordLimpio = password.trim();

    if (usuarioLimpio.length < 4) {
      return res.status(400).json({ ok: false, mensaje: "El usuario debe tener al menos 4 caracteres" });
    }

    if (passwordLimpio.length < 4) {
      return res.status(400).json({ ok: false, mensaje: "La contraseña debe tener al menos 4 caracteres" });
    }

    const existe = await Usuario.findOne({ usuario: usuarioLimpio });

    if (existe) {
      return res.status(409).json({ ok: false, mensaje: "Ese usuario ya existe, escribe otro" });
    }

    await Usuario.create({
      usuario: usuarioLimpio,
      password: hashPassword(passwordLimpio)
    });

    res.json({ ok: true, mensaje: "Usuario registrado correctamente" });
  } catch (error) {
    console.log("Error en registro:", error);
    res.status(500).json({ ok: false, mensaje: "Error al registrar usuario" });
  }
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ ok: false, mensaje: "Completa todos los campos" });
    }

    const usuarioLimpio = usuario.trim().toLowerCase();
    const passwordLimpio = password.trim();
    const passwordHash = hashPassword(passwordLimpio);

    const user = await Usuario.findOne({ usuario: usuarioLimpio });

    if (!user) {
      return res.status(401).json({ ok: false, mensaje: "Usuario o contraseña incorrectos" });
    }

    const coincide =
      user.password === passwordLimpio ||
      user.password === passwordHash;

    if (!coincide) {
      return res.status(401).json({ ok: false, mensaje: "Usuario o contraseña incorrectos" });
    }

    if (user.password === passwordLimpio) {
      user.password = passwordHash;
      await user.save();
    }

    res.json({
      ok: true,
      mensaje: "Inicio de sesión correcto",
      usuario: {
        usuario: user.usuario,
        edad: user.edad,
        peso: user.peso,
        altura: user.altura,
        sexo: user.sexo,
        objetivo: user.objetivo
      }
    });
  } catch (error) {
    console.log("Error en login:", error);
    res.status(500).json({ ok: false, mensaje: "Error al iniciar sesión" });
  }
});

/* =========================
   PERFIL
========================= */

app.get("/api/perfil/:usuario", async (req, res) => {
  try {
    const user = await Usuario.findOne({
      usuario: req.params.usuario.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    res.json({
      ok: true,
      usuario: {
        usuario: user.usuario,
        edad: user.edad,
        peso: user.peso,
        altura: user.altura,
        sexo: user.sexo,
        objetivo: user.objetivo
      }
    });
  } catch (error) {
    console.log("Error perfil:", error);
    res.status(500).json({ ok: false, mensaje: "Error al obtener perfil" });
  }
});

app.put("/api/perfil/:usuario", async (req, res) => {
  try {
    const errorValidacion = validarPerfil(req.body);

    if (errorValidacion) {
      return res.status(400).json({ ok: false, mensaje: errorValidacion });
    }

    const { edad, peso, altura, sexo, objetivo } = req.body;

    const actualizado = await Usuario.findOneAndUpdate(
      { usuario: req.params.usuario.toLowerCase() },
      {
        edad: Number(edad),
        peso: Number(peso),
        altura: Number(altura),
        sexo,
        objetivo
      },
      { new: true }
    );

    if (!actualizado) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    res.json({ ok: true, mensaje: "Perfil actualizado correctamente" });
  } catch (error) {
    console.log("Error actualizar perfil:", error);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar perfil" });
  }
});

/* =========================
   VERIFICAR CONTRASEÑA
========================= */

app.post("/api/verificar-password/:usuario", async (req, res) => {
  try {
    const usuario = String(req.params.usuario).toLowerCase().trim();
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ ok: false, mensaje: "Escribe la contraseña" });
    }

    const user = await Usuario.findOne({ usuario });

    if (!user) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    const passwordHash = hashPassword(password.trim());
    const coincide =
      user.password === password.trim() ||
      user.password === passwordHash;

    if (!coincide) {
      return res.status(401).json({ ok: false, mensaje: "Contraseña incorrecta" });
    }

    res.json({ ok: true, mensaje: "Contraseña correcta" });
  } catch (error) {
    console.log("Error verificar contraseña:", error);
    res.status(500).json({ ok: false, mensaje: "Error al verificar contraseña" });
  }
});

/* =========================
   CAMBIAR CONTRASEÑA
========================= */

app.put("/api/password/:usuario", async (req, res) => {
  try {
    const usuario = String(req.params.usuario).toLowerCase().trim();
    const { actual, nueva } = req.body;

    if (!actual || !nueva) {
      return res.status(400).json({ ok: false, mensaje: "Completa todos los campos" });
    }

    if (nueva.trim().length < 4) {
      return res.status(400).json({ ok: false, mensaje: "La nueva contraseña debe tener al menos 4 caracteres" });
    }

    const user = await Usuario.findOne({ usuario });

    if (!user) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    const actualHash = hashPassword(actual.trim());
    const coincide =
      user.password === actual.trim() ||
      user.password === actualHash;

    if (!coincide) {
      return res.status(401).json({ ok: false, mensaje: "La contraseña actual es incorrecta" });
    }

    user.password = hashPassword(nueva.trim());
    await user.save();

    res.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.log("Error cambiar contraseña:", error);
    res.status(500).json({ ok: false, mensaje: "Error al cambiar contraseña" });
  }
});

/* =========================
   ELIMINAR CUENTA
========================= */

app.post("/api/usuario/eliminar/:usuario", async (req, res) => {
  try {
    const usuario = String(req.params.usuario).toLowerCase().trim();
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ ok: false, mensaje: "Debes escribir tu contraseña" });
    }

    const user = await Usuario.findOne({ usuario });

    if (!user) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    const passwordHash = hashPassword(password.trim());
    const coincide =
      user.password === password.trim() ||
      user.password === passwordHash;

    if (!coincide) {
      return res.status(401).json({ ok: false, mensaje: "Contraseña incorrecta" });
    }

    await Rutina.deleteMany({ usuario });
    await Usuario.deleteOne({ usuario });

    res.json({ ok: true, mensaje: "Cuenta eliminada correctamente" });
  } catch (error) {
    console.log("Error eliminar cuenta:", error);
    res.status(500).json({ ok: false, mensaje: "Error al eliminar cuenta" });
  }
});

/* =========================
   GUARDAR RUTINA
========================= */

app.post("/api/rutina", async (req, res) => {
  try {
    const { usuario, edad, peso, altura, sexo, objetivo, imc, calorias, rutina } = req.body;

    if (
      !usuario ||
      !edad ||
      !peso ||
      !altura ||
      !sexo ||
      !objetivo ||
      !imc ||
      !Array.isArray(rutina) ||
      rutina.length === 0
    ) {
      return res.status(400).json({ ok: false, mensaje: "Faltan datos para guardar la rutina" });
    }

    const errorValidacion = validarPerfil({ edad, peso, altura });

    if (errorValidacion) {
      return res.status(400).json({ ok: false, mensaje: errorValidacion });
    }

    const nuevaRutina = await Rutina.create({
      usuario: usuario.toLowerCase(),
      edad: Number(edad),
      peso: Number(peso),
      altura: Number(altura),
      sexo,
      objetivo,
      imc: Number(imc),
      calorias: Number(calorias) || 0,
      rutina
    });

    await Usuario.findOneAndUpdate(
      { usuario: usuario.toLowerCase() },
      {
        edad: Number(edad),
        peso: Number(peso),
        altura: Number(altura),
        sexo,
        objetivo
      }
    );

    res.json({
      ok: true,
      mensaje: "Rutina guardada correctamente",
      id: String(nuevaRutina._id)
    });
  } catch (error) {
    console.log("Error guardar rutina:", error);
    res.status(500).json({ ok: false, mensaje: "Error al guardar rutina" });
  }
});

/* =========================
   HISTORIAL
========================= */

app.get("/api/historial/:usuario", async (req, res) => {
  try {
    const historial = await Rutina.find({
      usuario: req.params.usuario.toLowerCase()
    }).sort({ fecha: -1 });

    const historialPlano = historial.map(item => ({
      _id: String(item._id),
      usuario: item.usuario,
      edad: item.edad,
      peso: item.peso,
      altura: item.altura,
      sexo: item.sexo,
      objetivo: item.objetivo,
      imc: item.imc,
      calorias: item.calorias,
      rutina: item.rutina,
      fecha: item.fecha
    }));

    res.json({ ok: true, historial: historialPlano });
  } catch (error) {
    console.log("Error historial:", error);
    res.status(500).json({ ok: false, mensaje: "Error al obtener historial" });
  }
});

/* =========================
   ELIMINAR RUTINA
========================= */

app.delete("/api/rutina/:id", async (req, res) => {
  try {
    const id = String(req.params.id).trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID inválido" });
    }

    const eliminada = await Rutina.findOneAndDelete({ _id: id });

    if (!eliminada) {
      return res.status(404).json({ ok: false, mensaje: "Rutina no encontrada" });
    }

    res.json({ ok: true, mensaje: "Rutina eliminada correctamente" });
  } catch (error) {
    console.log("Error eliminar rutina:", error);
    res.status(500).json({ ok: false, mensaje: "Error al eliminar rutina" });
  }
});

app.post("/api/rutina/eliminar", async (req, res) => {
  try {
    const id = String(req.body.id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, mensaje: "ID inválido" });
    }

    const eliminada = await Rutina.findOneAndDelete({ _id: id });

    if (!eliminada) {
      return res.status(404).json({ ok: false, mensaje: "Rutina no encontrada" });
    }

    res.json({ ok: true, mensaje: "Rutina eliminada correctamente" });
  } catch (error) {
    console.log("Error eliminar rutina por POST:", error);
    res.status(500).json({ ok: false, mensaje: "Error al eliminar rutina" });
  }
});

/* =========================
   PROGRESO
========================= */

app.get("/api/progreso/:usuario", async (req, res) => {
  try {
    const usuario = req.params.usuario.toLowerCase();
    const data = await Rutina.find({ usuario });

    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    const diasActivosMes = [...new Set(
      data
        .filter(item => {
          const f = new Date(item.fecha);
          return f.getMonth() === mesActual && f.getFullYear() === anioActual;
        })
        .map(item => new Date(item.fecha).getDate())
    )].sort((a, b) => a - b);

    if (data.length === 0) {
      return res.json({
        ok: true,
        progreso: {
          rutinas: 0,
          calorias: 0,
          mejorIMC: 0,
          racha: 0,
          diasActivosMes
        }
      });
    }

    const calorias = data.reduce((acc, item) => acc + (item.calorias || 0), 0);
    const mejorIMC = Math.min(...data.map((item) => item.imc));
    const racha = calcularRachaPorDias(data);

    res.json({
      ok: true,
      progreso: {
        rutinas: data.length,
        calorias,
        mejorIMC,
        racha,
        diasActivosMes
      }
    });
  } catch (error) {
    console.log("Error progreso:", error);
    res.status(500).json({ ok: false, mensaje: "Error al obtener progreso" });
  }
});

/* =========================
   SERVIR FRONTEND
========================= */

app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "Index.html"));
});

/* =========================
   SERVIDOR
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});