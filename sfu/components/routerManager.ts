import * as mediasoup from "mediasoup"
import { worker } from ".."
import { mediaCodecs } from "./codecs"
import type { MeetToUserAndSocket } from "../types/meedToUserAndSocketType"

export class RouterManager {
    private static instance: RouterManager
    private connectedSocketIds: Set<string> = new Set()
    private meets: Map<number, mediasoup.types.Router> = new Map() // done insert
    private meetToUser: Map<number, MeetToUserAndSocket[]> = new Map() // done insert
    private socketToMeet: Map<string, number> = new Map()

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
}
