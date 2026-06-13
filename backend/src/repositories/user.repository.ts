import { User, IUser } from '../models/user.model';

export class UserRepository {
  /**
   * Find a user by NRP. Only returns active users by default.
   */
  async findByNrp(nrp: string): Promise<IUser | null> {
    return User.findOne({ where: { nrp, isActive: true } });
  }

  /**
   * Find a user by ID. Only returns active users by default.
   */
  async findById(id: string): Promise<IUser | null> {
    return User.findOne({ where: { _id: id, isActive: true } });
  }

  /**
   * Find a user by NRP including inactive users (for administrative validation).
   */
  async findByNrpWithInactive(nrp: string): Promise<IUser | null> {
    return User.findOne({ where: { nrp } });
  }

  /**
   * Find a user by ID including inactive users.
   */
  async findByIdWithInactive(id: string): Promise<IUser | null> {
    return User.findByPk(id);
  }

  /**
   * List all users. Only returns active users by default.
   */
  async findAll(): Promise<IUser[]> {
    return User.findAll({ where: { isActive: true } });
  }

  /**
   * List all users including soft-deleted ones.
   */
  async findAllWithInactive(): Promise<IUser[]> {
    return User.findAll();
  }

  /**
   * Create a new user.
   */
  async create(userData: Partial<IUser>): Promise<IUser> {
    return User.create(userData);
  }

  /**
   * Update user details.
   */
  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update(updateData);
    return user;
  }

  /**
   * Soft delete user by setting isActive to false.
   */
  async softDelete(id: string): Promise<IUser | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update({ isActive: false });
    return user;
  }
}
