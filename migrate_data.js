const db = require('./server/db');

async function migrateData() {
    console.log("Starting full data migration (Local -> Aiven)...");

    try {
        // 1. Get Local Data
        console.log("Reading local data...");
        const [localSections] = await db.query('SELECT * FROM sections');
        const [localMenus] = await db.query('SELECT * FROM menus');
        const [localTx] = await db.query('SELECT * FROM transactions');
        console.log(`Found ${localSections.length} sections, ${localMenus.length} menus, and ${localTx.length} transactions locally.`);

        // 2. Switch to Aiven
        const aivenUrl = "mysql://avnadmin:AVNS_XrjCp151Ven03kbMX4H@mysql-laporan-keuangan.g.aivencloud.com:11835/defaultdb?ssl-mode=REQUIRED";
        const mysql = require('mysql2/promise');
        const remoteConn = await mysql.createConnection(aivenUrl);
        console.log("Connected to Aiven.");

        // 3. Migrate Sections
        console.log("Migrating sections...");
        for (let s of localSections) {
            await remoteConn.query(
                "INSERT IGNORE INTO sections (id, label, user_id, created_at) VALUES (?, ?, ?, ?)",
                [s.id, s.label, s.user_id, s.created_at]
            );
        }

        // 4. Migrate Menus
        console.log("Migrating menus...");
        for (let m of localMenus) {
            await remoteConn.query(
                "INSERT IGNORE INTO menus (id, label, type, icon_name, section_id, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [m.id, m.label, m.type, m.icon_name, m.section_id, m.user_id, m.created_at]
            );
        }

        // 5. Migrate Transactions
        console.log("Migrating transactions...");
        for (let t of localTx) {
            await remoteConn.query(
                "INSERT IGNORE INTO transactions (id, menu_id, user_id, date, description, type, amount, category, proof_image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [t.id, t.menu_id, t.user_id, t.date, t.description, t.type, t.amount, t.category, t.proof_image, t.created_at]
            );
        }

        console.log("✅ Full Migration complete!");
        await remoteConn.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrateData();
