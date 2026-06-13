"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./db");
const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        // Connect to Database
        await (0, db_1.connectDatabase)();
        // Start Express HTTP Server
        app_1.default.listen(PORT, () => {
            console.log(`BMS backend server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Fatal: Server startup failed due to database connection issue.', error);
        process.exit(1);
    }
}
startServer();
