const db = require('./server/db');

async function checkTables() {
    console.log("Checking tables in database...");
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.query('SHOW TABLES');
        console.log("✅ Tables found:", rows);

        const [users] = await connection.query("SELECT * FROM users LIMIT 1").catch(() => [[], []]);
        if (users && users.length > 0) {
            console.log("✅ found user:", users[0]);
        } else {
            console.log("❌ User table empty or missing");
        }

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error checking tables:", error.message);
        process.exit(1);
    }
}

checkTables();
