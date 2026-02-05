const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

(async () => {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Searching for Divisi menus...\n');

        const [menus] = await conn.query(`
            SELECT id, label, type, section_id, user_id, created_at 
            FROM menus 
            WHERE label LIKE '%Divisi%' OR label LIKE '%divisi%'
            ORDER BY created_at
        `);

        console.log('Found menus:', JSON.stringify(menus, null, 2));

        await conn.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
