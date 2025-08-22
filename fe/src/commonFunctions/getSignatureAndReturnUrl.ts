import axios from "axios"
import { authUrl } from "../../constants"

type ReturnCloudinaryData = {
    timestamp: number,
    signature: string,
    public_id: string,
    cloudinaryUploadUrl: string,
    api_key: string
}

export async function urlCreator(meetId: number): Promise<null | ReturnCloudinaryData> {
    try {
        const response = await axios.post(`${authUrl}/video/upload`, {
            meet_id: meetId
        }, { withCredentials: true })
        if (response.status != 200) {
            return null
        } else {
            const { timestamp, signature, public_id } = response.data
            const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/itachivrnft/raw/upload`
            return {
                timestamp, signature, public_id, cloudinaryUploadUrl, api_key: "949193924699989"
            }
        }
    } catch (err) {
        return null
    }
}
