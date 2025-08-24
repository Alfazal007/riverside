import { combineVideo } from "./helpers/combineVideo"
import { redis } from "./redis"

async function main() {
    if (!redis.connected) {
        await redis.connect()
    }
    while (true) {
        // TODO:: do kafka thing here and also make the thing commit to kafka after everything succeeds
        const recordEventIdString = await redis.brPop("render-final", 0)
        if (!recordEventIdString || !recordEventIdString.element) {
            continue
        }
        let recordEventRecordingId = Number(recordEventIdString.element)
        let res = false
        while (!res) {
            res = await combineVideo(recordEventRecordingId)
        }
    }
}

main()
