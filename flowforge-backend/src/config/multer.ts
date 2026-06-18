import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/csv",
  "application/zip",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// Production: use memory storage (pipe to S3/R2/Cloudinary yourself)
// Development: use disk storage in local uploads/ folder
const getStorage = () => {
  if (process.env.NODE_ENV === "production") {
    return multer.memoryStorage();
  }

  const UPLOAD_DIR = path.resolve("uploads");
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });
};

export const upload = multer({
  storage: getStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});