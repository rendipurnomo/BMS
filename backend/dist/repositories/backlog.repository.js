"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacklogRepository = void 0;
const backlog_model_1 = require("../models/backlog.model");
const backlog_part_model_1 = require("../models/backlog-part.model");
const backlog_photo_model_1 = require("../models/backlog-photo.model");
const completion_model_1 = require("../models/completion.model");
const backlog_history_model_1 = require("../models/backlog-history.model");
class BacklogRepository {
    async create(backlogData) {
        return backlog_model_1.Backlog.create(backlogData);
    }
    async findById(id) {
        return backlog_model_1.Backlog.findOne({ where: { _id: id, isActive: true } });
    }
    async findByBacklogNo(backlogNo) {
        return backlog_model_1.Backlog.findOne({ where: { backlogNo, isActive: true } });
    }
    async update(id, updateData) {
        const backlog = await backlog_model_1.Backlog.findByPk(id);
        if (!backlog)
            return null;
        await backlog.update(updateData);
        return backlog;
    }
    async softDelete(id) {
        const backlog = await backlog_model_1.Backlog.findByPk(id);
        if (!backlog)
            return null;
        await backlog.update({ isActive: false });
        return backlog;
    }
    async findAll(filter = {}, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const { rows, count } = await backlog_model_1.Backlog.findAndCountAll({
            where: { ...filter, isActive: true },
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });
        return { backlogs: rows, total: count };
    }
    // --- Backlog Parts Operations ---
    async addPart(partData) {
        if (partData._id) {
            const existing = await backlog_part_model_1.BacklogPart.findByPk(partData._id);
            if (existing) {
                await existing.update(partData);
                return existing;
            }
        }
        return backlog_part_model_1.BacklogPart.create(partData);
    }
    async findPartsByBacklogId(backlogId) {
        return backlog_part_model_1.BacklogPart.findAll({ where: { backlogId, isActive: true } });
    }
    async findPartById(partId) {
        return backlog_part_model_1.BacklogPart.findOne({ where: { _id: partId, isActive: true } });
    }
    async updatePart(partId, updateData) {
        const part = await backlog_part_model_1.BacklogPart.findByPk(partId);
        if (!part)
            return null;
        await part.update(updateData);
        return part;
    }
    // --- Backlog Photos Operations ---
    async addPhoto(photoData) {
        return backlog_photo_model_1.BacklogPhoto.create(photoData);
    }
    async findPhotosByBacklogId(backlogId) {
        return backlog_photo_model_1.BacklogPhoto.findAll({ where: { backlogId, isActive: true } });
    }
    // --- Completions Operations ---
    async saveCompletion(completionData) {
        const existing = await completion_model_1.Completion.findOne({ where: { backlogId: completionData.backlogId } });
        if (existing) {
            await existing.update(completionData);
            return existing;
        }
        return completion_model_1.Completion.create(completionData);
    }
    async findCompletionByBacklogId(backlogId) {
        return completion_model_1.Completion.findOne({ where: { backlogId, isActive: true } });
    }
    // --- History Operations ---
    async logHistory(historyData) {
        return backlog_history_model_1.BacklogHistory.create(historyData);
    }
    async findHistoryByBacklogId(backlogId) {
        return backlog_history_model_1.BacklogHistory.findAll({
            where: { backlogId },
            order: [['createdAt', 'ASC']],
        });
    }
}
exports.BacklogRepository = BacklogRepository;
