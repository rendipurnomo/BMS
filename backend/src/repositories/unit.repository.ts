import { Unit, IUnit } from '../models/unit.model';

export class UnitRepository {
  async findByUnitCode(unitCode: string): Promise<IUnit | null> {
    return Unit.findOne({ where: { unitCode, isActive: true } });
  }

  async findById(id: string): Promise<IUnit | null> {
    return Unit.findOne({ where: { _id: id, isActive: true } });
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ units: IUnit[]; total: number }> {
    const offset = (page - 1) * limit;
    const { rows, count } = await Unit.findAndCountAll({
      where: { isActive: true },
      limit,
      offset,
    });
    return { units: rows, total: count };
  }

  async create(unitData: Partial<IUnit>): Promise<IUnit> {
    return Unit.create(unitData);
  }

  async update(id: string, updateData: Partial<IUnit>): Promise<IUnit | null> {
    const unit = await Unit.findByPk(id);
    if (!unit) return null;
    await unit.update(updateData);
    return unit;
  }

  async softDelete(id: string): Promise<IUnit | null> {
    const unit = await Unit.findByPk(id);
    if (!unit) return null;
    await unit.update({ isActive: false });
    return unit;
  }
}
