import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/user.repository';
import { IUser } from '../models/user.model';
import { AuditLog } from '../models/audit-log.model';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async createUser(creatorId: string, userData: Partial<IUser> & { password?: string }): Promise<IUser> {
    if (!userData.nrp) {
      throw new Error('NRP is required');
    }

    // Check NRP uniqueness (including inactive users to prevent NRP reuse conflicts)
    const existingUser = await this.userRepository.findByNrpWithInactive(userData.nrp);
    if (existingUser) {
      throw new Error('NRP already registered');
    }

    if (!userData.password) {
      throw new Error('Password is required');
    }

    // Hash Password
    const passwordHash = await this.hashPassword(userData.password);
    
    // Construct new user payload
    const userPayload: any = { ...userData };
    delete userPayload.password;
    userPayload.passwordHash = passwordHash;

    const user = await this.userRepository.create(userPayload);

    // Write Audit Trail
    await new AuditLog({
      action: 'CREATE_USER',
      resource: 'User',
      resourceId: user._id,
      actionBy: creatorId,
      details: `Created user ${user.name} (NRP: ${user.nrp})`,
    }).save();

    return user;
  }

  async updateUser(creatorId: string, userId: string, updateData: Partial<IUser> & { password?: string }): Promise<IUser | null> {
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const payload: any = { ...updateData };

    // If password is updated, hash it
    if (updateData.password) {
      payload.passwordHash = await this.hashPassword(updateData.password);
      delete payload.password;
    }

    const user = await this.userRepository.update(userId, payload);
    if (!user) {
      throw new Error('User update failed');
    }

    // Write Audit Trail
    await new AuditLog({
      action: 'UPDATE_USER',
      resource: 'User',
      resourceId: user._id,
      actionBy: creatorId,
      details: `Updated user ${user.name} (NRP: ${user.nrp})`,
    }).save();

    return user;
  }

  async deleteUser(creatorId: string, userId: string): Promise<IUser | null> {
    const user = await this.userRepository.softDelete(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Write Audit Trail
    await new AuditLog({
      action: 'DELETE_USER',
      resource: 'User',
      resourceId: user._id,
      actionBy: creatorId,
      details: `Soft deleted user ${user.name} (NRP: ${user.nrp})`,
    }).save();

    return user;
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return this.userRepository.findById(userId);
  }

  async getUsers(page: number = 1, limit: number = 10): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      // Apply pagination query directly using mongoose
      this.userRepository.findAll().then(res => res.slice(skip, skip + limit)),
      this.userRepository.findAll().then(res => res.length)
    ]);
    return { users, total };
  }
}
