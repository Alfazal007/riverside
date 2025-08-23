import { downloadAndCombineVideo } from "./createVideoFull"
import { userIds } from "./fetchUserRecordingFolders"
import { userRecords } from "./fetchUserRecordsFolders"
import { prisma } from "./prisma"

export async function mainLogic(recordingId: number) {
    try {
        const recordEvent = await prisma.recordEvent.findFirst({
            where: {
                recording_id: recordingId
            }
        })
        if (!recordEvent) {
            return
        }
        let meetId = recordEvent.meet_id
        const joinedUserIds = await userIds(`riverside/${meetId}/${recordingId}`)
        if (!joinedUserIds || joinedUserIds.length == 0) {
            return
        }
        for (let i = 0; i < joinedUserIds.length; i++) {
            let userId = joinedUserIds[i]
            let recordEventsCloudinary = await userRecords(`riverside/${meetId}/${recordingId}/${userId}`)
            if (!recordEventsCloudinary || recordEventsCloudinary.length == 0) {
                return
            }
            for (let j = 0; j < recordEventsCloudinary.length; j++) {
                let recordEvent = recordEventsCloudinary[j]
                const responseTrueOrNot = await downloadAndCombineVideo(`riverside/${meetId}/${recordingId}/${userId}/${recordEvent}`)
                if (!responseTrueOrNot) {
                    return
                }
            }
        }
        await prisma.combineVideo.update({
            where: { recording_id: recordEvent.recording_id },
            data: {
                compiled: true
            }
        })
    } catch (err) {
        console.error("Error processing combineVideo:", err)
    }
}
