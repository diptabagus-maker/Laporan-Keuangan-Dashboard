// Debugging Vercel Function Initialization
console.log("Starting API initialization...");

let app;

try {
    console.log("Loading module: path");
    const path = require('path');

    console.log("Loading module: fs");
    const fs = require('fs');

    console.log("Loading module: express");
    const express = require('express');

    console.log("Loading module: cors");
    const cors = require('cors');

    console.log("Loading module: mysql2");
    const mysql = require('mysql2/promise');

    console.log("Loading server application from ../server/index.js");
    app = require('../server/index.js');
    console.log("Server application loaded successfully");

    module.exports = app;

} catch (error) {
    console.error("FATAL ERROR during backend loading:", error);

    // Create a fallback error handler app
    const errorApp = require('express')();
    errorApp.all('*', (req, res) => {
        res.status(500).json({
            error: "Backend Initialization Failed",
            errorMessage: error.message,
            errorStack: error.stack,
            atStep: "Validation of dependencies"
        });
    });

    module.exports = errorApp;
}
