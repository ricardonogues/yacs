import { YacsEventContext, YacsRelationshipEvent, YacsRelationshipEventHandler } from "../types/yacs.types";

export class YacsRelationshipEventManager {
  private eventHandlers: Map<string, YacsRelationshipEventHandler[]> = new Map();

  public on(
    entity: string,
    relationship: string,
    event: YacsRelationshipEvent,
    handler: (context: YacsEventContext) => Promise<void> | void
  ): void {
    const key = `${entity}.${relationship}.${event}`;
    if (!this.eventHandlers.has(key)) {
      this.eventHandlers.set(key, []);
    }
    this.eventHandlers.get(key)!.push({ event, handler });
  }

  public async emit(
    entity: string,
    relationship: string,
    event: YacsRelationshipEvent,
    context: YacsEventContext
  ): Promise<void> {
    const key = `${entity}.${relationship}.${event}`;
    const handlers = this.eventHandlers.get(key) || [];

    for (const { handler } of handlers) {
      try {
        await handler(context);
      } catch (error) {
        console.error(`Error in relationship event handler ${key}:`, error);
        throw error;
      }
    }
  }

  // Global event handlers (for all entities/relationships)
  public onGlobal(event: YacsRelationshipEvent, handler: (context: YacsEventContext) => Promise<void> | void): void {
    const key = `global.${event}`;
    if (!this.eventHandlers.has(key)) {
      this.eventHandlers.set(key, []);
    }
    this.eventHandlers.get(key)!.push({ event, handler });
  }

  public async emitGlobal(event: YacsRelationshipEvent, context: YacsEventContext): Promise<void> {
    const key = `global.${event}`;
    const handlers = this.eventHandlers.get(key) || [];

    for (const { handler } of handlers) {
      try {
        await handler(context);
      } catch (error) {
        console.error(`Error in global relationship event handler ${key}:`, error);
        throw error;
      }
    }
  }
}
