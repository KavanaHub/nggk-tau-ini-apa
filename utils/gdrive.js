import { google } from "googleapis";
import { Readable } from "stream";

// Initialize Google Drive API
// Supports:
// 1. Application Default Credentials (ADC) - for Cloud Functions with service account
// 2. GOOGLE_CREDENTIALS env var (JSON string or base64)
// 3. Service account JSON file (for local development)

let auth;

if (process.env.GOOGLE_CREDENTIALS) {
  // Use credentials from environment variable (JSON string or base64)
  let credentials;
  try {
    // Try parsing as JSON first
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  } catch {
    // If not valid JSON, try decoding from base64
    try {
      const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS, "base64").toString("utf-8");
      credentials = JSON.parse(decoded);
    } catch {
      throw new Error("GOOGLE_CREDENTIALS is not valid JSON or base64 encoded JSON");
    }
  }
  
  auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
} else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  // Local development: Use key file path
  auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
} else if (process.env.K_SERVICE || process.env.FUNCTION_NAME) {
  // Running on Cloud Functions/Cloud Run - use Application Default Credentials
  auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
} else {
  // Fallback: Try default service account file for local dev
  auth = new google.auth.GoogleAuth({
    keyFile: "./service-account.json",
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
}

const drive = google.drive({ version: "v3", auth });

// Folder ID where files will be uploaded (create a folder in Google Drive and get its ID)
const FOLDER_IDS = {
  proposals: process.env.GDRIVE_FOLDER_PROPOSALS || "",
  reports: process.env.GDRIVE_FOLDER_REPORTS || "",
  profiles: process.env.GDRIVE_FOLDER_PROFILES || "",
  bimbingan: process.env.GDRIVE_FOLDER_BIMBINGAN || "",
  default: process.env.GDRIVE_FOLDER_DEFAULT || "",
};

/**
 * Get folder ID based on file path
 */
const getFolderId = (customPath) => {
  if (customPath.startsWith("proposals/")) return FOLDER_IDS.proposals;
  if (customPath.startsWith("reports/")) return FOLDER_IDS.reports;
  if (customPath.startsWith("profile/")) return FOLDER_IDS.profiles;
  if (customPath.startsWith("bimbingan/")) return FOLDER_IDS.bimbingan;
  return FOLDER_IDS.default;
};

/**
 * Convert buffer to readable stream
 */
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
};

/**
 * Upload file to Google Drive
 * @param {Object} file - Multer file object with buffer, mimetype, originalname
 * @param {string} customPath - Custom path/name for the file
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export const uploadToGDrive = async (file, customPath) => {
  if (!file) {
    throw new Error("No file uploaded");
  }

  const folderId = getFolderId(customPath);
  if (!folderId) {
    throw new Error(
      "Missing Google Drive folder ID env vars. Set GDRIVE_FOLDER_PROPOSALS / REPORTS / PROFILES / BIMBINGAN / DEFAULT to Shared Drive folder IDs and redeploy."
    );
  }
  const fileName = customPath.split("/").pop() || `${Date.now()}-${file.originalname}`;

  console.log("Upload to GDrive:", { fileName, folderId, mimeType: file.mimetype });

  try {
    // Create file metadata
    const fileMetadata = {
      name: fileName,
      ...(folderId && { parents: [folderId] }),
    };

    // Create media object
    const media = {
      mimeType: file.mimetype,
      body: bufferToStream(file.buffer),
    };

    console.log("Creating file in Google Drive...");

    // Upload file with supportsAllDrives for shared folders
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink, webContentLink",
      supportsAllDrives: true,
    });

    const fileId = response.data.id;
    console.log("File created with ID:", fileId);

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
      supportsAllDrives: true,
    });

    console.log("Permissions set to public");

    // Get the public link
    // webViewLink = view in browser, webContentLink = direct download
    // For images/PDFs, use a direct link format
    const publicUrl = `https://drive.google.com/uc?id=${fileId}&export=view`;

    return publicUrl;
  } catch (error) {
    console.error("Google Drive upload error:", error);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
};

/**
 * Delete file from Google Drive
 * @param {string} fileUrl - The Google Drive URL of the file
 */
export const deleteFromGDrive = async (fileUrl) => {
  try {
    // Extract file ID from URL
    const match = fileUrl.match(/id=([^&]+)/);
    if (!match) {
      throw new Error("Invalid Google Drive URL");
    }
    
    const fileId = match[1];
    await drive.files.delete({ fileId });
    
    return true;
  } catch (error) {
    console.error("Google Drive delete error:", error);
    throw new Error(`Failed to delete from Google Drive: ${error.message}`);
  }
};

/**
 * Get file info from Google Drive
 * @param {string} fileId - The Google Drive file ID
 */
export const getFileInfo = async (fileId) => {
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: "id, name, mimeType, size, webViewLink, webContentLink",
    });
    
    return response.data;
  } catch (error) {
    console.error("Google Drive get file error:", error);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

export default {
  uploadToGDrive,
  deleteFromGDrive,
  getFileInfo,
};
