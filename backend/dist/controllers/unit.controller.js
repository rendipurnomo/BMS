"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitController = void 0;
const unit_service_1 = require("../services/unit.service");
const unit_dto_1 = require("../dtos/unit.dto");
class UnitController {
    unitService;
    constructor() {
        this.unitService = new unit_service_1.UnitService();
    }
    create = async (req, res) => {
        try {
            const parseResult = unit_dto_1.CreateUnitSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
            }
            const unit = await this.unitService.createUnit(req.user._id.toString(), parseResult.data);
            return res.status(201).json({
                status: 'success',
                data: { unit },
            });
        }
        catch (error) {
            if (error.message === 'Unit code already exists') {
                return res.status(409).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    update = async (req, res) => {
        try {
            const parseResult = unit_dto_1.UpdateUnitSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
            }
            const unit = await this.unitService.updateUnit(req.user._id.toString(), req.params.id, parseResult.data);
            return res.status(200).json({
                status: 'success',
                data: { unit },
            });
        }
        catch (error) {
            if (error.message === 'Unit not found') {
                return res.status(404).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    delete = async (req, res) => {
        try {
            await this.unitService.deleteUnit(req.user._id.toString(), req.params.id);
            return res.status(200).json({
                status: 'success',
                message: 'Unit deleted successfully',
            });
        }
        catch (error) {
            if (error.message === 'Unit not found') {
                return res.status(404).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    getById = async (req, res) => {
        try {
            const unit = await this.unitService.getUnitById(req.params.id);
            if (!unit) {
                return res.status(404).json({ status: 'fail', message: 'Unit not found' });
            }
            return res.status(200).json({
                status: 'success',
                data: { unit },
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
            const result = await this.unitService.getUnits(page, limit);
            return res.status(200).json({
                status: 'success',
                data: {
                    units: result.units,
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
exports.UnitController = UnitController;
