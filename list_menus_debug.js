const db = require('./server/db');

async function listMenus() {
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.query('SELECT id, label, type, user_id FROM menus');
        console.log("Menus in Aiven DB:", JSON.stringify(rows, null, 2));
        connection.release();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
listMenus();
