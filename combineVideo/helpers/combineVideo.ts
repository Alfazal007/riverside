import { prisma } from "../prisma"
import { downloadVideo } from "./downloadVideos"
import { userIds } from "./fetchUserIdsOfRecordings"
import { userRecords } from "./fetchUserRecords"

export async function combineVideo(recordEventId: number): Promise<boolean> {
    try {
        console.log(`working on ${recordEventId}`)
        let requiredPublicIds: { publicId: string, timestamp: number }[] = []
        const recordingEvent = await prisma.recordEvent.findFirst({
            where: {
                recording_id: recordEventId
            }
        })
        if (!recordingEvent) {
            return false
        }
        let meetId = recordingEvent.meet_id
        const joinedUserIds = await userIds(`riverside/${meetId}/${recordEventId}`)
        if (!joinedUserIds || joinedUserIds.length == 0) {
            return false
        }
        for (let i = 0; i < joinedUserIds.length; i++) {
            let userId = joinedUserIds[i]
            let recordEventsCloudinary = await userRecords(`riverside/${meetId}/${recordEventId}/${userId}`)
            if (!recordEventsCloudinary || recordEventsCloudinary.length == 0) {
                return false
            }
            for (let j = 0; j < recordEventsCloudinary.length; j++) {
                let outputFilePublicId = `riverside/${meetId}/${recordEventId}/${userId}/${recordEventsCloudinary[j]}/output`
                const timestampOfStart = await prisma.recordEvent.findFirst({
                    where: {
                        id: recordEventsCloudinary[j]
                    }
                })
                if (!timestampOfStart) {
                    return false
                }
                requiredPublicIds.push({ publicId: outputFilePublicId, timestamp: Number(timestampOfStart.timestamp) })
            }
        }
        let res = await downloadVideo(requiredPublicIds, recordEventId)
        return res
    }
    catch (err) {
        console.log({ err })
        return false
    }
}
