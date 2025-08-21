import axios from "axios";

let authUrl = "http://localhost:8000"
export async function timeOfServer() {
    try {
        const response = await axios.get(`${authUrl}/api/time`)
        console.log({ response: response.data })
        return response.data as number
    } catch (err) {
        return -1
    }
}
