const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('charisma.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        profile TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        module_id INTEGER,
        completed BOOLEAN DEFAULT FALSE,
        score INTEGER,
        notes TEXT,
        completed_at DATETIME,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        module_id INTEGER,
        filename TEXT,
        analysis TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

// Hash password function
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Routes
app.post('/api/register', (req, res) => {
    const { name, email, password } = req.body;
    const passwordHash = hashPassword(password);
    
    db.run('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', 
        [name, email, passwordHash], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            user: { id: this.lastID, name, email },
            message: 'User created successfully' 
        });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const passwordHash = hashPassword(password);
    
    db.get('SELECT * FROM users WHERE email = ? AND password_hash = ?', 
        [email, passwordHash], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ message: 'Invalid credentials' });
        
        if (row.profile) {
            row.profile = JSON.parse(row.profile);
        }
        delete row.password_hash;
        res.json({ user: row });
    });
});
// File upload setup
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

app.post('/api/users', (req, res) => {
    const { email, profile } = req.body;
    db.run('INSERT OR REPLACE INTO users (email, profile) VALUES (?, ?)', 
        [email, JSON.stringify(profile)], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ userId: this.lastID });
    });
});

app.get('/api/users/:email', (req, res) => {
    db.get('SELECT * FROM users WHERE email = ?', [req.params.email], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            row.profile = JSON.parse(row.profile);
        }
        res.json(row);
    });
});

app.post('/api/progress', (req, res) => {
    const { userId, moduleId, completed, score, notes } = req.body;
    db.run(`INSERT OR REPLACE INTO progress 
        (user_id, module_id, completed, score, notes, completed_at) 
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, moduleId, completed, score, notes], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/progress/:userId', (req, res) => {
    db.all('SELECT * FROM progress WHERE user_id = ? ORDER BY module_id', 
        [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/recordings', upload.single('audio'), (req, res) => {
    const { userId, moduleId } = req.body;
    const filename = req.file.filename;
    
    // Simple speech analysis simulation
    const analysis = {
        duration: Math.random() * 120 + 30,
        pace: Math.random() * 200 + 100,
        confidence: Math.random() * 40 + 60,
        clarity: Math.random() * 30 + 70
    };
    
    db.run('INSERT INTO recordings (user_id, module_id, filename, analysis) VALUES (?, ?, ?, ?)',
        [userId, moduleId, filename, JSON.stringify(analysis)], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ recordingId: this.lastID, analysis });
    });
});

app.get('/api/recordings/:userId', (req, res) => {
    db.all('SELECT * FROM recordings WHERE user_id = ? ORDER BY created_at DESC', 
        [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(row => row.analysis = JSON.parse(row.analysis));
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
