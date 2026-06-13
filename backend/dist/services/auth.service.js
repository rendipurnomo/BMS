"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repositories/user.repository");
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'BMS_JWT_ACCESS_SECRET_KEY_2026';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'BMS_JWT_REFRESH_SECRET_KEY_2026';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
class AuthService {
    userRepository;
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
    }
    /**
     * Hashes a plain-text password using bcrypt.
     */
    async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(password, salt);
    }
    /**
     * Compares a plain password with its hashed representation.
     */
    async comparePassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
    /**
     * Authenticates a user by NRP and password.
     */
    async login(nrp, password) {
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
                _id: user._id.toString(),
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
    generateAccessToken(user) {
        const payload = {
            sub: user._id.toString(),
            nrp: user.nrp,
            role: user.role,
            site: user.site,
            section: user.section,
        };
        return jsonwebtoken_1.default.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    }
    /**
     * Generates a signed Refresh Token.
     */
    generateRefreshToken(user) {
        const payload = {
            sub: user._id.toString(),
        };
        return jsonwebtoken_1.default.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    }
    /**
     * Verifies an Access Token and returns its payload.
     */
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_SECRET);
        }
        catch (error) {
            throw new Error('Invalid access token');
        }
    }
    /**
     * Verifies a Refresh Token and returns its payload.
     */
    verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET);
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
}
exports.AuthService = AuthService;
