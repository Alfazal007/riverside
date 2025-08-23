import { v2 as cloudinary } from "cloudinary";
import crypto from 'crypto';
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import fetch from "node-fetch";
import { readdir, rm } from 'fs/promises';
import { join } from 'path';

const TEMP_DIR = path.join(process.cwd(), "chunks");
const COMBINED_FILE = path.join(process.cwd(), "combined.webm");
const FINAL_FILE = path.join(process.cwd(), "output.webm");

cloudinary.config({
    cloud_name: 'itachivrnft',
    api_key: '131286585685619',
    api_secret: process.env.CLOUDINARY_SECRET!
})

async function getChunks(folderName: string) {
    const result = await cloudinary.api.resources({
        resource_type: "raw",
        type: "upload",
        prefix: folderName + "/",
        max_results: 500
    });
    const sorted = result.resources.sort((a: any, b: any) => {
        const numA = parseInt(a.public_id.match(/\d+/)?.[0] || 0, 10);
        const numB = parseInt(b.public_id.match(/\d+/)?.[0] || 0, 10);
        return numA - numB;
    });
    return sorted;
}

async function downloadChunks(resources: any) {
    for (let i = 0; i < resources.length; i++) {
        const url = resources[i].secure_url;
        const filePath = path.join(TEMP_DIR, `chunk_${i}.webm`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to download ${url}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
    }
}

function concatChunks(resources: any) {
    const files = resources.map((_: any, i: any) =>
        path.join(TEMP_DIR, `chunk_${i}.webm`)
    );
    const writeStream = fs.createWriteStream(COMBINED_FILE);
    files.forEach((file: any) => {
        const data = fs.readFileSync(file);
        writeStream.write(data);
    });
    writeStream.end();
}

function finalizeWithFFmpeg() {
    try {
        execSync(
            `ffmpeg -y -i ${COMBINED_FILE} -c:v libx264 -preset fast -crf 23 -c:a aac ${FINAL_FILE.replace(".webm", ".mp4")}`,
            { stdio: "inherit" }
        );
    } catch (err) {
        console.error("❌ ffmpeg failed:", err);
    }
}

async function uploadVideoToCloudinary(publicId: string) {
    try {
        const timestamp = Math.round(Date.now() / 1000);
        const params = {
            public_id: publicId + '/output',
            timestamp: timestamp.toString(),
        };
        const signature = generateSignature(params.timestamp, params.public_id, cloudinary.config().api_secret!);
        const formData = new FormData();
        const file = Bun.file("./output.mp4");
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
        const result = await response.json();
        if (!response.ok) {
            // @ts-ignore
            throw new Error(result.error?.message);
        }
        return result;
    } catch (err) {
        throw err;
    }
}

export async function downloadAndCombineVideo(folderName: string): Promise<boolean> {
    try {
        const chunks = await getChunks(folderName);
        await downloadChunks(chunks);
        concatChunks(chunks);
        finalizeWithFFmpeg();
        await uploadVideoToCloudinary(folderName)
        return true
    } catch (err) {
        return false
    } finally {
        const folder = "./chunks/"
        const files = await readdir(folder);
        await Promise.all(
            files.map(file => rm(join(folder, file), { recursive: true, force: true }))
        );
        rm(join("./combined.webm"))
        rm(join("./output.mp4"))
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
