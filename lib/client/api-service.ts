/**
 * Client API Service
 *
 * Provides methods to interact with the server API for loading/saving data
 * from the database instead of IndexedDB.
 */

import type { Stage, Scene } from '@/lib/types/stage';
import type { ChatSession } from '@/lib/types/chat';
import { createLogger } from '@/lib/logger';

const log = createLogger('ClientAPIService');

export interface StageStoreData {
  stage: Stage;
  scenes: Scene[];
  currentSceneId: string | null;
  chats: ChatSession[];
}

export interface StageListItem {
  id: string;
  name: string;
  description?: string;
  sceneCount: number;
  createdAt: number;
  updatedAt: number;
}

class ClientAPIService {
  /**
   * Load stage data from server API (database)
   */
  async loadStageFromAPI(stageId: string): Promise<StageStoreData | null> {
    try {
      const response = await fetch(`/api/classroom?id=${encodeURIComponent(stageId)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          log.info(`Stage not found in API: ${stageId}`);
          return null;
        }
        throw new Error(`Failed to load stage: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.classroom) {
        log.error('Invalid API response format');
        return null;
      }

      const { stage, scenes } = data.classroom;
      
      // Convert dates from ISO strings to timestamps
      const stageWithTimestamps = {
        ...stage,
        createdAt: new Date(stage.createdAt).getTime(),
        updatedAt: new Date(stage.updatedAt || stage.createdAt).getTime(),
      };

      const scenesWithTimestamps = scenes.map((scene: any) => ({
        ...scene,
        createdAt: scene.createdAt ? new Date(scene.createdAt).getTime() : Date.now(),
        updatedAt: scene.updatedAt ? new Date(scene.updatedAt).getTime() : Date.now(),
      }));

      return {
        stage: stageWithTimestamps,
        scenes: scenesWithTimestamps,
        currentSceneId: stage.currentSceneId || (scenes.length > 0 ? scenes[0].id : null),
        chats: [], // Chats will be loaded separately or from IndexedDB
      };
    } catch (error) {
      log.error('Failed to load stage from API:', error);
      throw error;
    }
  }

  /**
   * List all stages from server API
   */
  async listStagesFromAPI(): Promise<StageListItem[]> {
    try {
      const response = await fetch('/api/classrooms');
      
      if (!response.ok) {
        throw new Error(`Failed to list stages: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.classrooms)) {
        log.error('Invalid API response format');
        return [];
      }

      return data.classrooms.map((classroom: any) => ({
        id: classroom.id,
        name: classroom.name,
        description: classroom.description,
        sceneCount: classroom.sceneCount || 0,
        createdAt: new Date(classroom.createdAt).getTime(),
        updatedAt: new Date(classroom.updatedAt || classroom.createdAt).getTime(),
      }));
    } catch (error) {
      log.error('Failed to list stages from API:', error);
      return [];
    }
  }

  /**
   * Save stage data to server API (database)
   */
  async saveStageToAPI(stageId: string, data: StageStoreData): Promise<boolean> {
    try {
      const response = await fetch('/api/classroom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: data.stage,
          scenes: data.scenes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save stage: ${response.status}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      log.error('Failed to save stage to API:', error);
      return false;
    }
  }

  /**
   * Delete stage from server API
   */
  async deleteStageFromAPI(stageId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/classroom/${stageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete stage: ${response.status}`);
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      log.error('Failed to delete stage from API:', error);
      return false;
    }
  }
}

export const clientApiService = new ClientAPIService();
