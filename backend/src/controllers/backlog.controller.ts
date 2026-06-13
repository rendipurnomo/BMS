import { BacklogService } from '../services/backlog.service';
import { CreateBacklogSchema, CompleteBacklogSchema, CreatePartSchema, UploadPhotoSchema } from '../dtos';

export class BacklogController {
  private backlogService: BacklogService;

  constructor() {
    this.backlogService = new BacklogService();
  }

  create = async (req: any, res: any): Promise<void> => {
    try {
      const parseResult = CreateBacklogSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
      }

      const backlog = await this.backlogService.createBacklog(req.user, parseResult.data as any);
      return res.status(201).json({
        status: 'success',
        data: { backlog },
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  list = async (req: any, res: any): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
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
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  getById = async (req: any, res: any): Promise<void> => {
    try {
      const backlog = await this.backlogService.getBacklogById(req.params.id);
      if (!backlog) {
        return res.status(404).json({ status: 'fail', message: 'Backlog not found' });
      }
      return res.status(200).json({
        status: 'success',
        data: { backlog },
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  approve = async (req: any, res: any): Promise<void> => {
    try {
      const backlog = await this.backlogService.approveBacklog(req.user, req.params.id);
      return res.status(200).json({
        status: 'success',
        message: 'Backlog approved successfully',
        data: { backlog },
      });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('must be WAITING_APPROVAL')) {
        return res.status(400).json({ status: 'fail', message: error.message });
      }
      if (error.message.includes('outside their Site')) {
        return res.status(403).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  reject = async (req: any, res: any): Promise<void> => {
    try {
      const backlog = await this.backlogService.rejectBacklog(req.user, req.params.id);
      return res.status(200).json({
        status: 'success',
        message: 'Backlog rejected successfully',
        data: { backlog },
      });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('must be WAITING_APPROVAL')) {
        return res.status(400).json({ status: 'fail', message: error.message });
      }
      if (error.message.includes('outside their Site')) {
        return res.status(403).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  startInstallation = async (req: any, res: any): Promise<void> => {
    try {
      const backlog = await this.backlogService.startInstallation(req.user, req.params.id);
      return res.status(200).json({
        status: 'success',
        message: 'Installation started',
        data: { backlog },
      });
    } catch (error: any) {
      if (error.message.includes('does not have access')) {
        return res.status(403).json({ status: 'fail', message: error.message });
      }
      if (error.message.includes('not found') || error.message.includes('must be FULL_SUPPLY')) {
        return res.status(400).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  complete = async (req: any, res: any): Promise<void> => {
    try {
      const parseResult = CompleteBacklogSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.issues.map((err: any) => ({
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
    } catch (error: any) {
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
  addPart = async (req: any, res: any): Promise<void> => {
    try {
      const parseResult = CreatePartSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.issues.map((err: any) => ({
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
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  addPhoto = async (req: any, res: any): Promise<void> => {
    try {
      const parseResult = UploadPhotoSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.issues.map((err: any) => ({
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
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  getParts = async (req: any, res: any): Promise<void> => {
    try {
      const parts = await this.backlogService.getBacklogParts(req.params.id);
      return res.status(200).json({
        status: 'success',
        data: { parts },
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  getPhotos = async (req: any, res: any): Promise<void> => {
    try {
      const photos = await this.backlogService.getBacklogPhotos(req.params.id);
      return res.status(200).json({
        status: 'success',
        data: { photos },
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  getHistory = async (req: any, res: any): Promise<void> => {
    try {
      const history = await this.backlogService.getBacklogHistory(req.params.id);
      return res.status(200).json({
        status: 'success',
        data: { history },
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  getCompletion = async (req: any, res: any): Promise<void> => {
    try {
      const completion = await this.backlogService.getBacklogCompletion(req.params.id);
      return res.status(200).json({
        status: 'success',
        data: { completion },
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };
}
