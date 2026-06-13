"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBase64ToBlob = uploadBase64ToBlob;
const blob_1 = require("@vercel/blob");
/**
 * Intercepts Base64 image data and uploads it to Vercel Blob.
 * If token is missing, falls back to raw Base64 database storage.
 */
async function uploadBase64ToBlob(base64DataUrl, backlogNo, photoType) {
    // If the input is not a base64 data URL, return as-is (e.g. if it is already a URL)
    if (!base64DataUrl || !base64DataUrl.startsWith('data:')) {
        return base64DataUrl;
    }
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
        console.warn('[Vercel Blob] BLOB_READ_WRITE_TOKEN is not configured. Falling back to storing Base64 in database.');
        return base64DataUrl;
    }
    try {
        const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
            return base64DataUrl;
        }
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        // Extract file extension from mime type
        let ext = 'jpg';
        if (mimeType === 'image/png')
            ext = 'png';
        else if (mimeType === 'image/webp')
            ext = 'webp';
        else if (mimeType === 'image/gif')
            ext = 'gif';
        const cleanBacklogNo = backlogNo.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const filename = `photos/bms-${cleanBacklogNo}-${photoType.toLowerCase()}-${Date.now()}.${ext}`;
        console.log(`[Vercel Blob] Uploading ${filename} (${buffer.length} bytes)...`);
        const blob = await (0, blob_1.put)(filename, buffer, {
            access: 'public',
            contentType: mimeType,
            token,
        });
        console.log(`[Vercel Blob] Uploaded successfully: ${blob.url}`);
        return blob.url;
    }
    catch (error) {
        console.error('[Vercel Blob] Upload failed:', error);
        return base64DataUrl; // Fallback to storing original base64
    }
}
