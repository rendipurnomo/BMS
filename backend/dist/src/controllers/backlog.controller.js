"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacklogController = void 0;
const backlog_service_1 = require("../services/backlog.service");
const dtos_1 = require("../dtos");
class BacklogController {
    backlogService;
    constructor() {
        this.backlogService = new backlog_service_1.BacklogService();
    }
    create = async (req, res) => {
        try {
            const parseResult = dtos_1.CreateBacklogSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
            }
            const backlog = await this.backlogService.createBacklog(req.user, parseResult.data);
            return res.status(201).json({
                status: 'success',
                data: { backlog },
            });
        }
        catch (error) {
            if (error.message.includes('already exists')) {
                return res.status(409).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    list = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await this.backlogService.getBacklogs(req.user, page, limit);
            return res.status(200).json({
                status: 'success',
                data: {
                    backlogs: result.backlogs,
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
    getById = async (req, res) => {
        try {
            const backlog = await this.backlogService.getBacklogById(req.params.id);
            if (!backlog) {
                return res.status(404).json({ status: 'fail', message: 'Backlog not found' });
            }
            return res.status(200).json({
                status: 'success',
                data: { backlog },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    approve = async (req, res) => {
        try {
            const backlog = await this.backlogService.approveBacklog(req.user, req.params.id);
            return res.status(200).json({
                status: 'success',
                message: 'Backlog approved successfully',
                data: { backlog },
            });
        }
        catch (error) {
            if (error.message.includes('not found') || error.message.includes('must be WAITING_APPROVAL')) {
                return res.status(400).json({ status: 'fail', message: error.message });
            }
            if (error.message.includes('outside their Site')) {
                return res.status(403).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    reject = async (req, res) => {
        try {
            const backlog = await this.backlogService.rejectBacklog(req.user, req.params.id);
            return res.status(200).json({
                status: 'success',
                message: 'Backlog rejected successfully',
                data: { backlog },
            });
        }
        catch (error) {
            if (error.message.includes('not found') || error.message.includes('must be WAITING_APPROVAL')) {
                return res.status(400).json({ status: 'fail', message: error.message });
            }
            if (error.message.includes('outside their Site')) {
                return res.status(403).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    startInstallation = async (req, res) => {
        try {
            const backlog = await this.backlogService.startInstallation(req.user, req.params.id);
            return res.status(200).json({
                status: 'success',
                message: 'Installation started',
                data: { backlog },
            });
        }
        catch (error) {
            if (error.message.includes('does not have access')) {
                return res.status(403).json({ status: 'fail', message: error.message });
            }
            if (error.message.includes('not found') || error.message.includes('must be FULL_SUPPLY')) {
                return res.status(400).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    complete = async (req, res) => {
        try {
            const parseResult = dtos_1.CompleteBacklogSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
            }
            const backlog = await this.backlogService.completeBacklog(req.user, req.params.id, parseResult.data);
            return res.status(200).json({
                status: 'success',
                message: 'Backlog completed successfully',
                data: { backlog },
            });
        }
        catch (error) {
            if (error.message.includes('does not have access')) {
                return res.status(403).json({ status: 'fail', message: error.message });
            }
            if (error.message.includes('not found') || error.message.includes('must be INSTALLATION')) {
                return res.status(400).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    // --- Sub-Entity Endpoints ---
    addPart = async (req, res) => {
        try {
            const parseResult = dtos_1.CreatePartSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
            }
            const part = await this.backlogService.addPartToBacklog(req.user, req.params.id, parseResult.data);
            return res.status(201).json({
                status: 'success',
                data: { part },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    addPhoto = async (req, res) => {
        try {
            const parseResult = dtos_1.UploadPhotoSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
            }
            const photo = await this.backlogService.addPhotoToBacklog(req.user, req.params.id, parseResult.data);
            return res.status(201).json({
                status: 'success',
                data: { photo },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    getParts = async (req, res) => {
        try {
            const parts = await this.backlogService.getBacklogParts(req.params.id);
            return res.status(200).json({
                status: 'success',
                data: { parts },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    getPhotos = async (req, res) => {
        try {
            const photos = await this.backlogService.getBacklogPhotos(req.params.id);
            return res.status(200).json({
                status: 'success',
                data: { photos },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    getHistory = async (req, res) => {
        try {
            const history = await this.backlogService.getBacklogHistory(req.params.id);
            return res.status(200).json({
                status: 'success',
                data: { history },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    getCompletion = async (req, res) => {
        try {
            const completion = await this.backlogService.getBacklogCompletion(req.params.id);
            return res.status(200).json({
                status: 'success',
                data: { completion },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
}
exports.BacklogController = BacklogController;
