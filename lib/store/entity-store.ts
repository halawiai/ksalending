import { create } from 'zustand';
import { Entity, EntityType } from '../types';

interface EntityState {
  currentEntity: Entity | null;
  entities: Entity[];
  selectedEntityType: EntityType;
  setCurrentEntity: (entity: Entity | null) => void;
  setEntities: (entities: Entity[]) => void;
  setSelectedEntityType: (type: EntityType) => void;
  addEntity: (entity: Entity) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
}

export const useEntityStore = create<EntityState>((set, get) => ({
  currentEntity: null,
  entities: [],
  selectedEntityType: 'individual',
  setCurrentEntity: (entity) => set({ currentEntity: entity }),
  setEntities: (entities) => set({ entities }),
  setSelectedEntityType: (selectedEntityType) => set({ selectedEntityType }),
  addEntity: (entity) => set((state) => ({ entities: [...state.entities, entity] })),
  updateEntity: (id, updates) =>
    set((state) => ({
      entities: state.entities.map((entity) =>
        entity.id === id ? { ...entity, ...updates } : entity
      ) as Entity[],
    })),
}));