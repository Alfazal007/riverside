import { redis } from "bun"
import { io } from "."
import type { EstablishConnection } from "./types/establishConnectionType"

io.on("connection", (socket) => {
    socket.on("establish-connection", async (data: EstablishConnection) => {
        const { accessToken, roomId, userId, username } = data
        if (!accessToken || !roomId || !userId || !username) {
            socket.disconnect()
            return
        }
        if (!redis.connected) {
            await redis.connect()
        }
        const redisData = await redis.mget(`auth:${userId}`, `email:${userId}`)
        if (!redisData || redisData.length != 2 || accessToken != redisData[0]) {
            socket.disconnect()
            return
        }
        // TODO:: check the database to see if the meets exists in the database and is scheduled
    })

    socket.on("disconnect", () => {
        // TODO:: clear from room
        console.log("User disconnected:", socket.id)
    })
})

