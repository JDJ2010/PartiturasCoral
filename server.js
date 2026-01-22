const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const db = new sqlite3.Database("database.db");

// ================= CONFIG =================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// ================= ADMIN SIMPLE =================
const ADMIN_PASSWORD = "admin123";
let adminLogged = false;

// ================= CARPETAS =================
["uploads/partituras", "uploads/audios"].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ================= BD =================
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS partituras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT,
    autor TEXT,
    archivo TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS audios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partitura_id INTEGER,
    titulo TEXT,
    archivo TEXT
  )`);
});

// ================= LOGIN SIMPLE =================
app.post("/admin-login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    adminLogged = true;
    res.redirect("/admin.html");
  } else {
    res.send("Contraseña incorrecta");
  }
});

// Middleware para proteger admin
function requireAdmin(req, res, next) {
  if (!adminLogged) return res.send("No autorizado");
  next();
}

// ================= MULTER =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "partitura") cb(null, "uploads/partituras");
    else cb(null, "uploads/audios");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// ================= SUBIR PARTITURA + AUDIOS =================
app.post("/admin/partitura-audio", requireAdmin, upload.fields([
  { name: "partitura", maxCount: 1 },
  { name: "audios", maxCount: 10 }
]), (req, res) => {
  const { titulo, autor } = req.body;
  const partituraArchivo = req.files["partitura"][0].filename;

  db.run(
    "INSERT INTO partituras (titulo, autor, archivo) VALUES (?,?,?)",
    [titulo, autor, partituraArchivo],
    function () {
      const partituraId = this.lastID;

      if (req.files["audios"]) {
        req.files["audios"].forEach(audio => {
          db.run(
            "INSERT INTO audios (partitura_id, titulo, archivo) VALUES (?,?,?)",
            [partituraId, audio.originalname, audio.filename]
          );
        });
      }

      res.redirect("/admin.html");
    }
  );
});

// ================= LISTAR PARTITURAS PÚBLICAS =================
app.get("/api/partituras", (req, res) => {
  db.all("SELECT * FROM partituras", (err, partituras) => {
    db.all("SELECT * FROM audios", (err, audios) => {
      res.json({ partituras, audios });
    });
  });
});

// ================= BORRAR PARTITURAS =================
app.get("/admin/delete-partitura/:id", requireAdmin, (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM partituras WHERE id = ?", [id], (err, partitura) => {
    if (!partitura) return res.redirect("/admin.html");

    fs.unlinkSync(path.join("uploads/partituras", partitura.archivo));

    db.all("SELECT * FROM audios WHERE partitura_id = ?", [id], (err, audios) => {
      audios.forEach(a => {
        fs.unlinkSync(path.join("uploads/audios", a.archivo));
      });

      db.run("DELETE FROM audios WHERE partitura_id = ?", [id]);
      db.run("DELETE FROM partituras WHERE id = ?", [id]);

      res.redirect("/admin.html");
    });
  });
});

// ================= SERVIDOR =================
app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
  console.log("Contraseña admin:", ADMIN_PASSWORD);
});
