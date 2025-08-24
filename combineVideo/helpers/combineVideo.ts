import { prisma } from "../prisma"
import { downloadVideo } from "./downloadVideos"
import { getJoinEventIds } from "./fetchJoinEventIds"

export async function combineVideo(recordEventRecordingId: number): Promise<boolean> {
    try {
        console.log(`working on ${recordEventRecordingId}`)
        const recordingEvent = await prisma.recordEvent.findFirst({
            where: {
                recording_id: recordEventRecordingId
            }
        })
        if (!recordingEvent) {
            return false
        }
        let meetId = recordingEvent.meet_id
        let joinEventIds = await getJoinEventIds(meetId, recordEventRecordingId)
        if (!joinEventIds || joinEventIds.length == 0) {
            return false
        }
        const recordJoinEvents = await prisma.recordEvent.findMany({
            where: {
                action: "join",
                meet_id: meetId,
                recording_id: recordEventRecordingId,
                id: {
                    in: joinEventIds
                }
            },
            orderBy: {
                timestamp: "asc"
            },
            select: {
                timestamp: true,
                id: true
            }
        })
        if (recordJoinEvents.length != joinEventIds.length) {
            return false
        }
        let publicIds: { publicId: string, timestamp: number, joinId: number }[] = []
        for (let i = 0; i < recordJoinEvents.length; i++) {
            let recordEvent = recordJoinEvents[i]
            if (!recordEvent) {
                return false
            }
            let publicId = `riverside/singles/${meetId}/${recordEventRecordingId}/${recordEvent.id}/${recordEvent.timestamp}`
            publicIds.push({
                publicId, timestamp: Number(recordEvent.timestamp),
                joinId: recordEvent.id
            })
        }
        let res = await downloadVideo(publicIds)
        // TODO:: upload the combined file
        // TODO:: delete the uploaded combined file
        return res
    }
    catch (err) {
        console.log({ err })
        return false
    }
}
