import { System } from '../ecs/System';
import { PositionComponent } from '../ecs/Component';
import { DrawableComponent } from '../ecs/Component';
import { Entity } from '../ecs/Entity';

export class RenderSystem extends System {
  public componentsRequired = new Set([PositionComponent, DrawableComponent]);
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    super();
    this.setCanvas(canvas);
  }
  
  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
  }
  
  updateEntity(entity: Entity): void {
    // No-op for now, we'll handle rendering in the update method
  }
  
  update(): void {
    if (!this.ctx || !this.canvas) return;
    
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Sort entities by z-index or render order if needed
    const entities = Array.from(this.entities).sort((a, b) => {
      const posA = a.getComponent(PositionComponent);
      const posB = b.getComponent(PositionComponent);
      return (posA?.z || 0) - (posB?.z || 0);
    });
    
    // Render each entity
    for (const entity of entities) {
      const position = entity.getComponent(PositionComponent);
      const drawable = entity.getComponent(DrawableComponent);
      
      if (!position || !drawable) continue;
      
      // Save the current context state
      this.ctx.save();
      
      // Apply transformations
      this.ctx.translate(position.x, position.y);
      
      // Let the drawable component handle the actual drawing
      drawable.render(this.ctx);
      
      // Restore the context state
      this.ctx.restore();
    }
  }
}
