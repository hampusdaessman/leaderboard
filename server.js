const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("/data/leaderboard.db");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "hemligt123";

function checkAdmin(req, res, next) {
const password = req.headers["x-admin-password"];
if (password !== ADMIN_PASSWORD) {
return res.status(403).json({ error: "Fel lösenord" });
}
next();
}

db.run(`
CREATE TABLE IF NOT EXISTS players (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT,
score INTEGER DEFAULT 0
)
`);

app.get("/players", (req, res) => {
db.all("SELECT * FROM players ORDER BY score DESC", [], (err, rows) => {
res.json(rows);
});
});

app.post("/players", checkAdmin, (req, res) => {
const { name } = req.body;
db.run("INSERT INTO players (name) VALUES (?)", [name], function () {
res.json({ id: this.lastID });
});
});

app.post("/players/:id/score", checkAdmin, (req, res) => {
db.run(
"UPDATE players SET score = score + 1 WHERE id = ?",
[req.params.id],
() => res.json({ success: true })
);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server kör på port " + PORT));

app.post("/players/:id/minus", checkAdmin, (req, res) => {
db.run(
"UPDATE players SET score = MAX(score - 1, 0) WHERE id = ?",
[req.params.id],
() => res.json({ success: true })
);
});

app.delete("/players/:id", checkAdmin, (req, res) => {
db.run(
"DELETE FROM players WHERE id = ?",
[req.params.id],
() => res.json({ success: true })
);
});