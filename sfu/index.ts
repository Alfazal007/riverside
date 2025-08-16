import express from "express"
import http from "http"
import { Server } from "socket.io"
import * as mediasoup from "mediasoup"
import { addHandlers } from "./socket"

const app = express()
const server = http.createServer(app)

export let worker: mediasoup.types.Worker

async function main() {
    worker = await mediasoup.createWorker()
}

main()

export const io = new Server(server, {
    cors: {
        origin: "*",
    },
})

addHandlers()

server.listen(8001, () => {
    console.log("Server running on http://localhost:8001")
})

