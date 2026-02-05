const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setup() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    console.log('Creating database...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.query(`USE ${process.env.DB_NAME}`);

    console.log('Importing schema...');
    const sql = fs.readFileSync(path.join(__dirname, '..', 'database.sql'), 'utf8');

    // Remove comments and split by semicolon
    const queries = sql
        .replace(/--.*$/gm, '') // Remove single line comments
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

    for (let query of queries) {
        try {
            await connection.query(query);
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log(`Index already exists, skipping: ${query.substring(0, 50)}...`);
            } else {
                throw err;
            }
        }
    }

    // Insert dummy user if not exists
    await connection.query("INSERT IGNORE INTO users (id, username, password_hash) VALUES ('1', 'admin', 'admin')");

    console.log('Inserting initial menus...');
    const initialMenus = [
        ['operational_hardware', 'Bagian Hardware', 'operational', 'Cpu', null, '1'],
        ['operational_si', 'Sistem Informasi', 'operational', 'Database', null, '1'],
        ['operational_saving', 'Saving - Operasional', 'operational', 'PiggyBank', null, '1'],
        ['savings_main', 'Tabungan Utama', 'savings', 'Landmark', null, '1'],
        ['savings_others', 'Lainnya', 'savings', 'Coins', null, '1']
    ];

    for (let menu of initialMenus) {
        await connection.query(
            "INSERT IGNORE INTO menus (id, label, type, icon_name, section_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
            menu
        );
    }

    console.log('Setup completed successfully!');
    await connection.end();
    process.exit(0);
}

setup().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
});
