import { Entity } from './Entity';

export abstract class System {
  public abstract componentsRequired: Set<Function>;
  protected entities: Set<Entity> = new Set();

  public registerEntity(entity: Entity): void {
    if (this.qualifies(entity)) {
      this.entities.add(entity);
      this.onEntityAdded?.(entity);
    }
  }

  public unregisterEntity(entityId: string): void {
    for (const entity of this.entities) {
      if (entity.id === entityId) {
        this.onEntityRemoved?.(entity);
        this.entities.delete(entity);
        break;
      }
    }
  }

  public update(deltaTime: number): void {
    this.updateEntities(deltaTime);
  }

  protected updateEntities(deltaTime: number): void {
    for (const entity of this.entities) {
      this.updateEntity(entity, deltaTime);
    }
  }

  protected abstract updateEntity(entity: Entity, deltaTime: number): void;
  
  protected onEntityAdded?(entity: Entity): void;
  protected onEntityRemoved?(entity: Entity): void;

  public qualifies(entity: Entity): boolean {
    for (const component of this.componentsRequired) {
      if (!entity.hasComponent(component as new (...args: any[]) => any)) {
        return false;
      }
    }
    return true;
  }
}
