"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Load .env.local if it exists, otherwise fallback to .env
const envLocalPath = path_1.default.resolve(process.cwd(), '.env.local');
if (fs_1.default.existsSync(envLocalPath)) {
    dotenv_1.default.config({ path: envLocalPath });
}
// Always load .env to fill in missing variables
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = require("./db");
// Connect to Database (This will happen when Vercel boots the function)
(0, db_1.connectDatabase)().catch((error) => {
    console.error('Fatal: Database connection issue.', error);
});
// If NOT running in Vercel, start the server normally
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app_1.default.listen(PORT, () => {
        console.log(`BMS backend server is running on port ${PORT}`);
    });
}
// Export the app for Vercel Serverless
exports.default = app_1.default;
