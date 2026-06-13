"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitRepository = void 0;
const unit_model_1 = require("../models/unit.model");
class UnitRepository {
    async findByUnitCode(unitCode) {
        return unit_model_1.Unit.findOne({ where: { unitCode, isActive: true } });
    }
    async findById(id) {
        return unit_model_1.Unit.findOne({ where: { _id: id, isActive: true } });
    }
    async findAll(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const { rows, count } = await unit_model_1.Unit.findAndCountAll({
            where: { isActive: true },
            limit,
            offset,
        });
        return { units: rows, total: count };
    }
    async create(unitData) {
        return unit_model_1.Unit.create(unitData);
    }
    async update(id, updateData) {
        const unit = await unit_model_1.Unit.findByPk(id);
        if (!unit)
            return null;
        await unit.update(updateData);
        return unit;
    }
    async softDelete(id) {
        const unit = await unit_model_1.Unit.findByPk(id);
        if (!unit)
            return null;
        await unit.update({ isActive: false });
        return unit;
    }
}
exports.UnitRepository = UnitRepository;
