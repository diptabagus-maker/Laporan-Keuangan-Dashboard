const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const [rows] = await connection.execute('SELECT * FROM transactions WHERE menu_id = "operational_saving"');
    console.log('ORPHANED TRANSACTIONS:', JSON.stringify(rows, null, 2));

    const [all] = await connection.execute('SELECT count(*) as count FROM transactions');
    console.log('TOTAL TRANSACTIONS:', all[0].count);

    await connection.end();
}

check().catch(console.error);
