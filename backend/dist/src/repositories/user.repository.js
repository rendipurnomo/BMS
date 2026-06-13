"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const user_model_1 = require("../models/user.model");
class UserRepository {
    /**
     * Find a user by NRP. Only returns active users by default.
     */
    async findByNrp(nrp) {
        return user_model_1.User.findOne({ where: { nrp, isActive: true } });
    }
    /**
     * Find a user by ID. Only returns active users by default.
     */
    async findById(id) {
        return user_model_1.User.findOne({ where: { _id: id, isActive: true } });
    }
    /**
     * Find a user by NRP including inactive users (for administrative validation).
     */
    async findByNrpWithInactive(nrp) {
        return user_model_1.User.findOne({ where: { nrp } });
    }
    /**
     * Find a user by ID including inactive users.
     */
    async findByIdWithInactive(id) {
        return user_model_1.User.findByPk(id);
    }
    /**
     * List all users. Only returns active users by default.
     */
    async findAll() {
        return user_model_1.User.findAll({ where: { isActive: true } });
    }
    /**
     * List all users including soft-deleted ones.
     */
    async findAllWithInactive() {
        return user_model_1.User.findAll();
    }
    /**
     * Create a new user.
     */
    async create(userData) {
        return user_model_1.User.create(userData);
    }
    /**
     * Update user details.
     */
    async update(id, updateData) {
        const user = await user_model_1.User.findByPk(id);
        if (!user)
            return null;
        await user.update(updateData);
        return user;
    }
    /**
     * Soft delete user by setting isActive to false.
     */
    async softDelete(id) {
        const user = await user_model_1.User.findByPk(id);
        if (!user)
            return null;
        await user.update({ isActive: false });
        return user;
    }
}
exports.UserRepository = UserRepository;
