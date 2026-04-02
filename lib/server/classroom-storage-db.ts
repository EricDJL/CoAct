import { type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import prisma from './db';
import type { Scene, Stage } from '@/lib/types/stage';

export interface PersistedClassroomData {
  id: string;
  stage: Stage;
  scenes: Scene[];
  createdAt: string;
}

export function buildRequestOrigin(req: NextRequest): string {
  return req.headers.get('x-forwarded-host')
    ? `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('x-forwarded-host')}`
    : req.nextUrl.origin;
}

export function isValidClassroomId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

export async function readClassroom(id: string): Promise<PersistedClassroomData | null> {
  try {
    const stage = await prisma.stage.findUnique({
      where: { id },
      include: {
        scenes: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!stage) {
      return null;
    }

    return {
      id: stage.id,
      stage: {
        id: stage.id,
        name: stage.name,
        description: stage.description || '',
        language: stage.language,
        style: stage.style,
        currentSceneId: stage.currentSceneId,
        agentIds: stage.agentIds,
      },
      scenes: stage.scenes.map(scene => ({
        id: scene.id,
        stageId: scene.stageId,
        type: scene.type as any,
        title: scene.title,
        content: scene.content as any,
        order: scene.order,
      })),
      createdAt: stage.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('Failed to read classroom from database:', error);
    throw error;
  }
}

export async function persistClassroom(
  data: {
    id: string;
    stage: Stage;
    scenes: Scene[];
  },
  baseUrl: string,
): Promise<PersistedClassroomData & { url: string }> {
  try {
    const { id, stage, scenes } = data;

    const transactionResult = await prisma.$transaction(async (tx) => {
      // Create or update stage
      const stageRecord = await tx.stage.upsert({
        where: { id },
        update: {
          name: stage.name,
          description: stage.description,
          language: stage.language,
          style: stage.style,
          currentSceneId: stage.currentSceneId,
          agentIds: stage.agentIds,
        },
        create: {
          id,
          name: stage.name,
          description: stage.description,
          language: stage.language,
          style: stage.style,
          currentSceneId: stage.currentSceneId,
          agentIds: stage.agentIds,
        },
      });

      // Delete existing scenes for this stage
      await tx.scene.deleteMany({
        where: { stageId: id },
      });

      // Create new scenes
      const sceneRecords = await Promise.all(
        scenes.map((scene, index) =>
          tx.scene.create({
            data: {
              id: scene.id || randomUUID(),
              stageId: id,
              type: scene.type,
              title: scene.title,
              content: scene.content as any,
              order: scene.order || index,
            },
          })
        )
      );

      return { stage: stageRecord, scenes: sceneRecords };
    });

    const classroomData: PersistedClassroomData = {
      id: transactionResult.stage.id,
      stage: {
        id: transactionResult.stage.id,
        name: transactionResult.stage.name,
        description: transactionResult.stage.description || '',
        language: transactionResult.stage.language,
        style: transactionResult.stage.style,
        currentSceneId: transactionResult.stage.currentSceneId,
        agentIds: transactionResult.stage.agentIds,
      },
      scenes: transactionResult.scenes.map(scene => ({
        id: scene.id,
        stageId: scene.stageId,
        type: scene.type as any,
        title: scene.title,
        content: scene.content as any,
        order: scene.order,
      })),
      createdAt: transactionResult.stage.createdAt.toISOString(),
    };

    return {
      ...classroomData,
      url: `${baseUrl}/classroom/${id}`,
    };
  } catch (error) {
    console.error('Failed to persist classroom to database:', error);
    throw error;
  }
}

export async function listClassrooms(): Promise<Array<{ id: string; name: string; createdAt: string }>> {
  try {
    const stages = await prisma.stage.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return stages.map(stage => ({
      id: stage.id,
      name: stage.name,
      createdAt: stage.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to list classrooms from database:', error);
    throw error;
  }
}

export async function deleteClassroom(id: string): Promise<boolean> {
  try {
    const result = await prisma.stage.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Failed to delete classroom from database:', error);
    return false;
  }
}
