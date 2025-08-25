"use client"

import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";

export default function() {
    const searchParams = useSearchParams();
    const videoUrl = searchParams.get("url");
    const router = useRouter()

    useEffect(() => {
        const accessToken = Cookies.get("accessToken")
        const userId = Cookies.get("userId")
        if (!accessToken || !userId) {
            router.push("/login")
            return
        }
    }, [])

    return (
        <div className="w-full max-w-2xl mx-auto">
            {videoUrl &&
                <video
                    src={videoUrl}
                    controls
                    className="w-full rounded-2xl shadow-lg"
                />
            }
        </div>
    )
}
