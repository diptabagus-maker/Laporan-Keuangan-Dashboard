const db = require('./db');
const { v4: uuidv4 } = require('uuid');
async function test() {
    const id = uuidv4();
    try {
        await db.query('INSERT INTO transactions (id, menu_id, user_id, date, description, type, amount, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, 'operational_division', '1', '2026-02-04', 'Test', 'out', 100, 'Test']);
        console.log('Insert successful!');
        await db.query('DELETE FROM transactions WHERE id = ?', [id]);
    } catch (err) {
        console.error('Insert failed:', err);
    }
    process.exit(0);
}
test();
