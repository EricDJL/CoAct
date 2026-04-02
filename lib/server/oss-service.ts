import OSS from 'ali-oss';
import { createLogger } from '@/lib/logger';

const log = createLogger('OSS');

class OSSService {
  private client: OSS | null = null;
  private initialized = false;

  private init() {
    if (this.initialized && this.client) {
      return;
    }

    const { OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET } = process.env;

    if (!OSS_REGION || !OSS_ACCESS_KEY_ID || !OSS_ACCESS_KEY_SECRET || !OSS_BUCKET) {
      log.warn('OSS configuration missing, skipping OSS initialization');
      return;
    }

    try {
      this.client = new OSS({
        region: OSS_REGION,
        accessKeyId: OSS_ACCESS_KEY_ID,
        accessKeySecret: OSS_ACCESS_KEY_SECRET,
        bucket: OSS_BUCKET,
      });
      this.initialized = true;
      log.info('OSS client initialized successfully');
    } catch (error) {
      log.error('Failed to initialize OSS client:', error);
    }
  }

  async uploadFile(file: Buffer | string, filename: string, mimeType: string): Promise<{ url: string; ossKey: string }> {
    this.init();
    
    if (!this.client) {
      throw new Error('OSS client not initialized');
    }

    const prefix = process.env.OSS_PREFIX || 'coact-media';
    const ossKey = `${prefix}/${filename}`;

    try {
      const result = await this.client.put(ossKey, file, {
        headers: {
          'Content-Type': mimeType,
        },
      });

      log.info(`File uploaded to OSS: ${ossKey}`);
      return {
        url: result.url,
        ossKey,
      };
    } catch (error) {
      log.error(`Failed to upload file to OSS: ${filename}`, error);
      throw error;
    }
  }

  async downloadFile(ossKey: string): Promise<Buffer> {
    this.init();
    
    if (!this.client) {
      throw new Error('OSS client not initialized');
    }

    try {
      const result = await this.client.get(ossKey);
      return result.content;
    } catch (error) {
      log.error(`Failed to download file from OSS: ${ossKey}`, error);
      throw error;
    }
  }

  async deleteFile(ossKey: string): Promise<void> {
    this.init();
    
    if (!this.client) {
      throw new Error('OSS client not initialized');
    }

    try {
      await this.client.delete(ossKey);
      log.info(`File deleted from OSS: ${ossKey}`);
    } catch (error) {
      log.error(`Failed to delete file from OSS: ${ossKey}`, error);
      throw error;
    }
  }

  async exists(ossKey: string): Promise<boolean> {
    this.init();
    
    if (!this.client) {
      return false;
    }

    try {
      await this.client.head(ossKey);
      return true;
    } catch (error) {
      if ((error as any).code === 'NoSuchKey') {
        return false;
      }
      log.error(`Failed to check if file exists in OSS: ${ossKey}`, error);
      return false;
    }
  }
}

export const ossService = new OSSService();
