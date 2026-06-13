import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';

const authService = new AuthService();
const userRepository = new UserRepository();

/**
 * Express-compatible middleware to authenticate requests using JWT Bearer token.
 */
export async function authenticate(req: any, res: any, next: any): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required. Token is missing.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;

    try {
      decoded = authService.verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired access token.',
      });
    }

    // Load user from database to ensure they still exist and are active
    const user = await userRepository.findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'User account is inactive or does not exist.',
      });
    }

    // Attach user to request context
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication.',
    });
  }
}
