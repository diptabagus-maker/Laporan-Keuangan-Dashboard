const db = require('./db');

async function checkDB() {
    try {
        const [menus] = await db.query('SELECT * FROM menus');
        console.log('Menus in DB:', JSON.stringify(menus, null, 2));

        const [sections] = await db.query('SELECT * FROM sections');
        console.log('Sections in DB:', JSON.stringify(sections, null, 2));

        const [users] = await db.query('SELECT * FROM users');
        console.log('Users in DB:', JSON.stringify(users, null, 2));

        const [txs] = await db.query("SELECT * FROM transactions WHERE menu_id IN ('operational_division', 'operational_saving') ORDER BY created_at DESC");
        console.log('Operational & Saving Transactions:', JSON.stringify(txs, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkDB();
