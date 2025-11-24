import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: "renzip-478811",
});

const bucketName = "kavana-files"; // ganti dengan bucket kamu
const bucket = storage.bucket(bucketName);

export const uploadToGCS = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject("No file uploaded");
      return;
    }

    const gcsFileName = `uploads/${Date.now()}-${file.originalname}`;
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
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
      resolve(publicUrl);
    });

    stream.end(file.buffer);
  });
};
