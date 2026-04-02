import prisma from './db';
import type {
  ClassroomGenerationProgress,
  ClassroomGenerationStep,
  GenerateClassroomInput,
  GenerateClassroomResult,
} from '@/lib/server/classroom-generation';

export type ClassroomGenerationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface ClassroomGenerationJob {
  id: string;
  status: ClassroomGenerationJobStatus;
  step: ClassroomGenerationStep | 'queued' | 'failed';
  progress: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  inputSummary: {
    requirementPreview: string;
    language: string;
    hasPdf: boolean;
    pdfTextLength: number;
    pdfImageCount: number;
  };
  scenesGenerated: number;
  totalScenes?: number;
  result?: {
    classroomId: string;
    url: string;
    scenesCount: number;
  };
  error?: string;
}

function buildInputSummary(input: GenerateClassroomInput) {
  return {
    requirementPreview: input.requirement.substring(0, 100) + (input.requirement.length > 100 ? '...' : ''),
    language: input.language || 'zh-CN',
    hasPdf: !!input.pdfContent,
    pdfTextLength: input.pdfContent?.text?.length || 0,
    pdfImageCount: input.pdfContent?.images?.length || 0,
  };
}

export function isValidClassroomJobId(jobId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(jobId);
}

export async function createClassroomGenerationJob(
  jobId: string,
  input: GenerateClassroomInput,
): Promise<ClassroomGenerationJob> {
  const now = new Date();
  const job = await prisma.classroomJob.create({
    data: {
      id: jobId,
      status: 'queued',
      step: 'queued',
      progress: 0,
      message: 'Classroom generation job queued',
      inputSummary: buildInputSummary(input) as any,
      scenesGenerated: 0,
    },
  });

  return {
    id: job.id,
    status: job.status as ClassroomGenerationJobStatus,
    step: job.step as ClassroomGenerationStep | 'queued' | 'failed',
    progress: job.progress,
    message: job.message,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    inputSummary: job.inputSummary as any,
    scenesGenerated: job.scenesGenerated,
    totalScenes: job.totalScenes,
  };
}

export async function readClassroomGenerationJob(
  jobId: string,
): Promise<ClassroomGenerationJob | null> {
  const job = await prisma.classroomJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    status: job.status as ClassroomGenerationJobStatus,
    step: job.step as ClassroomGenerationStep | 'queued' | 'failed',
    progress: job.progress,
    message: job.message,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    inputSummary: job.inputSummary as any,
    scenesGenerated: job.scenesGenerated,
    totalScenes: job.totalScenes,
    result: job.result as any,
    error: job.error,
  };
}

export async function updateClassroomGenerationJob(
  jobId: string,
  updates: Partial<ClassroomGenerationJob>,
): Promise<ClassroomGenerationJob> {
  const data: any = {
    updatedAt: new Date(),
  };

  if (updates.status !== undefined) data.status = updates.status;
  if (updates.step !== undefined) data.step = updates.step;
  if (updates.progress !== undefined) data.progress = updates.progress;
  if (updates.message !== undefined) data.message = updates.message;
  if (updates.scenesGenerated !== undefined) data.scenesGenerated = updates.scenesGenerated;
  if (updates.totalScenes !== undefined) data.totalScenes = updates.totalScenes;
  if (updates.result !== undefined) data.result = updates.result;
  if (updates.error !== undefined) data.error = updates.error;

  const job = await prisma.classroomJob.update({
    where: { id: jobId },
    data,
  });

  return {
    id: job.id,
    status: job.status as ClassroomGenerationJobStatus,
    step: job.step as ClassroomGenerationStep | 'queued' | 'failed',
    progress: job.progress,
    message: job.message,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    inputSummary: job.inputSummary as any,
    scenesGenerated: job.scenesGenerated,
    totalScenes: job.totalScenes,
    result: job.result as any,
    error: job.error,
  };
}

export async function markClassroomGenerationJobRunning(
  jobId: string,
): Promise<ClassroomGenerationJob> {
  const job = await prisma.classroomJob.update({
    where: { id: jobId },
    data: {
      status: 'running',
      startedAt: new Date(),
      message: 'Classroom generation started',
      updatedAt: new Date(),
    },
  });

  return {
    id: job.id,
    status: job.status as ClassroomGenerationJobStatus,
    step: job.step as ClassroomGenerationStep | 'queued' | 'failed',
    progress: job.progress,
    message: job.message,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    inputSummary: job.inputSummary as any,
    scenesGenerated: job.scenesGenerated,
    totalScenes: job.totalScenes,
    result: job.result as any,
    error: job.error,
  };
}

export async function updateClassroomGenerationJobProgress(
  jobId: string,
  progress: ClassroomGenerationProgress,
): Promise<ClassroomGenerationJob> {
  return updateClassroomGenerationJob(jobId, {
    status: 'running',
    step: progress.step,
    progress: progress.progress,
    message: progress.message,
    scenesGenerated: progress.scenesGenerated,
    totalScenes: progress.totalScenes,
  });
}

export async function markClassroomGenerationJobSucceeded(
  jobId: string,
  result: GenerateClassroomResult,
): Promise<ClassroomGenerationJob> {
  const job = await prisma.classroomJob.update({
    where: { id: jobId },
    data: {
      status: 'succeeded',
      step: 'completed',
      progress: 100,
      message: 'Classroom generation completed successfully',
      completedAt: new Date(),
      updatedAt: new Date(),
      scenesGenerated: result.scenesCount,
      result: {
        classroomId: result.id,
        url: result.url,
        scenesCount: result.scenesCount,
      } as any,
    },
  });

  return {
    id: job.id,
    status: job.status as ClassroomGenerationJobStatus,
    step: job.step as ClassroomGenerationStep | 'queued' | 'failed',
    progress: job.progress,
    message: job.message,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    inputSummary: job.inputSummary as any,
    scenesGenerated: job.scenesGenerated,
    totalScenes: job.totalScenes,
    result: job.result as any,
    error: job.error,
  };
}

export async function markClassroomGenerationJobFailed(
  jobId: string,
  errorMessage: string,
): Promise<ClassroomGenerationJob> {
  const job = await prisma.classroomJob.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      step: 'failed',
      progress: 0,
      message: `Classroom generation failed: ${errorMessage}`,
      completedAt: new Date(),
      updatedAt: new Date(),
      error: errorMessage,
    },
  });

  return {
    id: job.id,
    status: job.status as ClassroomGenerationJobStatus,
    step: job.step as ClassroomGenerationStep | 'queued' | 'failed',
    progress: job.progress,
    message: job.message,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    inputSummary: job.inputSummary as any,
    scenesGenerated: job.scenesGenerated,
    totalScenes: job.totalScenes,
    result: job.result as any,
    error: job.error,
  };
}

export async function listClassroomGenerationJobs(
  limit: number = 100,
): Promise<ClassroomGenerationJob[]> {
  const jobs = await prisma.classroomJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return jobs.map(job => ({
    id: job.id,
    status: job.status as ClassroomGenerationJobStatus,
    step: job.step as ClassroomGenerationStep | 'queued' | 'failed',
    progress: job.progress,
    message: job.message,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
    inputSummary: job.inputSummary as any,
    scenesGenerated: job.scenesGenerated,
    totalScenes: job.totalScenes,
    result: job.result as any,
    error: job.error,
  }));
}
