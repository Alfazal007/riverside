import { v2 as cloudinary } from "cloudinary"
import path, { join } from "path"
import { readdir, rm } from 'fs/promises'
import fs from "fs"

cloudinary.config({
    cloud_name: 'itachivrnft',
    api_key: '131286585685619',
    api_secret: process.env.CLOUDINARY_SECRET!
})

export async function downloadVideo(requiredPublicIds: { publicId: string, timestamp: number }[], recordEventId: number): Promise<boolean> {
    try {
        let urls: string[] = []
        requiredPublicIds.forEach((publicId) => {
            let url = cloudinaryUrl(publicId.publicId)
            urls.push(url)
        })
        for (let i = 0; i < requiredPublicIds.length; i++) {
        }
        // get the timestamps of each publicid and while storing use the joined timestamp to store the downloaded video
        // download the video and store them into the downloads folder
        return true
    } catch (err) {
        return false
    } finally {
        await deleteDownloads()
    }
}

function cloudinaryUrl(publicId: string): string {
    const videoUrl = cloudinary.url(publicId, {
        resource_type: "video",
        format: "mp4",
        secure: true,
    })
    return videoUrl
}

async function deleteDownloads() {
    const folder = path.join(__dirname, "../downloads/")
    const files = await readdir(folder)
    await Promise.all(
        files.map(file => rm(join(folder, file), { recursive: true, force: true }))
    )
}

async function downloadEachFile(url: string, timestamp: number, joinId: number): Promise<boolean> {
    const filePath = path.join(__dirname, `../downloads/${joinId}_${timestamp}.mp4`);
    const res = await fetch(url);
    if (!res.ok) {
        return false
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return true
}

async function hitDbAndDownloadCall(url: string) { }
