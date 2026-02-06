const db = require('./server/db');
const { v4: uuidv4 } = require('uuid');

async function syncDivisionSettings() {
    console.log("Starting division settings synchronization (Local -> Aiven)...");

    try {
        // 1. Get Local Data
        console.log("Reading local division settings...");
        const [localSettings] = await db.query('SELECT * FROM division_settings');
        console.log(`Found ${localSettings.length} division settings locally.`);

        if (localSettings.length === 0) {
            console.log("No local data found. Skipping sync.");
            process.exit(0);
        }

        // 2. Connect to Aiven
        // Using the same URL found in migrate_data.js
        const aivenUrl = "mysql://avnadmin:AVNS_XrjCp151Ven03kbMX4H@mysql-laporan-keuangan.g.aivencloud.com:11835/defaultdb?ssl-mode=REQUIRED";
        const mysql = require('mysql2/promise');
        const remoteConn = await mysql.createConnection(aivenUrl);
        console.log("Connected to Aiven.");

        // 3. Ensure Table Exists on Aiven
        console.log("Ensuring division_settings table exists on Aiven...");
        await remoteConn.query(`
            CREATE TABLE IF NOT EXISTS division_settings (
                id CHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                nominal DECIMAL(15, 2) NOT NULL,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `);

        // 4. Migrate Data
        console.log("Migrating division settings...");
        for (let s of localSettings) {
            await remoteConn.query(
                "INSERT IGNORE INTO division_settings (id, name, nominal, display_order, created_at) VALUES (?, ?, ?, ?, ?)",
                [s.id, s.name, s.nominal, s.display_order, s.created_at]
            );
            console.log(`✅ Synced: ${s.name}`);
        }

        console.log("✅ Division settings synchronization complete!");
        await remoteConn.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Synchronization failed:", error);
        process.exit(1);
    }
}

syncDivisionSettings();
