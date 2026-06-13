import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { IUser } from '../models/user.model';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'BMS_JWT_ACCESS_SECRET_KEY_2026';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'BMS_JWT_REFRESH_SECRET_KEY_2026';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface ILoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    nrp: string;
    name: string;
    role: string;
    site: string;
    section: string;
  };
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Hashes a plain-text password using bcrypt.
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plain password with its hashed representation.
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Authenticates a user by NRP and password.
   */
  async login(nrp: string, password: string): Promise<ILoginResult> {
    // 1. Fetch user by NRP. Soft-delete middleware automatically excludes isActive = false.
    const user = await this.userRepository.findByNrp(nrp);
    if (!user) {
      throw new Error('Invalid NRP or password');
    }

    // 2. Extra safeguard check for isActive status
    if (!user.isActive) {
      throw new Error('User account is deactivated');
    }

    // 3. Verify password
    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid NRP or password');
    }

    // 4. Generate Tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: {
        _id: (user._id as any).toString(),
        nrp: user.nrp,
        name: user.name,
        role: user.role,
        site: user.site,
        section: user.section,
      },
    };
  }

  /**
   * Generates a signed Access Token.
   */
  generateAccessToken(user: IUser): string {
    const payload = {
      sub: (user._id as any).toString(),
      nrp: user.nrp,
      role: user.role,
      site: user.site,
      section: user.section,
    };
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  /**
   * Generates a signed Refresh Token.
   */
  generateRefreshToken(user: IUser): string {
    const payload = {
      sub: (user._id as any).toString(),
    };
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  }

  /**
   * Verifies an Access Token and returns its payload.
   */
  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verifies a Refresh Token and returns its payload.
   */
  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
