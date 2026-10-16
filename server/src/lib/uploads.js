// server/src/lib/uploads.js
// Disk storage configuration for real user-uploaded files (Culture Locket
// voice recordings). Files are served statically from /uploads — see
// server/src/index.js.

import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join, extname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_UPLOADS_DIR = resolve(__dirname, '..', '..', 'uploads');
export const UPLOADS_DIR = process.env.UPLOADS_DIR ? resolve(process.env.UPLOADS_DIR) : DEFAULT_UPLOADS_DIR;
export const LOCKET_AUDIO_DIR = join(UPLOADS_DIR, 'locket');

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!existsSync(LOCKET_AUDIO_DIR)) {
  mkdirSync(LOCKET_AUDIO_DIR, { recursive: true });
}

console.log(`[Uploads] Storage → ${UPLOADS_DIR}`);

import fs from 'fs';

const ALLOWED_AUDIO_EXT = new Set(['.webm', '.ogg', '.mp4', '.mp3']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOCKET_AUDIO_DIR),
  filename: (_req, file, cb) => {
    let ext = extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_AUDIO_EXT.has(ext)) {
      const rawMime = (file.mimetype || '').split(';')[0].trim().toLowerCase();
      if (rawMime.includes('mp4') || rawMime.includes('m4a') || rawMime.includes('aac')) ext = '.mp4';
      else if (rawMime.includes('ogg')) ext = '.ogg';
      else if (rawMime.includes('mpeg') || rawMime.includes('mp3')) ext = '.mp3';
      else ext = '.webm';
    }
    // Strictly server-generated UUID filename
    cb(null, `${uuid()}${ext}`);
  },
});

export function validateAudioSignature(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);
    if (bytesRead < 4) return false;

    // WebM / EBML: 1A 45 DF A3
    if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) return true;
    // Ogg: 4F 67 67 53 ('OggS')
    if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) return true;
    // MP4 / M4A: bytes 4-7 are 'ftyp'
    if (bytesRead >= 8 && buffer.toString('utf8', 4, 8) === 'ftyp') return true;
    // MP3: ID3 tag or MPEG sync word (0xFFEx)
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
    if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) return true;
    // WAV: 'RIFF'
    if (bytesRead >= 4 && buffer.toString('utf8', 0, 4) === 'RIFF') return true;

    return false;
  } catch {
    return false;
  }
}

export const uploadLocketAudio = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (_req, file, cb) => {
    const rawMime = (file.mimetype || '').split(';')[0].trim().toLowerCase();
    const ext = extname(file.originalname || '').toLowerCase();

    const allowedMimes = new Set([
      'audio/webm',
      'video/webm',
      'audio/ogg',
      'application/ogg',
      'audio/mp4',
      'video/mp4',
      'audio/mpeg',
      'audio/mp3',
    ]);

    if (allowedMimes.has(rawMime) || ALLOWED_AUDIO_EXT.has(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only allowed audio formats are supported: webm, ogg, mp4, mpeg'));
  },
});

