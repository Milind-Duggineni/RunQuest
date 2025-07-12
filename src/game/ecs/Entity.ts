import { Component } from './Component';

export class Entity {
  public readonly id: string;
  private components: Map<Function, Component> = new Map();
  public tags: Set<string> = new Set();

  constructor(id?: string) {
    this.id = id || Math.random().toString(36).substr(2, 9);
  }

  addComponent(component: Component): this {
    this.components.set(component.constructor, component);
    return this;
  }

  getComponent<T extends Component>(componentClass: new (...args: any[]) => T): T | undefined {
    return this.components.get(componentClass) as T | undefined;
  }

  hasComponent(componentClass: new (...args: any[]) => Component): boolean {
    return this.components.has(componentClass);
  }

  hasComponents(componentClasses: (new (...args: any[]) => Component)[]): boolean {
    return componentClasses.every(cls => this.components.has(cls));
  }

  removeComponent(componentClass: new (...args: any[]) => Component): boolean {
    return this.components.delete(componentClass);
  }

  addTag(tag: string): this {
    this.tags.add(tag);
    return this;
  }

  hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }

  removeTag(tag: string): boolean {
    return this.tags.delete(tag);
  }
}
