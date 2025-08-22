import { prisma } from "./prisma";

async function main() {
    while (true) {
        let combineVideoData = null;

        try {
            combineVideoData = await prisma.combineVideo.findFirst({
                where: {
                    compiled: false
                }
            });
        } catch (err) {
            console.error("Error fetching combineVideo:", err);
        }

        if (combineVideoData) {
            try {
                //TODO:: compile the video 
                await prisma.combineVideo.update({
                    where: { recording_id: combineVideoData.recording_id },
                    data: {
                        compiled: true
                    }
                })

            } catch (err) {
                console.error("Error processing combineVideo:", err);
                // optionally retry or handle failed job
            }
        } else {
            // No data found, wait 10 seconds before polling again
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
    }
}

main();
