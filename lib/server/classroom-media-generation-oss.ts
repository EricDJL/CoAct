/**
 * Server-side media and TTS generation for classrooms with OSS storage.
 *
 * Generates image/video files and TTS audio for a classroom,
 * uploads them to Aliyun OSS, and returns serving URL mappings.
 */

import { nanoid } from 'nanoid';
import { createLogger } from '@/lib/logger';
import { generateImage } from '@/lib/media/image-providers';
import { generateVideo, normalizeVideoOptions } from '@/lib/media/video-providers';
import { generateTTS } from '@/lib/audio/tts-providers';
import { DEFAULT_TTS_VOICES, DEFAULT_TTS_MODELS, TTS_PROVIDERS } from '@/lib/audio/constants';
import { IMAGE_PROVIDERS } from '@/lib/media/image-providers';
import { VIDEO_PROVIDERS } from '@/lib/media/video-providers';
import { isMediaPlaceholder } from '@/lib/store/media-generation';
import {
  getServerImageProviders,
  getServerVideoProviders,
  getServerTTSProviders,
  resolveImageApiKey,
  resolveImageBaseUrl,
  resolveVideoApiKey,
  resolveVideoBaseUrl,
  resolveTTSApiKey,
  resolveTTSBaseUrl,
} from '@/lib/server/provider-config';
import { ossService } from '@/lib/server/oss-service';
import prisma from '@/lib/server/db';
import type { SceneOutline } from '@/lib/types/generation';
import type { Scene } from '@/lib/types/stage';
import type { SpeechAction } from '@/lib/types/action';
import type { ImageProviderId } from '@/lib/media/types';
import type { VideoProviderId } from '@/lib/media/types';
import type { TTSProviderId } from '@/lib/audio/types';
import { splitLongSpeechActions } from '@/lib/audio/tts-utils';

const log = createLogger('ClassroomMediaOSS');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function downloadToBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function getOSSFilename(classroomId: string, elementId: string, ext: string): string {
  return `${classroomId}/media/${elementId}.${ext}`;
}

function getOSSAudioFilename(classroomId: string, audioId: string, format: string): string {
  return `${classroomId}/audio/${audioId}.${format}`;
}

// ---------------------------------------------------------------------------
// Image / Video generation with OSS storage
// ---------------------------------------------------------------------------

export async function generateMediaForClassroom(
  outlines: SceneOutline[],
  classroomId: string,
): Promise<Record<string, string>> {
  // Collect all media generation requests from outlines
  const requests = outlines.flatMap((o) => o.mediaGenerations ?? []);
  if (requests.length === 0) return {};

  // Resolve providers
  const imageProviderIds = Object.keys(getServerImageProviders());
  const videoProviderIds = Object.keys(getServerVideoProviders());

  const mediaMap: Record<string, string> = {};

  // Separate image and video requests, generate each type sequentially
  // but run the two types in parallel (providers often have limited concurrency).
  const imageRequests = requests.filter((r) => r.type === 'image' && imageProviderIds.length > 0);
  const videoRequests = requests.filter((r) => r.type === 'video' && videoProviderIds.length > 0);

  const generateImages = async () => {
    for (const req of imageRequests) {
      try {
        const providerId = imageProviderIds[0] as ImageProviderId;
        const apiKey = resolveImageApiKey(providerId);
        if (!apiKey) {
          log.warn(`No API key for image provider "${providerId}", skipping ${req.elementId}`);
          continue;
        }
        const providerConfig = IMAGE_PROVIDERS[providerId];
        const model = providerConfig?.models?.[0]?.id;

        const result = await generateImage(
          { providerId, apiKey, baseUrl: resolveImageBaseUrl(providerId), model },
          { prompt: req.prompt, aspectRatio: req.aspectRatio || '16:9' },
        );

        let buf: Buffer;
        let ext: string;
        if (result.base64) {
          buf = Buffer.from(result.base64, 'base64');
          ext = 'png';
        } else if (result.url) {
          buf = await downloadToBuffer(result.url);
          const urlExt = new URL(result.url).pathname.split('.').pop() || 'png';
          ext = ['png', 'jpg', 'jpeg', 'webp'].includes(urlExt.toLowerCase()) ? urlExt : 'png';
        } else {
          log.warn(`Image generation returned no data for ${req.elementId}`);
          continue;
        }

        const filename = getOSSFilename(classroomId, req.elementId, ext);
        const { url, ossKey } = await ossService.uploadFile(buf, filename, `image/${ext}`);
        
        // Save to database
        await prisma.imageFile.create({
          data: {
            stageId: classroomId,
            filename: `${req.elementId}.${ext}`,
            url,
            ossKey,
            mimeType: `image/${ext}`,
            size: buf.length,
          },
        });

        mediaMap[req.elementId] = url;
        log.info(`Generated image uploaded to OSS: ${filename}`);
      } catch (err) {
        log.warn(`Image generation failed for ${req.elementId}:`, err);
      }
    }
  };

  const generateVideos = async () => {
    for (const req of videoRequests) {
      try {
        const providerId = videoProviderIds[0] as VideoProviderId;
        const apiKey = resolveVideoApiKey(providerId);
        if (!apiKey) {
          log.warn(`No API key for video provider "${providerId}", skipping ${req.elementId}`);
          continue;
        }
        const providerConfig = VIDEO_PROVIDERS[providerId];
        const model = providerConfig?.models?.[0]?.id;

        const normalized = normalizeVideoOptions(providerId, {
          prompt: req.prompt,
          aspectRatio: (req.aspectRatio as '16:9' | '4:3' | '1:1' | '9:16') || '16:9',
        });

        const result = await generateVideo(
          { providerId, apiKey, baseUrl: resolveVideoBaseUrl(providerId), model },
          normalized,
        );

        const buf = await downloadToBuffer(result.url);
        const filename = getOSSFilename(classroomId, req.elementId, 'mp4');
        const { url, ossKey } = await ossService.uploadFile(buf, filename, 'video/mp4');
        
        // Save to database
        await prisma.mediaFile.create({
          data: {
            stageId: classroomId,
            type: 'video',
            filename: `${req.elementId}.mp4`,
            url,
            ossKey,
            mimeType: 'video/mp4',
            size: buf.length,
          },
        });

        mediaMap[req.elementId] = url;
        log.info(`Generated video uploaded to OSS: ${filename}`);
      } catch (err) {
        log.warn(`Video generation failed for ${req.elementId}:`, err);
      }
    }
  };

  await Promise.all([generateImages(), generateVideos()]);

  return mediaMap;
}

// ---------------------------------------------------------------------------
// Placeholder replacement in scene content
// ---------------------------------------------------------------------------

export function replaceMediaPlaceholders(scenes: Scene[], mediaMap: Record<string, string>): void {
  if (Object.keys(mediaMap).length === 0) return;

  for (const scene of scenes) {
    if (scene.type !== 'slide') continue;
    const canvas = (
      scene.content as {
        canvas?: { elements?: Array<{ id: string; src?: string; type?: string }> };
      }
    )?.canvas;
    if (!canvas?.elements) continue;

    for (const el of canvas.elements) {
      if (
        (el.type === 'image' || el.type === 'video') &&
        typeof el.src === 'string' &&
        isMediaPlaceholder(el.src) &&
        mediaMap[el.src]
      ) {
        el.src = mediaMap[el.src];
      }
    }
  }
}

// ---------------------------------------------------------------------------
// TTS generation with OSS storage
// ---------------------------------------------------------------------------

export async function generateTTSForClassroom(
  scenes: Scene[],
  classroomId: string,
): Promise<void> {
  const ttsProviderIds = Object.keys(getServerTTSProviders());
  if (ttsProviderIds.length === 0) return;

  const providerId = ttsProviderIds[0] as TTSProviderId;
  const apiKey = resolveTTSApiKey(providerId);
  if (!apiKey) {
    log.warn(`No API key for TTS provider "${providerId}", skipping TTS generation`);
    return;
  }

  const voice = DEFAULT_TTS_VOICES[providerId];
  const ttsBaseUrl = resolveTTSBaseUrl(providerId);

  for (const scene of scenes) {
    if (!scene.content?.actions) continue;

    for (const action of scene.content.actions) {
      if (action.type !== 'speech') continue;

      const speechAction = action as SpeechAction;
      if (!speechAction.text) continue;

      const splitActions = splitLongSpeechActions(speechAction);
      for (const splitAction of splitActions) {
        const audioId = `tts_${splitAction.id}`;
        const format = TTS_PROVIDERS[providerId]?.format || 'mp3';

        try {
          const result = await generateTTS(
            {
              providerId,
              modelId: DEFAULT_TTS_MODELS[providerId] || '',
              apiKey,
              baseUrl: ttsBaseUrl,
              voice,
              speed: splitAction.speed,
            },
            splitAction.text,
          );

          const filename = getOSSAudioFilename(classroomId, audioId, format);
          const audioBuffer = Buffer.from(result.audio);
          const { url, ossKey } = await ossService.uploadFile(audioBuffer, filename, `audio/${format}`);
          
          // Save to database
          await prisma.audioFile.create({
            data: {
              stageId: classroomId,
              filename: `${audioId}.${format}`,
              url,
              ossKey,
              mimeType: `audio/${format}`,
              size: result.audio.length,
              duration: result.duration,
            },
          });

          splitAction.audioId = audioId;
          splitAction.audioUrl = url;
          log.info(`Generated TTS uploaded to OSS: ${filename} (${result.audio.length} bytes)`);
        } catch (err) {
          log.warn(`TTS generation failed for action ${splitAction.id}:`, err);
        }
      }
    }
  }
}
