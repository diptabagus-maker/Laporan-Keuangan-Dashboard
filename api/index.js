// Absolute Minimal Node.js Sanity Check
// No Vercel helpers, no Express, just pure Node.js
module.exports = (req, res) => {
    try {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Vercel Function is ALIVE. The previous crash was likely due to missing helpers.');
    } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.end('Error: ' + e.message);
    }
};
