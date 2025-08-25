import { combineVideo } from "./helpers/combineVideo"
import { kafkaConsumer } from "./kafka"

async function main() {
    await kafkaConsumer.connect();
    await kafkaConsumer.subscribe({
        topic: "render-final",
        fromBeginning: false
    })
    await kafkaConsumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            try {
                let recordEventRecordingId = Number(message?.value?.toString())
                let res = false
                while (!res) {
                    res = await combineVideo(recordEventRecordingId)
                }
                await kafkaConsumer.commitOffsets([{
                    topic: topic,
                    partition: partition,
                    offset: (parseInt(message.offset) + 1).toString()
                }]);
            } catch (err) { }
        },
    })
}

main()
