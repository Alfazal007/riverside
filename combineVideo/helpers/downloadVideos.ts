import { v2 as cloudinary } from "cloudinary"
import path, { join } from "path"
import { readdir, rm } from 'fs/promises'
import { finalCombiner } from "./finalCombiner"

cloudinary.config({
    cloud_name: 'itachivrnft',
    api_key: '131286585685619',
    api_secret: process.env.CLOUDINARY_SECRET!
})

export async function downloadVideo(requiredPublicIds: { publicId: string, timestamp: number, joinId: number }[]): Promise<boolean> {
    try {
        let urls: string[] = []
        for (let i = 0; i < requiredPublicIds.length; i++) {
            let publicIdData = requiredPublicIds[i]
            if (!publicIdData) {
                return false
            }
            let url = cloudinaryUrl(publicIdData.publicId)
            urls.push(url)
        }
        for (let i = 0; i < requiredPublicIds.length; i++) {
            let urlCurrent = urls[i] as string
            let timestampCurrent = requiredPublicIds[i]?.timestamp as number
            let joinIdCurrent = requiredPublicIds[i]?.joinId as number
            let res = await downloadEachFile(urlCurrent, timestampCurrent, joinIdCurrent)
            if (!res) {
                return false
            }
        }
        const combineResult = await finalCombiner()
        return combineResult
    } catch (err) {
        return false
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

async function downloadEachFile(url: string, timestamp: number, joinId: number): Promise<boolean> {
    const filePath = path.join(__dirname, `../downloads/${joinId}_${timestamp}.mp4`);
    const res = await fetch(url);
    if (!res.ok) {
        return false
    }
    const arrayBuffer = await res.arrayBuffer();
    await Bun.write(filePath, arrayBuffer);
    return true
}

