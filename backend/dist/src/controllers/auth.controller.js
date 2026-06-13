"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const auth_dto_1 = require("../dtos/auth.dto");
class AuthController {
    authService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    /**
     * Endpoint: POST /auth/login
     */
    login = async (req, res) => {
        try {
            // 1. Validate body manually (in case validateBody middleware wasn't used)
            const parseResult = auth_dto_1.LoginRequestSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({
                    status: 'fail',
                    message: 'Validation error',
                    errors,
                });
            }
            const { nrp, password } = parseResult.data;
            // 2. Perform authentication via service layer
            const result = await this.authService.login(nrp, password);
            // 3. Send successful response
            return res.status(200).json({
                status: 'success',
                message: 'Login success',
                data: result,
            });
        }
        catch (error) {
            if (error.message === 'Invalid NRP or password' || error.message === 'User account is deactivated') {
                return res.status(401).json({
                    status: 'fail',
                    message: error.message,
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error during login.',
            });
        }
    };
    /**
     * Endpoint: GET /auth/me
     */
    me = async (req, res) => {
        try {
            const user = req.user; // Set by authenticate middleware
            if (!user) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Unauthorized.',
                });
            }
            return res.status(200).json({
                status: 'success',
                data: {
                    user: {
                        _id: user._id.toString(),
                        nrp: user.nrp,
                        name: user.name,
                        role: user.role,
                        site: user.site,
                        section: user.section,
                    },
                },
            });
        }
        catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error fetching user profile.',
            });
        }
    };
}
exports.AuthController = AuthController;
