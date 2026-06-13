import { AuthService } from '../services/auth.service';
import { LoginRequestSchema } from '../dtos/auth.dto';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Endpoint: POST /auth/login
   */
  login = async (req: any, res: any): Promise<void> => {
    try {
      // 1. Validate body manually (in case validateBody middleware wasn't used)
      const parseResult = LoginRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          status: 'fail',
          message: 'Validation error',
          errors,
        });
      }

      const { nrp, password } = parseResult.data;

      // 2. Perform authentication via service layer
      const result = await this.authService.login(nrp, password);

      // 3. Send successful response
      return res.status(200).json({
        status: 'success',
        message: 'Login success',
        data: result,
      });
    } catch (error: any) {
      if (error.message === 'Invalid NRP or password' || error.message === 'User account is deactivated') {
        return res.status(401).json({
          status: 'fail',
          message: error.message,
        });
      }
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during login.',
      });
    }
  };

  /**
   * Endpoint: GET /auth/me
   */
  me = async (req: any, res: any): Promise<void> => {
    try {
      const user = req.user; // Set by authenticate middleware
      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'Unauthorized.',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          user: {
            _id: user._id.toString(),
            nrp: user.nrp,
            name: user.name,
            role: user.role,
            site: user.site,
            section: user.section,
          },
        },
      });
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error fetching user profile.',
      });
    }
  };
}
