"use strict";

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

// Base directory for screenshot storage (configurable via env)
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || "./data/screenshots";

/**
 * Ensure the screenshot storage directory exists
 * Creates the directory structure if missing
 */
async function ensureScreenshotDirExists() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw new Error(`Failed to create screenshot directory: ${error.message}`);
    }
  }
}

/**
 * Generate a unique filename for an uploaded screenshot
 * @param {string} originalFilename - The original filename from upload
 * @returns {string} Unique filename with timestamp and random string
 */
function generateUniqueFilename(originalFilename) {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const ext = path.extname(originalFilename) || ".png";
  return `screenshot_${timestamp}_${randomString}${ext}`;
}

/**
 * Save an uploaded screenshot to disk
 * @param {Buffer} fileBuffer - The file data as a buffer
 * @param {string} originalFilename - Original filename
 * @returns {Promise<{storagePath: string}>} The storage path where file was saved
 */
async function saveUploadedScreenshot(fileBuffer, originalFilename) {
  // Ensure directory exists
  await ensureScreenshotDirExists();

  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(originalFilename);
  const storagePath = path.join(SCREENSHOT_DIR, uniqueFilename);

  // Write file to disk
  await fs.writeFile(storagePath, fileBuffer);

  return { storagePath };
}

/**
 * Get the absolute path to a screenshot file
 * @param {string} storagePath - Relative or absolute storage path
 * @returns {string} Absolute path to the file
 */
function getAbsolutePath(storagePath) {
  if (path.isAbsolute(storagePath)) {
    return storagePath;
  }
  return path.resolve(process.cwd(), storagePath);
}

/**
 * Check if a screenshot file exists
 * @param {string} storagePath - Path to the screenshot file
 * @returns {Promise<boolean>} True if file exists, false otherwise
 */
async function fileExists(storagePath) {
  try {
    await fs.access(getAbsolutePath(storagePath));
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  SCREENSHOT_DIR,
  ensureScreenshotDirExists,
  saveUploadedScreenshot,
  getAbsolutePath,
  fileExists,
};
