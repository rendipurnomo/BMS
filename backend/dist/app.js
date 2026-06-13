"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const yamljs_1 = __importDefault(require("yamljs"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
// Enable CORS for frontend requests
app.use((0, cors_1.default)());
// Load Swagger document
let swaggerDocument = null;
try {
    swaggerDocument = yamljs_1.default.load(path_1.default.join(__dirname, 'swagger.yaml'));
}
catch (err) {
    try {
        swaggerDocument = yamljs_1.default.load(path_1.default.join(process.cwd(), 'src', 'swagger.yaml'));
    }
    catch (err2) {
        console.warn('Warning: swagger.yaml could not be loaded. API documentation will be unavailable.');
    }
}
// Mount Swagger UI
if (swaggerDocument) {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
}
else {
    app.get('/api-docs', (req, res) => {
        res.status(404).send('API documentation is currently unavailable.');
    });
}
// Global Middlewares
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// Mounting API Router under /api/v1
app.use('/api/v1', routes_1.default);
// Root path diagnostic route
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to Backlog Management System (BMS) API Service',
        version: '1.0.0',
    });
});
// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error occurred.',
    });
});
exports.default = app;
