// server/src/lib/uploads.js
// Disk storage configuration for real user-uploaded files (Culture Locket
// voice recordings). Files are served statically from /uploads — see
// server/src/index.js.

import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');
export const LOCKET_AUDIO_DIR = join(UPLOADS_DIR, 'locket');

if (!existsSync(LOCKET_AUDIO_DIR)) {
  mkdirSync(LOCKET_AUDIO_DIR, { recursive: true });
}

const ALLOWED_AUDIO_EXT = new Set(['.webm', '.ogg', '.mp4', '.m4a', '.mp3', '.wav', '.aac']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOCKET_AUDIO_DIR),
  filename: (_req, file, cb) => {
    let ext = extname(file.originalname || '').toLowerCase();
    if (!ext || ext === '.') {
      const rawMime = (file.mimetype || '').split(';')[0].trim().toLowerCase();
      if (rawMime.includes('mp4') || rawMime.includes('m4a') || rawMime.includes('aac')) ext = '.m4a';
      else if (rawMime.includes('ogg')) ext = '.ogg';
      else if (rawMime.includes('wav')) ext = '.wav';
      else if (rawMime.includes('mpeg') || rawMime.includes('mp3')) ext = '.mp3';
      else ext = '.webm';
    }
    cb(null, `${uuid()}${ext}`);
  },
});

export const uploadLocketAudio = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — up to several minutes of compressed voice audio
  fileFilter: (_req, file, cb) => {
    const rawMime = (file.mimetype || '').split(';')[0].trim().toLowerCase();
    const ext = extname(file.originalname || '').toLowerCase();

    if (
      rawMime.startsWith('audio/') ||
      rawMime === 'video/webm' ||
      rawMime === 'video/mp4' ||
      rawMime === 'application/ogg' ||
      rawMime === 'application/octet-stream' ||
      ALLOWED_AUDIO_EXT.has(ext)
    ) {
      return cb(null, true);
    }
    cb(new Error('Only audio recordings (webm/ogg/mp4/m4a/mpeg/wav/aac) are allowed'));
  },
});

