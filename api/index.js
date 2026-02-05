try {
    const app = require('../server/index.js');
    module.exports = app;
} catch (error) {
    console.error("Failed to load backend:", error);
    module.exports = (req, res) => {
        res.status(500).json({
            error: "Backend Initialization Failed",
            message: error.message,
            stack: error.stack
        });
    };
}
