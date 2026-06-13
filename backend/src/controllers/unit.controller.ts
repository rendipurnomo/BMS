import { UnitService } from '../services/unit.service';
import { CreateUnitSchema, UpdateUnitSchema } from '../dtos/unit.dto';

export class UnitController {
  private unitService: UnitService;

  constructor() {
    this.unitService = new UnitService();
  }

  create = async (req: any, res: any): Promise<void> => {
    try {
      const parseResult = CreateUnitSchema.safeParse(req.body);
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
    } catch (error: any) {
      if (error.message === 'Unit code already exists') {
        return res.status(409).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  update = async (req: any, res: any): Promise<void> => {
    try {
      const parseResult = UpdateUnitSchema.safeParse(req.body);
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
    } catch (error: any) {
      if (error.message === 'Unit not found') {
        return res.status(404).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  delete = async (req: any, res: any): Promise<void> => {
    try {
      await this.unitService.deleteUnit(req.user._id.toString(), req.params.id);
      return res.status(200).json({
        status: 'success',
        message: 'Unit deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Unit not found') {
        return res.status(404).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  getById = async (req: any, res: any): Promise<void> => {
    try {
      const unit = await this.unitService.getUnitById(req.params.id);
      if (!unit) {
        return res.status(404).json({ status: 'fail', message: 'Unit not found' });
      }
      return res.status(200).json({
        status: 'success',
        data: { unit },
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  list = async (req: any, res: any): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
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
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };
}
