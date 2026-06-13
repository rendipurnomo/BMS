import { UserService } from '../services/user.service';
import { CreateUserSchema, UpdateUserSchema } from '../dtos/user.dto';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  create = async (req: any, res: any): Promise<void> => {
    try {
      const parseResult = CreateUserSchema.safeParse(req.body);
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
    } catch (error: any) {
      if (error.message === 'NRP already registered') {
        return res.status(409).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  update = async (req: any, res: any): Promise<void> => {
    try {
      const parseResult = UpdateUserSchema.safeParse(req.body);
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
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  delete = async (req: any, res: any): Promise<void> => {
    try {
      await this.userService.deleteUser(req.user._id.toString(), req.params.id);
      return res.status(200).json({
        status: 'success',
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  getById = async (req: any, res: any): Promise<void> => {
    try {
      const user = await this.userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found' });
      }
      return res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  list = async (req: any, res: any): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
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
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };
}
