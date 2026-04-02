import { type NextRequest } from 'next/server';
import { apiSuccess, apiError, API_ERROR_CODES } from '@/lib/server/api-response';
import prisma from '@/lib/server/db';

export async function GET(request: NextRequest) {
  try {
    const stages = await prisma.stage.findMany({
      include: {
        scenes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const classrooms = stages.map(stage => ({
      id: stage.id,
      name: stage.name,
      description: stage.description,
      sceneCount: stage.scenes.length,
      createdAt: stage.createdAt.toISOString(),
      updatedAt: stage.updatedAt.toISOString(),
    }));

    return apiSuccess({ classrooms });
  } catch (error) {
    return apiError(
      API_ERROR_CODES.INTERNAL_ERROR,
      500,
      'Failed to list classrooms',
      error instanceof Error ? error.message : String(error),
    );
  }
}
