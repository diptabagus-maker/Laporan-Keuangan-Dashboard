const db = require('./server/db');

async function listMenus() {
    try {
        const menus = await db.query("SELECT * FROM menus ORDER BY type, id");
        console.log("Current Menus:");
        console.log(JSON.stringify(menus, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listMenus();
