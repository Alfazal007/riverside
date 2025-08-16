import { redis } from "bun";
import { prisma } from "../prisma";

export async function checkAuth(meetId: number, accessToken: string, userId: number): Promise<boolean> {
    if (!redis.connected) {
        await redis.connect()
    }
    const tokenRedis = await redis.get(`auth:${userId}`)
    if (!tokenRedis || tokenRedis != accessToken) {
        return false
    }
    try {
        const meet = await prisma.participant.findFirst({
            where: {
                AND: [
                    {
                        meet_id: meetId
                    },
                    {
                        user_id: userId
                    }
                ]
            }
        })
        if (!meet) {
            return false
        }
    } catch (err) {
        console.log({ err })
        return false
    }
    return true
}
