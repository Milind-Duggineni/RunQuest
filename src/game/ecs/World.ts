import { Entity } from './Entity';
import { System } from './System';

export class World {
  private entities: Map<string, Entity> = new Map();
  private systems: System[] = [];
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  constructor() {
    this.update = this.update.bind(this);
  }

  addEntity(entity: Entity): World {
    if (this.entities.has(entity.id)) {
      console.warn(`Entity with id ${entity.id} already exists`);
      return this;
    }

    this.entities.set(entity.id, entity);
    this.systems.forEach(system => {
      system.registerEntity(entity);
    });

    return this;
  }

  removeEntity(entityId: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    this.systems.forEach(system => {
      system.unregisterEntity(entityId);
    });

    return this.entities.delete(entityId);
  }

  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }

  addSystem(system: System): World {
    this.systems.push(system);
    
    // Register all existing entities with the new system
    this.entities.forEach(entity => {
      system.registerEntity(entity);
    });

    return this;
  }

  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.update();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private update(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update all systems
    this.systems.forEach(system => {
      system.update(deltaTime);
    });

    this.animationFrameId = requestAnimationFrame(this.update);
  }

  dispose(): void {
    this.stop();
    this.entities.clear();
    this.systems = [];
  }
}
