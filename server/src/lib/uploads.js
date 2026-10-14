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

const ALLOWED_AUDIO_MIME = new Set([
  'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOCKET_AUDIO_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname) || '.webm';
    cb(null, `${uuid()}${ext}`);
  },
});

export const uploadLocketAudio = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — a few seconds of compressed voice audio
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AUDIO_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only audio recordings (webm/ogg/mp4/mpeg/wav) are allowed'));
  },
});
