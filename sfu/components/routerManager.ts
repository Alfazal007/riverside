import * as mediasoup from "mediasoup"
import { worker } from ".."
import { mediaCodecs } from "./codecs"
import type { MeetToUserAndSocket } from "../types/meedToUserAndSocketType"
import type { Consumer, WebRtcTransport } from "mediasoup/types"

export class RouterManager {
    private static instance: RouterManager
    private connectedSocketIds: Set<string> = new Set()
    private meets: Map<number, mediasoup.types.Router> = new Map()
    private meetToUser: Map<number, MeetToUserAndSocket[]> = new Map()
    private socketToMeet: Map<string, number> = new Map()
    // need to check existances
    private transports: { transport: WebRtcTransport, isConsumer: boolean, meetId: number, socketId: string }[] = []
    private producers: { producer: mediasoup.types.Producer, socketId: string, meetId: number }[] = []
    private consumers: { meetId: number, consumer: mediasoup.types.Consumer, socketId: string }[] = [];

    private constructor() { }

    static getInstance() {
        if (!RouterManager.instance) {
            RouterManager.instance = new RouterManager()
        }
        return RouterManager.instance
    }

    trackUser(socketId: string) {
        this.connectedSocketIds.add(socketId)
    }

    async createRouter(meetId: number, userId: number, socketId: string) {
        if (!this.meetToUser.has(meetId)) {
            this.meetToUser.set(meetId, [])
        }
        this.meetToUser.get(meetId)?.push({ socketId, userId })
        if (!this.meets.has(meetId)) {
            let router = await worker.createRouter({
                mediaCodecs: mediaCodecs
            })
            this.meets.set(meetId, router)
        }
        this.socketToMeet.set(socketId, meetId)
    }

    removeUser(socketId: string) {
        this.removeTransport(socketId)
        this.connectedSocketIds.delete(socketId)
        let meetId = this.socketToMeet.get(socketId)
        this.socketToMeet.delete(socketId)
        if (meetId) {
            let meets = this.meetToUser.get(meetId)
            if (meets && meets.length <= 1) {
                this.meetToUser.delete(meetId)
                this.meets.delete(meetId)
            } else {
                let userData = this.meetToUser.get(meetId)
                let newUserData = userData?.filter((value) => value.socketId != socketId)
                newUserData && this.meetToUser.set(meetId, newUserData)
            }
        }
    }

    getMeet(socketId: string) {
        if (this.socketToMeet.has(socketId)) {
            return this.socketToMeet.get(socketId) as number
        }
        return NaN
    }

    rtpCapabilities(socketId: string) {
        let meetId = this.getMeet(socketId)
        if (!meetId) {
            return null
        }
        let router = this.meets.get(meetId)
        if (!router) {
            return null
        }
        return router.rtpCapabilities
    }

    getRouter(socketId: string) {
        let meetId = this.getMeet(socketId)
        if (!meetId) {
            return null
        }
        let router = this.meets.get(meetId)
        if (!router) {
            return null
        }
        return router
    }

    addTransport(transport: WebRtcTransport, isConsumer: boolean, meetId: number, socketId: string) {
        this.transports.push({ isConsumer, meetId, socketId, transport })
    }

    removeTransport(socketId: string) {
        this.transports = this.transports.filter((transport) => transport.socketId !== socketId)
    }

    getTransport(socketId: string, consumer: boolean) {
        let transport = this.transports.find((transport) => transport.isConsumer == consumer && transport.socketId == socketId)
        return transport
    }

    addProducer(producer: mediasoup.types.Producer, socketId: string, meetId: number) {
        this.producers.push({
            meetId,
            producer,
            socketId
        })
    }

    removeProducer(producerId: string) {
        this.producers = this.producers.filter((producer) => producer.producer.id !== producerId)
    }

    hasProducers(meetId: number) {
        let count = 0
        this.producers.forEach((producer) => {
            if (producer.meetId == meetId && !producer.producer.closed) {
                count++
            }
        })
        return count > 2
    }

    getConsumerTranport(serverConsumerTransportId: string): WebRtcTransport | undefined {
        let transport = this.transports.find((transport) => (transport.isConsumer && transport.transport.id == serverConsumerTransportId))?.transport
        return transport
    }

    removeConsumers(consumerId: string) {
        this.consumers = this.consumers.filter((consumer) => consumer.consumer.id !== consumerId)
    }

    getTransportsForRemovingConsumers(consumerId: string) {
        this.transports = this.transports.filter(transportData => transportData.transport.id !== consumerId)
    }

    addConsumer(consumer: Consumer, meetId: number, socketId: string) {
        this.consumers.push({
            consumer,
            meetId,
            socketId
        })
    }

    getProduerList(meetId: number, socketId: string) {
        let producers: string[] = []
        this.producers.forEach((producer) => {
            if (producer.meetId === meetId && producer.socketId !== socketId)
                producers = [
                    ...producers,
                    producer.producer.id
                ]
        })
        return producers
    }

    async resumeConsumer(consumerId: string) {
        const consumer = this.consumers.find(consumerData => consumerData.consumer.id === consumerId)
        await consumer?.consumer.resume()
    }
}
