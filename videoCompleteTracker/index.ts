import { mainLogic } from "./executeStatements"
import { prisma } from "./prisma"
import { configDotenv } from "dotenv"

configDotenv()

async function main() {
    while (true) {
        let combineVideoData: null | {
            recording_id: number;
            compiled: boolean;
        } = null

        try {
            combineVideoData = await prisma.combineVideo.findFirst({
                where: {
                    compiled: false
                }
            })
        } catch (err) {
            console.error("Error fetching combineVideo:", err)
        }

        if (combineVideoData) {
            await mainLogic(combineVideoData.recording_id)
        } else {
            console.log("no data so wating for 10 seconds")
            await new Promise((resolve) => setTimeout(resolve, 10000))
        }
    }
}

main()
