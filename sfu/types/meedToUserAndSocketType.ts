import type { Socket } from "socket.io"

export type MeetToUserAndSocket = {
    userId: number,
    socketId: string,
    socket: Socket
}
