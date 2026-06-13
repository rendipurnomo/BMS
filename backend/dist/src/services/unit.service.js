"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitService = void 0;
const unit_repository_1 = require("../repositories/unit.repository");
const audit_log_model_1 = require("../models/audit-log.model");
class UnitService {
    unitRepository;
    constructor() {
        this.unitRepository = new unit_repository_1.UnitRepository();
    }
    async createUnit(creatorId, unitData) {
        if (!unitData.unitCode) {
            throw new Error('Unit code is required');
        }
        // Enforce uniqueness
        const existingUnit = await this.unitRepository.findByUnitCode(unitData.unitCode);
        if (existingUnit) {
            throw new Error('Unit code already exists');
        }
        const unit = await this.unitRepository.create(unitData);
        // Audit Trail
        await new audit_log_model_1.AuditLog({
            action: 'CREATE_UNIT',
            resource: 'Unit',
            resourceId: unit._id,
            actionBy: creatorId,
            details: `Created unit ${unit.unitCode} (${unit.unitModel})`,
        }).save();
        return unit;
    }
    async updateUnit(creatorId, unitId, updateData) {
        const existingUnit = await this.unitRepository.findById(unitId);
        if (!existingUnit) {
            throw new Error('Unit not found');
        }
        const unit = await this.unitRepository.update(unitId, updateData);
        if (!unit) {
            throw new Error('Unit update failed');
        }
        // Audit Trail
        await new audit_log_model_1.AuditLog({
            action: 'UPDATE_UNIT',
            resource: 'Unit',
            resourceId: unit._id,
            actionBy: creatorId,
            details: `Updated unit ${unit.unitCode}`,
        }).save();
        return unit;
    }
    async deleteUnit(creatorId, unitId) {
        const unit = await this.unitRepository.softDelete(unitId);
        if (!unit) {
            throw new Error('Unit not found');
        }
        // Audit Trail
        await new audit_log_model_1.AuditLog({
            action: 'DELETE_UNIT',
            resource: 'Unit',
            resourceId: unit._id,
            actionBy: creatorId,
            details: `Soft deleted unit ${unit.unitCode}`,
        }).save();
        return unit;
    }
    async getUnitById(unitId) {
        return this.unitRepository.findById(unitId);
    }
    async getUnits(page = 1, limit = 10) {
        return this.unitRepository.findAll(page, limit);
    }
}
exports.UnitService = UnitService;
