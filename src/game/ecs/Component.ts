import { v4 as uuidv4 } from 'uuid';

export abstract class Component {
  public readonly id: string;
  public entityId: string;

  constructor(entityId: string) {
    this.id = uuidv4();
    this.entityId = entityId;
  }
}

export class PositionComponent extends Component {
  constructor(
    entityId: string,
    public x: number = 0,
    public y: number = 0
  ) {
    super(entityId);
  }
}

export class VelocityComponent extends Component {
  constructor(
    entityId: string,
    public vx: number = 0,
    public vy: number = 0
  ) {
    super(entityId);
  }
}

export class DrawableComponent extends Component {
  constructor(
    entityId: string,
    public render: (ctx: CanvasRenderingContext2D) => void
  ) {
    super(entityId);
  }
}

export class StepInputComponent extends Component {
  constructor(
    entityId: string,
    public stepCount: number = 0,
    public lastStepTime: number = Date.now()
  ) {
    super(entityId);
  }
}
