// Production Endpoint with Fallback Error Handling
try {
    const app = require('../server/index.js');
    module.exports = app;
} catch (error) {
    console.error("CRITICAL: Failed to load backend application", error);

    // Fallback handler using pure Node.js (no dependencies)
    module.exports = (req, res) => {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: "Backend Bootstrap Failed",
            details: error.message,
            stack: error.stack,
            at: new Date().toISOString()
        }));
    };
}
