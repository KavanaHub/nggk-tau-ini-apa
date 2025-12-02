import multer from "multer";
import Busboy from "busboy";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
});

/**
 * Custom file upload middleware for Cloud Functions
 * Handles multipart/form-data parsing manually when multer fails
 */
export const parseMultipart = (req, res, next) => {
  // If file already parsed by multer, skip
  if (req.file) {
    return next();
  }

  // Check if this is multipart
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  const busboy = Busboy({ headers: req.headers });
  const fields = {};
  let fileData = null;

  busboy.on('file', (fieldname, file, info) => {
    const { filename, mimeType } = info;
    const chunks = [];

    file.on('data', (data) => {
      chunks.push(data);
    });

    file.on('end', () => {
      fileData = {
        fieldname,
        originalname: filename,
        mimetype: mimeType,
        buffer: Buffer.concat(chunks),
        size: Buffer.concat(chunks).length
      };
    });
  });

  busboy.on('field', (fieldname, val) => {
    fields[fieldname] = val;
  });

  busboy.on('finish', () => {
    req.file = fileData;
    req.body = { ...req.body, ...fields };
    next();
  });

  busboy.on('error', (err) => {
    console.error('Busboy error:', err);
    next(err);
  });

  // Use rawBody if available (Cloud Functions), otherwise pipe request
  if (req.rawBody) {
    busboy.end(req.rawBody);
  } else {
    req.pipe(busboy);
  }
};
