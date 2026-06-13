"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../src/app"));
const db_1 = require("../src/db");
exports.default = async (req, res) => {
    try {
        await (0, db_1.connectDatabase)();
    }
    catch (err) {
        console.error('Database connection failed in serverless entry point:', err);
    }
    return (0, app_1.default)(req, res);
};
