export type DemoModelId = 'chair' | 'floor-lamp' | 'side-table'

export type DemoModel = {
  id: DemoModelId
  name: string
  file: string
  category: string
  previewSrc: string
}

/** Curated GLBs in public/models/ — swap or add files here for hackathon demos. */
export const DEMO_MODELS: DemoModel[] = [
  {
    id: 'chair',
    name: 'Accent Chair',
    file: 'chair.glb',
    category: 'Seating',
    previewSrc: '/models/chair.glb',
  },
  {
    id: 'floor-lamp',
    name: 'Floor Lamp',
    file: 'floor-lamp.glb',
    category: 'Lighting',
    previewSrc: '/models/floor-lamp.glb',
  },
  {
    id: 'side-table',
    name: 'Side Table',
    file: 'side-table.glb',
    category: 'Surfaces',
    previewSrc: '/models/side-table.glb',
  },
]

export function getDemoModel(id: string): DemoModel | undefined {
  return DEMO_MODELS.find((m) => m.id === id)
}
