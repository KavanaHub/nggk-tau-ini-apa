import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: "renzip-478811",
});

const bucketName = process.env.GCS_BUCKET_NAME || "kavana-files";
const bucket = storage.bucket(bucketName);

export const uploadToGCS = (file, customPath) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject("No file uploaded");
      return;
    }

    const gcsFileName =
      customPath || `uploads/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(gcsFileName);

    const stream = fileUpload.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
      gzip: true
    });

    stream.on("error", (err) => {
      reject(err);
    });

    stream.on("finish", async () => {
      // Make file publicly accessible
      try {
        await fileUpload.makePublic();
      } catch (err) {
        console.log("Warning: Could not make file public:", err.message);
      }
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
      resolve(publicUrl);
    });

    stream.end(file.buffer);
  });
};
