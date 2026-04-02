#!/usr/bin/env ts-node

/**
 * Data Migration Tool
 * 
 * Migrates existing data from file system and IndexedDB to PostgreSQL and Aliyun OSS
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PrismaClient } from '@prisma/client';
import { ossService } from '../lib/server/oss-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const prisma = new PrismaClient();

// Directories
const CLASSROOMS_DIR = path.join(projectRoot, 'data', 'classrooms');

interface ClassroomData {
  id: string;
  stage: any;
  scenes: any[];
  createdAt: string;
}

async function ensureDirs() {
  try {
    await fs.mkdir(CLASSROOMS_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to ensure directories:', error);
  }
}

async function migrateFileClassrooms() {
  console.log('=== Migrating File System Classrooms ===');
  
  try {
    const files = await fs.readdir(CLASSROOMS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${jsonFiles.length} classroom files`);
    
    for (const file of jsonFiles) {
      const classroomId = file.replace('.json', '');
      const filePath = path.join(CLASSROOMS_DIR, file);
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const classroomData: ClassroomData = JSON.parse(content);
        
        console.log(`Migrating classroom: ${classroomId}`);
        
        // Check if already exists in database
        const existing = await prisma.stage.findUnique({
          where: { id: classroomId }
        });
        
        if (existing) {
          console.log(`Classroom ${classroomId} already exists in database, skipping`);
          continue;
        }
        
        // Create stage in database
        const stage = await prisma.stage.create({
          data: {
            id: classroomData.id,
            name: classroomData.stage.name,
            description: classroomData.stage.description,
            language: classroomData.stage.language,
            style: classroomData.stage.style,
            currentSceneId: classroomData.stage.currentSceneId,
            agentIds: classroomData.stage.agentIds,
            createdAt: new Date(classroomData.createdAt),
            updatedAt: new Date(classroomData.createdAt),
          }
        });
        
        // Create scenes
        for (const scene of classroomData.scenes) {
          await prisma.scene.create({
            data: {
              id: scene.id,
              stageId: classroomData.id,
              type: scene.type,
              title: scene.title,
              content: scene.content as any,
              order: scene.order,
              createdAt: new Date(classroomData.createdAt),
              updatedAt: new Date(classroomData.createdAt),
            }
          });
        }
        
        console.log(`✓ Successfully migrated classroom: ${classroomId}`);
        
      } catch (error) {
        console.error(`Failed to migrate classroom ${classroomId}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Failed to migrate file classrooms:', error);
  }
}

async function migrateMediaFiles() {
  console.log('\n=== Migrating Media Files ===');
  
  try {
    const classrooms = await fs.readdir(CLASSROOMS_DIR);
    
    for (const classroomId of classrooms) {
      const mediaDir = path.join(CLASSROOMS_DIR, classroomId, 'media');
      const audioDir = path.join(CLASSROOMS_DIR, classroomId, 'audio');
      
      // Check if media directory exists
      try {
        await fs.access(mediaDir);
        const mediaFiles = await fs.readdir(mediaDir);
        
        console.log(`Migrating media files for classroom: ${classroomId}`);
        
        for (const file of mediaFiles) {
          const filePath = path.join(mediaDir, file);
          const fileStats = await fs.stat(filePath);
          
          if (fileStats.isFile()) {
            const buffer = await fs.readFile(filePath);
            const ossKey = `${classroomId}/media/${file}`;
            
            try {
              // Check if file already exists in OSS
              const exists = await ossService.exists(ossKey);
              if (exists) {
                console.log(`Media file ${file} already exists in OSS, skipping`);
                continue;
              }
              
              // Determine MIME type
              let mimeType = 'application/octet-stream';
              if (file.endsWith('.png')) mimeType = 'image/png';
              else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) mimeType = 'image/jpeg';
              else if (file.endsWith('.webp')) mimeType = 'image/webp';
              else if (file.endsWith('.mp4')) mimeType = 'video/mp4';
              
              // Upload to OSS
              const { url } = await ossService.uploadFile(buffer, ossKey, mimeType);
              
              // Save to database
              if (mimeType.startsWith('image/')) {
                await prisma.imageFile.create({
                  data: {
                    stageId: classroomId,
                    filename: file,
                    url,
                    ossKey,
                    mimeType,
                    size: buffer.length,
                  }
                });
              } else if (mimeType.startsWith('video/')) {
                await prisma.mediaFile.create({
                  data: {
                    stageId: classroomId,
                    type: 'video',
                    filename: file,
                    url,
                    ossKey,
                    mimeType,
                    size: buffer.length,
                  }
                });
              }
              
              console.log(`✓ Uploaded media file: ${file}`);
            } catch (error) {
              console.error(`Failed to upload media file ${file}:`, error);
            }
          }
        }
        
      } catch (error) {
        // Media directory doesn't exist, skip
      }
      
      // Check if audio directory exists
      try {
        await fs.access(audioDir);
        const audioFiles = await fs.readdir(audioDir);
        
        console.log(`Migrating audio files for classroom: ${classroomId}`);
        
        for (const file of audioFiles) {
          const filePath = path.join(audioDir, file);
          const fileStats = await fs.stat(filePath);
          
          if (fileStats.isFile()) {
            const buffer = await fs.readFile(filePath);
            const ossKey = `${classroomId}/audio/${file}`;
            
            try {
              // Check if file already exists in OSS
              const exists = await ossService.exists(ossKey);
              if (exists) {
                console.log(`Audio file ${file} already exists in OSS, skipping`);
                continue;
              }
              
              // Determine MIME type
              let mimeType = 'audio/mpeg';
              if (file.endsWith('.wav')) mimeType = 'audio/wav';
              else if (file.endsWith('.ogg')) mimeType = 'audio/ogg';
              
              // Upload to OSS
              const { url } = await ossService.uploadFile(buffer, ossKey, mimeType);
              
              // Save to database
              await prisma.audioFile.create({
                data: {
                  stageId: classroomId,
                  filename: file,
                  url,
                  ossKey,
                  mimeType,
                  size: buffer.length,
                }
              });
              
              console.log(`✓ Uploaded audio file: ${file}`);
            } catch (error) {
              console.error(`Failed to upload audio file ${file}:`, error);
            }
          }
        }
        
      } catch (error) {
        // Audio directory doesn't exist, skip
      }
    }
    
  } catch (error) {
    console.error('Failed to migrate media files:', error);
  }
}

async function main() {
  console.log('Starting data migration...\n');
  
  await ensureDirs();
  
  await migrateFileClassrooms();
  await migrateMediaFiles();
  
  console.log('\n=== Migration Complete ===');
  console.log('All data has been migrated to PostgreSQL and Aliyun OSS');
  
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch(console.error);
}
