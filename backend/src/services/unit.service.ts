import { UnitRepository } from '../repositories/unit.repository';
import { IUnit } from '../models/unit.model';
import { AuditLog } from '../models/audit-log.model';

export class UnitService {
  private unitRepository: UnitRepository;

  constructor() {
    this.unitRepository = new UnitRepository();
  }

  async createUnit(creatorId: string, unitData: Partial<IUnit>): Promise<IUnit> {
    if (!unitData.unitCode) {
      throw new Error('Unit code is required');
    }

    // Enforce uniqueness
    const existingUnit = await this.unitRepository.findByUnitCode(unitData.unitCode);
    if (existingUnit) {
      throw new Error('Unit code already exists');
    }

    const unit = await this.unitRepository.create(unitData);

    // Audit Trail
    await new AuditLog({
      action: 'CREATE_UNIT',
      resource: 'Unit',
      resourceId: unit._id,
      actionBy: creatorId,
      details: `Created unit ${unit.unitCode} (${unit.unitModel})`,
    }).save();

    return unit;
  }

  async updateUnit(creatorId: string, unitId: string, updateData: Partial<IUnit>): Promise<IUnit | null> {
    const existingUnit = await this.unitRepository.findById(unitId);
    if (!existingUnit) {
      throw new Error('Unit not found');
    }

    const unit = await this.unitRepository.update(unitId, updateData);
    if (!unit) {
      throw new Error('Unit update failed');
    }

    // Audit Trail
    await new AuditLog({
      action: 'UPDATE_UNIT',
      resource: 'Unit',
      resourceId: unit._id,
      actionBy: creatorId,
      details: `Updated unit ${unit.unitCode}`,
    }).save();

    return unit;
  }

  async deleteUnit(creatorId: string, unitId: string): Promise<IUnit | null> {
    const unit = await this.unitRepository.softDelete(unitId);
    if (!unit) {
      throw new Error('Unit not found');
    }

    // Audit Trail
    await new AuditLog({
      action: 'DELETE_UNIT',
      resource: 'Unit',
      resourceId: unit._id,
      actionBy: creatorId,
      details: `Soft deleted unit ${unit.unitCode}`,
    }).save();

    return unit;
  }

  async getUnitById(unitId: string): Promise<IUnit | null> {
    return this.unitRepository.findById(unitId);
  }

  async getUnits(page: number = 1, limit: number = 10): Promise<{ units: IUnit[]; total: number }> {
    return this.unitRepository.findAll(page, limit);
  }
}
