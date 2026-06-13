"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const user_dto_1 = require("../dtos/user.dto");
class UserController {
    userService;
    constructor() {
        this.userService = new user_service_1.UserService();
    }
    create = async (req, res) => {
        try {
            const parseResult = user_dto_1.CreateUserSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
            }
            const user = await this.userService.createUser(req.user._id.toString(), parseResult.data);
            return res.status(201).json({
                status: 'success',
                data: { user },
            });
        }
        catch (error) {
            if (error.message === 'NRP already registered') {
                return res.status(409).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    update = async (req, res) => {
        try {
            const parseResult = user_dto_1.UpdateUserSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
            }
            const user = await this.userService.updateUser(req.user._id.toString(), req.params.id, parseResult.data);
            return res.status(200).json({
                status: 'success',
                data: { user },
            });
        }
        catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    delete = async (req, res) => {
        try {
            await this.userService.deleteUser(req.user._id.toString(), req.params.id);
            return res.status(200).json({
                status: 'success',
                message: 'User deleted successfully',
            });
        }
        catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    getById = async (req, res) => {
        try {
            const user = await this.userService.getUserById(req.params.id);
            if (!user) {
                return res.status(404).json({ status: 'fail', message: 'User not found' });
            }
            return res.status(200).json({
                status: 'success',
                data: { user },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    list = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await this.userService.getUsers(page, limit);
            return res.status(200).json({
                status: 'success',
                data: {
                    users: result.users,
                    total: result.total,
                    page,
                    limit,
                },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
}
exports.UserController = UserController;
