"use client"

import Cookies from "js-cookie";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";
import { types as mediasoupTypes } from "mediasoup-client"

export default function({ params }: { params: Promise<{ meetId: string; username: string }> }) {
    const { meetId, username } = React.use(params);
    const router = useRouter()
    const [connected, setConnected] = useState(false)
    const [establishedConnected, setEstablishedConnected] = useState(false)
    const socketRef = useRef<Socket | null>(null);
    const [dataToSend, setDataToSend] = useState({ accessToken: "", userId: -1, meetId: Number(meetId), username })
    const [rtpCapabilities, setRtpCapabilities] = useState<mediasoupTypes.RtpCapabilities>();

    useEffect(() => {
        return () => {
            console.log("disconnecting sokcet on client")
            socketRef.current?.disconnect()
        }
    }, [])
    useEffect(() => {
        const accessToken = Cookies.get("accessToken")
        const userId = Cookies.get("userId")
        if (!accessToken || !userId) {
            router.push("/login")
            return
        }
        setDataToSend((prev) => {
            return {
                ...prev,
                accessToken,
                userId: Number(userId)
            }
        })
    }, [])

    useEffect(() => {
        if (isNaN(Number(meetId))) {
            router.push("/meets")
            return
        }
        if (!connected && dataToSend.accessToken) {
            setConnected(true)
            socketRef.current = io("http://127.0.0.1:8001");
            socketRef.current.on("disconnect", () => {
                router.push("/meets")
            })
            socketRef.current.emit("establish-connection", dataToSend)
            setEstablishedConnected(true)
        }
    }, [connected, dataToSend])

    useEffect(() => {
        if (establishedConnected && socketRef.current) {
            socketRef.current.emit("rtpCapabilities", async (data: { rtpCapabilities: mediasoupTypes.RtpCapabilities }) => {
                setRtpCapabilities(data.rtpCapabilities)
                setTimeout(
                    async () => {
                        //await createDevice(data.rtpCapabilities)
                    }, 2000)
            })
        }
    }, [establishedConnected])

    return <>{JSON.stringify(rtpCapabilities)}</>
}
