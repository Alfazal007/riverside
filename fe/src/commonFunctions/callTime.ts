import axios from "axios";
import { authUrl } from "../../constants";

export async function timeOfServer() {
    try {
        const response = await axios.get(`${authUrl}/api/time`)
        console.log({ response: response.data })
        return response.data as number
    } catch (err) {
        return -1
    }
}
