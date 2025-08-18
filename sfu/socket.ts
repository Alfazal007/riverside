import { redis } from "bun"
import { io } from "./index"
import type { EstablishConnectionMessage, RtpCapabilitiesMessage } from "./types/establishConnectionType"
import { checkAuth } from "./components/authChecker"
import { RouterManager } from "./components/routerManager"

export function addHandlers() {
    io.on("connection", (socket) => {
        socket.on("establish-connection", async (dataParsed: EstablishConnectionMessage) => {
            const { accessToken, userId, username, meetId } = dataParsed
            if (!accessToken || !userId || !username) {
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
            const isAllowed = await checkAuth(meetId, accessToken, userId)
            if (!isAllowed) {
                socket.disconnect()
                return
            }
            if (socket.disconnected) {
                console.warn("Tried to create router, but socket already disconnected:", socket.id)
                return
            }
            RouterManager.getInstance().trackUser(socket.id)
            RouterManager.getInstance().createRouter(meetId, userId, socket.id)
        })

        socket.on("rtpCapabilities", callback => {
            let rtpCapabilities = RouterManager.getInstance().rtpCapabilities(socket.id)
            if (!rtpCapabilities) {
                socket.disconnect()
            }
            callback({ rtpCapabilities })
        })

        socket.on("disconnect", () => {
            RouterManager.getInstance().removeUser(socket.id)
            console.log("User disconnected:", socket.id)
        })
    })
}
