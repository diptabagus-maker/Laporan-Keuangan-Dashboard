const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

let config;

if (process.env.DATABASE_URL) {
    // Parsing DATABASE_URL to ensure SSL settings are correct for Aiven
    try {
        const dbUrl = new URL(process.env.DATABASE_URL);
        config = {
            host: dbUrl.hostname,
            user: dbUrl.username,
            password: dbUrl.password,
            database: dbUrl.pathname.slice(1),
            port: dbUrl.port,
            ssl: { rejectUnauthorized: false }, // Force accept for Aiven
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            dateStrings: true
        };
        console.log('Using DATABASE_URL configuration');
    } catch (e) {
        console.error("Invalid DATABASE_URL, falling back to string", e);
        config = process.env.DATABASE_URL;
    }
} else {
    config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        dateStrings: true,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    };
    console.log('Using local configuration');
}

const pool = mysql.createPool(config);

module.exports = pool;
