const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Restoring system menus...');
    const sysMenus = [
        ['operational_saving', 'Saving - Operasional', 'operational', 'PiggyBank', null, '1'],
        ['operational_hardware', 'Bagian Hardware', 'operational', 'Cpu', null, '1'],
        ['operational_si', 'Sistem Informasi', 'operational', 'Database', null, '1'],
        ['operational_division', 'Operasional Divisi', 'operational', 'Briefcase', null, '1'],
    ];

    for (let menu of sysMenus) {
        await connection.query(
            "REPLACE INTO menus (id, label, type, icon_name, section_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
            menu
        );
    }

    console.log('Fix completed successfully!');
    await connection.end();
}

fix().catch(console.error);
