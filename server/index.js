const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

const express = require('express');
const cors = require('cors');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

console.log('Backend attempting to connect to database:', process.env.DB_NAME);
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - [${req.method}] ${req.url}`);
    next();
});

app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// --- AUTH & USER ROUTES ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt: ${username}`);
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length > 0) {
            // NOTE: In production, use bcrypt to compare password_hash
            // Checking plain password for simplicity as per existing code
            if (users[0].password_hash === password) {
                res.json({ success: true, user: { id: users[0].id, username: users[0].username } });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    console.log('Fetching all users');
    try {
        const [users] = await db.query('SELECT id, username, password_hash as password, created_at FROM users');
        // Map to match frontend UserData interface
        const mappedUsers = users.map(u => ({
            id: u.id,
            username: u.username,
            password: u.password,
            fullName: u.username === 'admin' ? 'Administrator' : u.username, // Simple mapping
            role: u.username === 'admin' ? 'admin' : 'user',
            createdAt: u.created_at
        }));
        res.json(mappedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { username, password, fullName, role } = req.body;
    console.log(`Adding new user: ${username}, role: ${role}`);
    const id = uuidv4();
    try {
        await db.query('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)', [id, username, password]);
        res.status(201).json({ id, username, fullName, role, createdAt: new Date().toISOString() });
    } catch (error) {
        console.error('SERVER ERROR ADDING USER:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Deleting user: ${id}`);
    try {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- SECTION ROUTES ---
app.get('/api/sections', async (req, res) => {
    console.log('Fetching all sections');
    try {
        const [sections] = await db.query('SELECT * FROM sections');
        res.json(sections);
    } catch (error) {
        console.error('Error fetching sections:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sections', async (req, res) => {
    const { label, user_id } = req.body;
    console.log(`Adding new section: ${label}`);
    const id = uuidv4();
    try {
        await db.query('INSERT INTO sections (id, label, user_id) VALUES (?, ?, ?)', [id, label, user_id]);
        res.status(201).json({ id, label, user_id });
    } catch (error) {
        console.error('Error adding section:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/sections/:id', async (req, res) => {
    const { id } = req.params;
    const { label } = req.body;
    console.log(`Updating section ${id} to: ${label}`);
    try {
        await db.query('UPDATE sections SET label = ? WHERE id = ?', [label, id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/sections/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Deleting section: ${id}`);
    try {
        await db.query('DELETE FROM sections WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting section:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- MENU ROUTES ---
app.get('/api/menus', async (req, res) => {
    console.log('Fetching all menus');
    try {
        const [menus] = await db.query('SELECT id, label, type, icon_name, section_id, user_id FROM menus');
        res.json(menus);
    } catch (error) {
        console.error('Error fetching menus:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/menus', async (req, res) => {
    const { label, type, icon_name, section_id, user_id } = req.body;
    console.log(`Adding new menu: ${label} (type: ${type})`);
    const id = uuidv4();
    try {
        await db.query('INSERT INTO menus (id, label, type, icon_name, section_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [id, label, type, icon_name, section_id, user_id]);
        res.status(201).json({ id, label, type, icon_name, section_id, user_id });
    } catch (error) {
        console.error('Error adding menu:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/menus/:id', async (req, res) => {
    const { id } = req.params;
    const { label, type, icon_name, section_id } = req.body;
    console.log(`Updating menu ${id} to: ${label} (type: ${type})`);
    try {
        await db.query('UPDATE menus SET label=?, type=?, icon_name=?, section_id=? WHERE id=?',
            [label, type, icon_name, section_id, id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating menu:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/menus/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Deleting menu: ${id}`);
    try {
        await db.query('DELETE FROM menus WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting menu:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- TRANSACTION ROUTES ---
app.get('/api/transactions/:menuId', async (req, res) => {
    const { menuId } = req.params;
    console.log(`Fetching transactions for menu: ${menuId}`);
    try {
        const [transactions] = await db.query('SELECT * FROM transactions WHERE menu_id = ? ORDER BY date DESC', [menuId]);
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/transactions', async (req, res) => {
    console.log('Incoming transaction request body:', JSON.stringify(req.body, null, 2));
    const { menu_id, user_id, date, description, type, amount, category, proof_image } = req.body;
    console.log(`DEBUG: Adding transaction. menu_id=[${menu_id}], user_id=[${user_id}]`);
    const id = uuidv4();
    try {
        await db.query('INSERT INTO transactions (id, menu_id, user_id, date, description, type, amount, category, proof_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, menu_id, user_id, date, description, type, amount, category, proof_image]);
        res.status(201).json({ id, menu_id, user_id, date, description, type, amount, category, proof_image });
    } catch (error) {
        console.error('Error adding transaction! Full error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    const { date, description, type, amount, category, proof_image } = req.body;
    try {
        await db.query('UPDATE transactions SET date=?, description=?, type=?, amount=?, category=?, proof_image=? WHERE id=?',
            [date, description, type, amount, category, proof_image, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/transactions/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM transactions WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- DIVISION SETTINGS ROUTES ---
app.get('/api/division-settings', async (req, res) => {
    try {
        const [settings] = await db.query('SELECT * FROM division_settings ORDER BY display_order ASC');
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/division-settings', async (req, res) => {
    const { name, nominal, display_order } = req.body;
    const id = uuidv4();
    try {
        await db.query('INSERT INTO division_settings (id, name, nominal, display_order) VALUES (?, ?, ?, ?)',
            [id, name, nominal, display_order || 0]);
        res.status(201).json({ id, name, nominal, display_order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/division-settings/:id', async (req, res) => {
    const { id } = req.params;
    const { name, nominal, display_order } = req.body;
    try {
        await db.query('UPDATE division_settings SET name=?, nominal=?, display_order=? WHERE id=?',
            [name, nominal, display_order, id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/division-settings/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM division_settings WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server is running on port ${PORT} [DEBUG v3 - LAN]`);
    });
}

module.exports = app;
