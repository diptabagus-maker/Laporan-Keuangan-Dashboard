const db = require('./server/db');

async function testConnection() {
    console.log("Attempting to connect to database...");
    try {
        const connection = await db.getConnection();
        console.log("✅ SUCCESS: Connected to database!");

        const [rows] = await connection.query('SELECT 1 + 1 AS result');
        console.log("✅ QUERY RESULT:", rows[0].result); // Should print 2

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error("❌ FAILED: Could not connect to database.");
        console.error("Error details:", error.message);
        process.exit(1);
    }
}

testConnection();
