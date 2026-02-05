const db = require('./server/db');
const fs = require('fs');
const path = require('path');

async function initDb() {
    console.log("Starting database initialization on Aiven...");

    try {
        const connection = await db.getConnection();

        // 1. Read the schema file
        const schema = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');

        // 2. Split and run each query
        // Simple split by semicolon. Note: This assumes no semicolons inside strings.
        const queries = schema
            .replace(/--.*$/gm, '') // Remove comments
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`Running ${queries.length} schema queries...`);
        for (let query of queries) {
            await connection.query(query);
        }
        console.log("✅ Schema created successfully!");

        // 3. Insert default admin user if not exists
        const [existing] = await connection.query("SELECT * FROM users WHERE username = 'admin'");
        if (existing.length === 0) {
            console.log("Inserting default admin user...");
            await connection.query(
                "INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)",
                ['1', 'admin', 'admin']
            );
            console.log("✅ Admin user created (admin/admin)");
        } else {
            console.log("ℹ️ Admin user already exists.");
        }

        connection.release();
        console.log("\n🚀 DATABASE INITIALIZED SUCCESSFULLY!");
        process.exit(0);
    } catch (error) {
        console.error("❌ FAILED to initialize database:");
        console.error(error.message);
        process.exit(1);
    }
}

initDb();
