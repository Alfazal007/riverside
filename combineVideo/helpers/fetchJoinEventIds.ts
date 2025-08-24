import { v2 as cloudinary } from "cloudinary"

export async function getJoinEventIds(meetId: number, recordingId: number): Promise<number[]> {
    cloudinary.config({
        cloud_name: 'itachivrnft',
        api_key: '131286585685619',
        api_secret: process.env.CLOUDINARY_SECRET!
    })
    let path = `riverside/singles/${meetId}/${recordingId}`
    try {
        let joinEventIds: number[] = []
        const response = await cloudinary.api.sub_folders(path, { max_results: 100 });
        response.folders.forEach((folder: any) => { joinEventIds.push(Number(folder.name)) })
        return joinEventIds
    } catch (err) {
        console.error('Error fetching subfolders:', err);
        return []
    }
}
