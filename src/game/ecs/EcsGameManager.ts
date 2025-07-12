import { World } from './World';
import { Entity } from './Entity';
import { PositionComponent, VelocityComponent, StepInputComponent, DrawableComponent } from './Component';
import { MovementSystem } from '../systems/MovementSystem';
import { StepInputSystem } from '../systems/StepInputSystem';
import { RenderSystem } from '../systems/RenderSystem';

type GameConfig = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

export class EcsGameManager {
  private world: World;
  private playerEntity: Entity | null = null;
  private renderSystem: RenderSystem;
  private lastTime: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  constructor(config: GameConfig) {
    // Initialize the ECS world
    this.world = new World();
    
    // Set up rendering
    config.canvas.width = config.width;
    config.canvas.height = config.height;
    this.renderSystem = new RenderSystem(config.canvas);
    
    // Add systems to the world
    this.setupSystems();
    
    // Create initial entities
    this.createEntities();
    
    // Bind methods
    this.update = this.update.bind(this);
  }
  
  private setupSystems(): void {
    // Add systems in the order they should be processed
    this.world.addSystem(new MovementSystem());
    this.world.addSystem(new StepInputSystem());
    this.world.addSystem(this.renderSystem);
  }
  
  private createEntities(): void {
    // Create player entity
    this.playerEntity = new Entity('player');
    
    // Add components to player
    this.playerEntity
      .addComponent(new PositionComponent(this.playerEntity.id, 100, 100))
      .addComponent(new VelocityComponent(this.playerEntity.id, 0, 0))
      .addComponent(new StepInputComponent(this.playerEntity.id, 0, Date.now()))
      .addComponent(new DrawableComponent(this.playerEntity.id, (ctx) => {
        // Simple player rendering (replace with your game's rendering logic)
        ctx.fillStyle = '#3498db';
        ctx.fillRect(-15, -15, 30, 30);
        
        // Draw a simple face
        ctx.fillStyle = '#000';
        ctx.fillRect(-5, -5, 4, 4);
        ctx.fillRect(1, -5, 4, 4);
        ctx.fillRect(-3, 3, 6, 2);
      }));
    
    // Add player to the world
    this.world.addEntity(this.playerEntity);
  }
  
  public onStepDetected(): void {
    if (!this.playerEntity) return;
    
    // Get the step input system and notify it of the step
    const stepSystem = this.world.getSystem(StepInputSystem);
    if (stepSystem) {
      stepSystem.onStepDetected(this.playerEntity.id);
    }
  }
  
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.update();
  }
  
  public stop(): void {
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
    this.world.update(deltaTime);
    
    // Continue the game loop
    this.animationFrameId = requestAnimationFrame(this.update);
  }
  
  public dispose(): void {
    this.stop();
    this.world.dispose();
  }
  
  // Getter for the player entity
  public getPlayer(): Entity | null {
    return this.playerEntity;
  }
}

export default EcsGameManager;
