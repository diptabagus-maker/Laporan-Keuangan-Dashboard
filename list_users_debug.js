const db = require('./server/db');

async function listUsers() {
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.query('SELECT id, username FROM users');
        console.log("Users in Aiven DB:", JSON.stringify(rows, null, 2));
        connection.release();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
listUsers();
