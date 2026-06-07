import fs from 'fs/promises'
import path from 'path'
import { getDemoModel } from '@/lib/demo-models'

export function demoModelAbsolutePath(file: string): string {
  return path.join(process.cwd(), 'public', 'models', file)
}

export async function readDemoModelGlb(file: string): Promise<Buffer> {
  return fs.readFile(demoModelAbsolutePath(file))
}

export async function readDemoModelGlbById(id: string): Promise<Buffer | null> {
  const model = getDemoModel(id)
  if (!model) return null
  return readDemoModelGlb(model.file)
}
