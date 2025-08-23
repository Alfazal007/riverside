import { v2 as cloudinary } from "cloudinary"

export async function userIds(path: string): Promise<number[]> {
    cloudinary.config({
        cloud_name: 'itachivrnft',
        api_key: '131286585685619',
        api_secret: process.env.CLOUDINARY_SECRET!
    })

    try {
        let users: number[] = []
        const response = await cloudinary.api.sub_folders(path, { max_results: 100 });
        response.folders.forEach((folder: any) => { users.push(Number(folder.name)) })
        return users
    } catch (err) {
        console.error('Error fetching subfolders:', err);
        return []
    }
}
