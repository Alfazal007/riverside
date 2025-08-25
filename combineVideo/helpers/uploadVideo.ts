import { v2 as cloudinary } from "cloudinary";
import crypto from 'crypto';
import fetch from "node-fetch";
import path from "path";

cloudinary.config({
    cloud_name: 'itachivrnft',
    api_key: '131286585685619',
    api_secret: process.env.CLOUDINARY_SECRET!
})

export async function uploadVideoToCloudinary(meetId: number, recordingId: number): Promise<boolean> {
    try {
        const timestamp = Math.round(Date.now() / 1000);
        const params = {
            public_id: 'riverside/complete/' + meetId + "/" + recordingId,
            timestamp: timestamp.toString(),
        };
        const signature = generateSignature(params.timestamp, params.public_id, cloudinary.config().api_secret!);
        const formData = new FormData();
        let filePath = path.join(__dirname, "../downloads/combined_output.mp4")
        const file = Bun.file(filePath);
        formData.append('file', file);
        formData.append('api_key', cloudinary.config().api_key!);
        formData.append('timestamp', params.timestamp);
        formData.append('signature', signature);
        formData.append('public_id', params.public_id);
        formData.append('resource_type', 'video');
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinary.config().cloud_name}/video/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        if (!response.ok) {
            return false
        }
        return true;
    } catch (err) {
        console.log({ err })
        return false
    }
}

function generateSignature(timestamp: string, publicId: string, apiSecret: string): string {
    let stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto
        .createHash('sha1')
        .update(stringToSign)
        .digest('hex');
    return signature;
}
