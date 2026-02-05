const db = require('./server/db');

async function seedMenus() {
    console.log("Restoring all system menus to Aiven database...");

    const systemMenus = [
        ['operational_division', 'Operasional Divisi', 'operational', 'Briefcase', null, '1'],
        ['operational_hardware', 'Bagian Hardware', 'operational', 'Cpu', null, '1'],
        ['operational_si', 'Sistem Informasi', 'operational', 'Database', null, '1'],
        ['operational_taktis', 'Dana Taktis', 'operational', 'Layers', null, '1'],
        ['operational_saving', 'Saving - Operasional', 'operational', 'PiggyBank', null, '1'],
        ['savings_main', 'Tabungan Utama', 'savings', 'Landmark', null, '1'],
        ['savings_others', 'Tabungan Lainnya', 'savings', 'Coins', null, '1']
    ];

    try {
        const connection = await db.getConnection();

        console.log("Seeding menus...");
        for (let menu of systemMenus) {
            await connection.query(
                "INSERT IGNORE INTO menus (id, label, type, icon_name, section_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
                menu
            );
            console.log(`✅ Restored menu: ${menu[1]}`);
        }

        connection.release();
        console.log("\n🚀 MENUS RESTORED SUCCESSFULLY!");
        process.exit(0);
    } catch (error) {
        console.error("❌ FAILED to restore menus:");
        console.error(error.message);
        process.exit(1);
    }
}

seedMenus();
