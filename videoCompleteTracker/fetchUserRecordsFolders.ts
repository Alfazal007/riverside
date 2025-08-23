import { v2 as cloudinary } from "cloudinary"

export async function userRecords(path: string): Promise<number[]> {
    cloudinary.config({
        cloud_name: 'itachivrnft',
        api_key: '131286585685619',
        api_secret: process.env.CLOUDINARY_SECRET!
    })

    try {
        let records: number[] = []
        const response = await cloudinary.api.sub_folders(path, { max_results: 100 });
        response.folders.forEach((folder: any) => { records.push(Number(folder.name)) })
        return records
    } catch (err) {
        console.error('Error fetching subfolders:', err);
        return []
    }
}
