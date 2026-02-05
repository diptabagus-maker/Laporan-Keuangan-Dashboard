const db = require('./db');
async function check() {
    const [menus] = await db.query('SELECT * FROM menus WHERE id = "operational_division"');
    console.log('Operational Division Menu:', JSON.stringify(menus, null, 2));

    const [users] = await db.query('SELECT id, username FROM users');
    console.log('Users:', JSON.stringify(users, null, 2));

    process.exit(0);
}
check().catch(err => { console.error(err); process.exit(1); });
