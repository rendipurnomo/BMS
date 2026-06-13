"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_repository_1 = require("../repositories/user.repository");
const audit_log_model_1 = require("../models/audit-log.model");
class UserService {
    userRepository;
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
    }
    async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(password, salt);
    }
    async createUser(creatorId, userData) {
        if (!userData.nrp) {
            throw new Error('NRP is required');
        }
        // Check NRP uniqueness (including inactive users to prevent NRP reuse conflicts)
        const existingUser = await this.userRepository.findByNrpWithInactive(userData.nrp);
        if (existingUser) {
            throw new Error('NRP already registered');
        }
        if (!userData.password) {
            throw new Error('Password is required');
        }
        // Hash Password
        const passwordHash = await this.hashPassword(userData.password);
        // Construct new user payload
        const userPayload = { ...userData };
        delete userPayload.password;
        userPayload.passwordHash = passwordHash;
        const user = await this.userRepository.create(userPayload);
        // Write Audit Trail
        await new audit_log_model_1.AuditLog({
            action: 'CREATE_USER',
            resource: 'User',
            resourceId: user._id,
            actionBy: creatorId,
            details: `Created user ${user.name} (NRP: ${user.nrp})`,
        }).save();
        return user;
    }
    async updateUser(creatorId, userId, updateData) {
        const existingUser = await this.userRepository.findById(userId);
        if (!existingUser) {
            throw new Error('User not found');
        }
        const payload = { ...updateData };
        // If password is updated, hash it
        if (updateData.password) {
            payload.passwordHash = await this.hashPassword(updateData.password);
            delete payload.password;
        }
        const user = await this.userRepository.update(userId, payload);
        if (!user) {
            throw new Error('User update failed');
        }
        // Write Audit Trail
        await new audit_log_model_1.AuditLog({
            action: 'UPDATE_USER',
            resource: 'User',
            resourceId: user._id,
            actionBy: creatorId,
            details: `Updated user ${user.name} (NRP: ${user.nrp})`,
        }).save();
        return user;
    }
    async deleteUser(creatorId, userId) {
        const user = await this.userRepository.softDelete(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Write Audit Trail
        await new audit_log_model_1.AuditLog({
            action: 'DELETE_USER',
            resource: 'User',
            resourceId: user._id,
            actionBy: creatorId,
            details: `Soft deleted user ${user.name} (NRP: ${user.nrp})`,
        }).save();
        return user;
    }
    async getUserById(userId) {
        return this.userRepository.findById(userId);
    }
    async getUsers(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            // Apply pagination query directly using mongoose
            this.userRepository.findAll().then(res => res.slice(skip, skip + limit)),
            this.userRepository.findAll().then(res => res.length)
        ]);
        return { users, total };
    }
}
exports.UserService = UserService;
