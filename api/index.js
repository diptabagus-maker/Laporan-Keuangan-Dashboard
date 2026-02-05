// Minimal Sanity Check
module.exports = (req, res) => {
    res.status(200).json({
        status: "Alive",
        message: "If you see this, Vercel is working correctly. The issue is in the backend dependencies."
    });
};
