import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const bucketName = "kavana-files"; // ganti bucketmu
const bucket = storage.bucket(bucketName);

export const uploadFileGCS = (file, destinationPath) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject("File tidak ditemukan");

    const gcsFile = bucket.file(destinationPath);

    const stream = gcsFile.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
      gzip: true,
    });

    stream.on("error", (err) => reject(err));

    stream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;
      resolve(publicUrl);
    });

    stream.end(file.buffer);
  });
};
