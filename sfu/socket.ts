import { redis } from "bun"
import { io } from "./index"
import type { EstablishConnectionMessage } from "./types/establishConnectionType"
import { checkAuth } from "./components/authChecker"
import { RouterManager } from "./components/routerManager"
import { createWebRtcTransport } from "./components/createTransport"
import * as mediasoup from "mediasoup"
import { prisma } from "./prisma"

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
            RouterManager.getInstance().createRouter(meetId, userId, socket.id, socket)
            socket.emit("connection-established")
        })

        socket.on("rtpCapabilities", callback => {
            let rtpCapabilities = RouterManager.getInstance().rtpCapabilities(socket.id)
            if (!rtpCapabilities) {
                socket.disconnect()
            }
            callback({ rtpCapabilities })
        })

        socket.on("createTransport", async ({ consumer, meetId }: { consumer: boolean, meetId: number }, callback) => {
            let router = RouterManager.getInstance().getRouter(socket.id)
            if (!router) {
                return
            }
            const newTransport = await createWebRtcTransport(router)
            callback({
                id: newTransport.id,
                iceParameters: newTransport.iceParameters,
                iceCandidates: newTransport.iceCandidates,
                dtlsParameters: newTransport.dtlsParameters,
            })
            RouterManager.getInstance().addTransport(newTransport, consumer, meetId, socket.id)
        })

        socket.on("transport-connect", async ({ consumer, dtlsParameters }: { consumer: boolean, dtlsParameters: mediasoup.types.DtlsParameters }) => {
            let transport = RouterManager.getInstance().getTransport(socket.id, consumer)
            await transport?.transport.connect({
                dtlsParameters: dtlsParameters
            });
            console.log("producer transport connceted")
        })

        socket.on("transport-produce", async ({
            kind,
            rtpParameters,
            appData,
            meetId
        }: {
            kind: mediasoup.types.MediaKind,
            rtpParameters: mediasoup.types.RtpParameters,
            appData: mediasoup.types.AppData,
            meetId: number
        }, callback) => {
            const producer = await RouterManager.getInstance().getTransport(socket.id, false)?.transport.produce({
                kind,
                rtpParameters
            })
            if (!producer) {
                return
            }
            RouterManager.getInstance().addProducer(producer, socket.id, meetId);
            producer?.on('transportclose', () => {
                console.log('transport for this producer closed ')
                producer.close()
                RouterManager.getInstance().removeProducer(producer.id);
                RouterManager.getInstance().removeTransport(socket.id);
            })
            callback({
                id: producer.id,
                producersExist: RouterManager.getInstance().hasProducers(meetId)
            })
            RouterManager.getInstance().otherUserSockets(meetId, socket.id).forEach((socketToSend) => {
                socketToSend.emit("newest-producer", producer.id)
            })
        })

        socket.on('transport-recv-connect', async ({ dtlsParameters, serverConsumerTransportId }) => {
            console.log(`DTLS PARAMS: ${dtlsParameters}`)
            let transport = RouterManager.getInstance().getConsumerTranport(serverConsumerTransportId);
            await transport?.connect({ dtlsParameters })
        })

        socket.on('consume', async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId, meetId }, callback) => {
            try {
                let consumerTransport = RouterManager.getInstance().getConsumerTranport(serverConsumerTransportId);
                const router = RouterManager.getInstance().getRouter(socket.id);
                if (!router || !consumerTransport) {
                    return
                }
                // check if the router can consume the specified producer
                console.log("\n\n\n\n\n can router consumer \n\n\n\n", router.canConsume({
                    producerId: remoteProducerId,
                    rtpCapabilities
                }))
                if (router.canConsume({
                    producerId: remoteProducerId,
                    rtpCapabilities
                })) {
                    // transport can now consume and return a consumer
                    const consumer = await consumerTransport.consume({
                        producerId: remoteProducerId,
                        rtpCapabilities,
                        paused: true,
                    })

                    consumer.on('transportclose', () => {
                        console.log('transport close from consumer')
                    })

                    consumer.on('producerclose', () => {
                        console.log('producer of consumer closed')
                        socket.emit('producer-closed', { remoteProducerId })

                        consumerTransport.close()

                        RouterManager.getInstance().getTransportsForRemovingConsumers(consumer.id)
                        consumer.close()
                        RouterManager.getInstance().removeConsumers(consumer.id)
                    })

                    RouterManager.getInstance().addConsumer(consumer, meetId, socket.id)

                    // from the consumer extract the following params
                    // to send back to the Client
                    const params = {
                        id: consumer.id,
                        producerId: remoteProducerId,
                        kind: consumer.kind,
                        rtpParameters: consumer.rtpParameters,
                        serverConsumerId: consumer.id,
                    }

                    // send the parameters to the client
                    callback({ params })
                }
            } catch (error: any) {
                console.log(error.message)
                callback({
                    params: {
                        error: error
                    }
                })
            }
        })

        socket.on("getProducers", (meetId: number, callback) => {
            console.log("get producers called")
            let producerList = RouterManager.getInstance().getProduerList(meetId, socket.id)
            callback(producerList)
        })

        socket.on('consumer-resume', async ({ serverConsumerId }) => {
            console.log('consumer resume')
            await RouterManager.getInstance().resumeConsumer(serverConsumerId)
        })

        socket.on("start-recording", async (meetId: number) => {
            try {
                const userId = RouterManager.getInstance().userIdFromSocketAndMeet(meetId, socket.id)
                if (!userId) {
                    return
                }
                const meets = await prisma.participant.findFirst({
                    where: {
                        AND: [
                            {
                                is_host: true
                            },
                            {
                                meet_id: meetId
                            },
                            {
                                user_id: userId
                            }
                        ]
                    }
                })
                if (!meets) {
                    return
                }
            } catch (err) { return }
            let otherSockets = RouterManager.getInstance().otherUserSockets(meetId, socket.id)
            otherSockets.push(socket)
            otherSockets.forEach((sock) => {
                sock.emit("start-recording")
            })
        })

        socket.on("stop-recording", async (meetId: number) => {
            try {
                const userId = RouterManager.getInstance().userIdFromSocketAndMeet(meetId, socket.id)
                if (!userId) {
                    return
                }
                const meets = await prisma.participant.findFirst({
                    where: {
                        AND: [
                            {
                                is_host: true
                            },
                            {
                                meet_id: meetId
                            },
                            {
                                user_id: userId
                            }
                        ]
                    }
                })
                console.log({ meets })
                if (!meets) {
                    return
                }
            } catch (err) {
                console.log({ err })
                return
            }
            let otherSockets = RouterManager.getInstance().otherUserSockets(meetId, socket.id)
            otherSockets.push(socket)
            otherSockets.forEach((sock) => {
                sock.emit("stop-recording")
            })
        })

        socket.on("disconnect", () => {
            const routerManager = RouterManager.getInstance()
            const meetId = routerManager.getMeet(socket.id)
            const userProducers = routerManager["producers"].filter(
                (p) => p.socketId === socket.id
            )
            userProducers.forEach(({ producer }) => {
                routerManager.otherUserSockets(meetId, socket.id).forEach((otherSocket) => {
                    otherSocket.emit("producer-closed", { remoteProducerId: producer.id })
                })
                if (!producer.closed) {
                    producer.close()
                }
                routerManager.removeProducer(producer.id)
            })
            RouterManager.getInstance().removeUser(socket.id)
            console.log("User disconnected:", socket.id)
        })
    })
}
