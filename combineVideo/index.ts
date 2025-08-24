import { combineVideo } from "./helpers/combineVideo"
import { redis } from "./redis"

async function main() {
    if (!redis.connected) {
        await redis.connect()
    }
    while (true) {
        const recordEventIdString = await redis.brPop("render-final", 0)
        if (!recordEventIdString || !recordEventIdString.element) {
            continue
        }
        let recordEventId = Number(recordEventIdString.element)
        let res = false
        while (!res) {
            res = await combineVideo(recordEventId)
        }
    }
}

main()
