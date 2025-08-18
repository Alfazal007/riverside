"use client"

import Cookies from "js-cookie";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

export default function({ params }: { params: Promise<{ meetId: string; username: string }> }) {
    const { meetId, username } = React.use(params);
    const router = useRouter()
    const [connected, setConnected] = useState(false)
    const socketRef = useRef<Socket | null>(null);
    const [dataToSend, setDataToSend] = useState({ accessToken: "", userId: -1, meetId: Number(meetId), username })

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
            console.log("sending")
            socketRef.current.emit("establish-connection", dataToSend)
        }
    }, [connected, dataToSend])

    return <></>
}
