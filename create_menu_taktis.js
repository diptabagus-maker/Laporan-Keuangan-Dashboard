const db = require('./server/db');

async function createDanaTaktis() {
    try {
        // Check if exists
        const [existing] = await db.query("SELECT * FROM menus WHERE id = ?", ['operational_taktis']);
        if (existing.length > 0) {
            console.log("Menu 'operational_taktis' already exists.");
        } else {
            await db.query("INSERT INTO menus (id, label, type, icon_name) VALUES (?, ?, ?, ?)",
                ['operational_taktis', 'Dana Taktis', 'operational', 'Wallet']);
            console.log("Created menu 'operational_taktis'.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createDanaTaktis();
