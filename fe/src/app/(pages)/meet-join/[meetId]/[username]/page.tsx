"use client"

import Cookies from "js-cookie";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";
import { types as mediasoupTypes } from "mediasoup-client"
import { Button } from "@/components/ui/button";
import { Producer } from "mediasoup-client/types";
import axios from "axios";
import { authUrl } from "../../../../../../constants";
import { timeOfServer } from "@/commonFunctions/callTime";
import { toast } from "sonner";
import { urlCreator } from "@/commonFunctions/getSignatureAndReturnUrl";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

type ConsumerTransportDataType = {
    consumerTransport: mediasoupTypes.Transport<mediasoupTypes.AppData>;
    serverConsumerTransportId: any;
    producerId: string;
    consumer: mediasoupTypes.Consumer<mediasoupTypes.AppData>;
}

function recorderToStreamToServer(stream: MediaStream, meetId: number, router: AppRouterInstance, setCanGoBack: (val: boolean) => void) {
    if (!stream) {
        console.error("No stream available to record")
        return null
    }
    const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8"
    })
    recorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0 && recorder.state == "recording") {
            try {
                const signatureData = await urlCreator(meetId)
                if (!signatureData) {
                    router.push("/meets")
                    return
                }
                const { api_key, cloudinaryUploadUrl, public_id, signature, timestamp } = signatureData
                const formData = new FormData()
                formData.append("file", event.data)
                formData.append("api_key", api_key)
                formData.append("timestamp", String(timestamp))
                formData.append("signature", signature)
                formData.append("public_id", public_id)
                formData.append("resource_type", "raw")
                const res = await fetch(cloudinaryUploadUrl, {
                    method: "POST",
                    body: formData,
                })
                if (!res.ok) {
                    console.log({ res })
                    router.push("/meets")
                    return
                } else {
                    console.log("uploaded one")
                }
            } catch (err) {
                console.error("Upload failed:", err)
            }
        }
    }

    recorder.onstop = () => {
        setCanGoBack(true)
    }
    return recorder
}

export default function({ params }: { params: Promise<{ meetId: string; username: string }> }) {
    const { meetId, username } = React.use(params);
    const router = useRouter()
    const [connected, setConnected] = useState(false)
    const [establishedConnected, setEstablishedConnected] = useState(false)
    const socketRef = useRef<Socket | null>(null);
    const [dataToSend, setDataToSend] = useState({ accessToken: "", userId: -1, meetId: Number(meetId), username })
    const [rtpCapabilities, setRtpCapabilities] = useState<mediasoupTypes.RtpCapabilities>();
    const [deviceCreated, setDeviceCreated] = useState(false)
    const [consumingTransports, setConsumingTransports] = useState<string[]>([]);
    const [consumerTransports, setConsumerTransports] = useState<ConsumerTransportDataType[]>([]);
    const [producerTransportState, setProducerTransportState] = useState<mediasoupTypes.Transport>();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [audioConsume, setAudioConsume] = useState(true);
    const [videoConsume, setVideoConsume] = useState(true);
    const audioProducerRef = useRef<null | Producer>(null);
    const videoProducerRef = useRef<null | Producer>(null);
    const [recording, setRecording] = useState<boolean>(false)
    const [host, setHost] = useState<boolean>(false)
    const [canGoBack, setCanGoBack] = useState(true)

    const audioParamsRef = useRef<any>(null);
    const videoParamsRef = useRef<any>({ params });

    const recorderRef = useRef<null | MediaRecorder>(null);

    async function getHostData() {
        try {
            const response = await axios.post(`${authUrl}/api/meet/is-host`, {
                meet_id: Number(meetId)
            }, { withCredentials: true })
            console.log({ response })
            if (response.status == 200) {
                setHost(true)
            }
        } catch (err) { }
    }

    async function setTrackAndData() {
        if (!producerTransportState) {
            console.log("early return")
            return
        }
        if (audioConsume) {
            if (!audioProducerRef.current) {
                audioProducerRef.current = await producerTransportState.produce(audioParamsRef.current);
                audioProducerRef.current.on('trackended', () => {
                    console.log('audio track ended')
                })
                audioProducerRef.current.on('transportclose', () => {
                    console.log('audio transport ended')
                })
            }
            audioProducerRef.current.resume()
        } else if (!audioConsume) {
            audioProducerRef.current?.pause();
        }
        if (videoConsume) {
            if (!videoProducerRef.current) {
                videoProducerRef.current = await producerTransportState.produce(videoParamsRef.current);
                videoProducerRef.current.on('trackended', () => {
                    console.log('video track ended')
                })
                videoProducerRef.current.on('transportclose', () => {
                    console.log('video transport ended')
                })
            }
            videoProducerRef.current.resume()
        } else if (!videoConsume) {
            videoProducerRef.current?.pause();
        }
    }

    useEffect(() => {
        if (recording) {
            setCanGoBack(false)
            recorderRef.current?.start(10000)
        } else {
            console.log("stopping recording")
            console.log(recorderRef.current)
            recorderRef.current?.stop()
            console.log("after stopping")
            console.log(recorderRef.current)
        }
    }, [recording])

    const getLocalStream = () => {
        if (!audioConsume && !videoConsume) {
            audioProducerRef.current?.pause()
            videoProducerRef.current?.pause()
            return
        }
        navigator.mediaDevices.getUserMedia({
            audio: audioConsume,
            video: videoConsume && {
                width: {
                    min: 640,
                    max: 1920,
                },
                height: {
                    min: 400,
                    max: 1080,
                }
            }
        })
            .then(streamSuccess)
            .catch(error => {
                console.log(error.message)
            })
    }

    const streamSuccess = (stream: any) => {
        if (videoRef.current && stream) {
            if (!recorderRef.current) {
                console.log("setting recorder ref")
                recorderRef.current = recorderToStreamToServer(stream, Number(meetId), router, setCanGoBack)
            }
            videoRef.current.srcObject = stream;
            audioParamsRef.current = { track: stream.getAudioTracks()[0], ...audioParamsRef.current };
            videoParamsRef.current = { track: stream.getVideoTracks()[0], ...videoParamsRef.current };
            setTrackAndData()
        }
    }
    useEffect(() => {
        if (establishedConnected) {
            getLocalStream()
        }
    }, [producerTransportState, audioConsume, videoConsume, establishedConnected])

    const deviceRef = useRef<mediasoupClient.types.Device | null>(null);

    useEffect(() => {
        getHostData()
        return () => {
            console.log("disconnecting sokcet on client")
            recorderRef.current?.stop()
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
            console.log("connecting to socket")
            socketRef.current = io("http://127.0.0.1:8001")
            socketRef.current.on("disconnect", () => {
                router.push("/meets")
            })
            socketRef.current.on("connection-established", () => { setEstablishedConnected(true) })
            socketRef.current.emit("establish-connection", dataToSend)
            setConnected(true)
        }
    }, [connected, dataToSend])

    useEffect(() => {
        if (establishedConnected && socketRef.current) {
            socketRef.current.emit("rtpCapabilities", async (data: { rtpCapabilities: mediasoupTypes.RtpCapabilities }) => {
                setRtpCapabilities(data.rtpCapabilities)
                setTimeout(
                    async () => {
                        deviceRef.current = new mediasoupClient.Device()
                        await deviceRef.current.load({ routerRtpCapabilities: data.rtpCapabilities })
                        setDeviceCreated(true)

                        socketRef.current?.emit("recording", Number(meetId))

                        socketRef.current?.on('newest-producer', async (producerId: string) => {
                            await signalNewConsumerTransport(producerId, Number(meetId))
                        })

                        socketRef.current?.emit('getProducers', Number(meetId), (producerIds: string[]) => {
                            console.log("get producers called")
                            producerIds.forEach(async (id) => {
                                await signalNewConsumerTransport(id, Number(meetId))
                            })
                        })

                        socketRef.current?.on('producer-closed', ({ remoteProducerId }) => {
                            const producerToClose = consumerTransports.find(transportData => transportData.producerId === remoteProducerId)
                            producerToClose?.consumerTransport.close()
                            producerToClose?.consumer.close()
                            let newConsumerTransports = consumerTransports.filter(transportData => transportData.producerId !== remoteProducerId)
                            setConsumerTransports(newConsumerTransports)
                            document.getElementById(`td-${remoteProducerId}`)?.remove()
                        })

                        socketRef.current?.on("start-recording", async () => {
                            startRecordingAndSetJointimestamp()
                        })

                        socketRef.current?.on("stop-recording", async () => {
                            setRecording(false)
                        })
                        socketRef.current?.on("recording", (isRecording: boolean) => {
                            if (isRecording) {
                                startRecordingAndSetJointimestamp()
                            }
                        })
                    }, 2000)
            })
        }
    }, [establishedConnected])

    useEffect(() => {
        if (deviceCreated && socketRef.current) {
            socketRef.current.emit('createTransport', { consumer: false, meetId: Number(meetId) }, async ({
                id,
                iceParameters,
                iceCandidates,
                dtlsParameters,
                error
            }: {
                id: string,
                iceParameters: mediasoupTypes.IceParameters,
                iceCandidates: mediasoupTypes.IceCandidate[],
                dtlsParameters: mediasoupTypes.DtlsParameters,
                error: any
            }) => {
                if (error) {
                    console.log(error)
                    return
                }

                let producerTransport = deviceRef.current?.createSendTransport({
                    dtlsParameters,
                    iceParameters,
                    iceCandidates,
                    id
                })

                producerTransport?.on('connect', async ({ dtlsParameters }, callback, errback) => {
                    try {
                        socketRef.current?.emit('transport-connect', {
                            dtlsParameters,
                            consumer: false
                        })
                        console.log("Producer transport connected");
                        callback()
                    } catch (error: any) {
                        errback(error)
                    }
                })

                producerTransport?.on('produce', async (parameters, callback, errback) => {
                    console.log(parameters)
                    try {
                        socketRef.current?.emit('transport-produce', {
                            kind: parameters.kind,
                            rtpParameters: parameters.rtpParameters,
                            appData: parameters.appData,
                            meetId: Number(meetId)
                        }, ({ id, producersExist }: { id: string, producersExist: boolean }) => {
                            console.log("callback called")
                            callback({ id })
                            if (producersExist) {
                                socketRef.current?.on('new-producer', ({ producerId }) => signalNewConsumerTransport(producerId, Number(meetId)))
                            }
                            else { console.log("no producer") }
                        })
                    } catch (error: any) {
                        errback(error)
                    }
                })

                setProducerTransportState(producerTransport)
            })

            // create send transports
        }
    }, [deviceCreated])

    const signalNewConsumerTransport = async (remoteProducerId: string, meetId: number) => {
        if (consumingTransports.includes(remoteProducerId)) return;
        let newConsumerTransports = [...consumingTransports, remoteProducerId]
        setConsumingTransports(newConsumerTransports)
        socketRef.current?.emit('createTransport', { consumer: true, meetId }, async ({
            id,
            iceParameters,
            iceCandidates,
            dtlsParameters,
            error
        }: {
            id: string,
            iceParameters: mediasoupTypes.IceParameters,
            iceCandidates: mediasoupTypes.IceCandidate[],
            dtlsParameters: mediasoupTypes.DtlsParameters,
            error: any
        }) => {
            if (error) {
                console.log(error)
                return
            }
            console.log(`PARAMS... ${params}`)
            let consumerTransport
            try {
                consumerTransport = deviceRef.current?.createRecvTransport({
                    id,
                    iceCandidates,
                    dtlsParameters,
                    iceParameters
                })
                consumerTransport?.on('connect', async ({ dtlsParameters }, callback, errback) => {
                    try {
                        socketRef.current?.emit('transport-recv-connect', {
                            dtlsParameters,
                            serverConsumerTransportId: id,
                        })
                        // Tell the transport that parameters were transmitted.
                        callback()
                    } catch (error: any) {
                        errback(error)
                    }
                })

                // @ts-ignore
                connectRecvTransport(consumerTransport, remoteProducerId, id, Number(meetId));
            } catch (error) {
                // exceptions: 
                // {InvalidStateError} if not loaded
                // {TypeError} if wrong arguments.
                console.log(error)
                return
            }
        })
    }

    async function startRecordingAndSetJointimestamp() {
        const time = await timeOfServer()
        if (time == -1) {
            toast("Recording server down")
            router.push("/meets")
            return
        }
        setRecording(true)
        try {
            const response = await axios.post(`${authUrl}/api/meet/join-recording`, {
                join_time: time,
                meet_id: Number(meetId)
            }, { withCredentials: true })
            if (response.status != 200) {
                toast("Recording server down")
                router.push("/meets")
                return
            }
        } catch (err) {
            toast("Issue recording")
            router.push("/meets")
            return
        }
    }

    const connectRecvTransport = async (consumerTransport: mediasoupTypes.Transport, remoteProducerId: string, serverConsumerTransportId: string, meetId: number) => {
        // for consumer, we need to tell the server first
        // to create a consumer based on the rtpCapabilities and consume
        // if the router can consume, it will send back a set of params as below
        socketRef.current?.emit('consume', {
            rtpCapabilities: deviceRef.current?.rtpCapabilities,
            remoteProducerId,
            serverConsumerTransportId,
            meetId
        }, async ({ params }: { params: any }) => {
            if (params.error) {
                console.log('Cannot Consume')
                return
            }

            console.log(`Consumer Params ${params}`)
            // then consume with the local consumer transport
            // which creates a consumer
            const consumer = await consumerTransport.consume({
                id: params.id,
                producerId: params.producerId,
                kind: params.kind,
                rtpParameters: params.rtpParameters
            })

            let newConsumerTransports = [
                ...consumerTransports,
                {
                    consumerTransport,
                    serverConsumerTransportId: params.id,
                    producerId: remoteProducerId,
                    consumer,
                },
            ]

            setConsumerTransports(newConsumerTransports)

            // create a new div element for the new consumer media
            const newElem = document.createElement('div')
            newElem.setAttribute('id', `td-${remoteProducerId}`)

            if (params.kind == 'audio') {
                //append to the audio container
                newElem.innerHTML = '<audio id="' + remoteProducerId + '" autoplay></audio>'
            } else {
                //append to the video container
                newElem.setAttribute('class', 'remoteVideo')
                newElem.innerHTML = '<video id="' + remoteProducerId + '" autoplay class="video" ></video>'
            }

            document.getElementById("videoContainer")?.appendChild(newElem)

            // destructure and retrieve the video track from the producer
            const { track } = consumer

            // @ts-ignore
            let value = document.getElementById(remoteProducerId) as HTMLVideoElement
            // @ts-ignore
            value.srcObject = new MediaStream([track])

            // the server consumer started with media paused
            // so we need to inform the server to resume
            socketRef.current?.emit('consumer-resume', { serverConsumerId: params.serverConsumerId })
        })
    }

    return (
        <>
            <div>
                Recording = {JSON.stringify(recording)}
                <Button onClick={() => { router.push("/meets"); return }} disabled={!canGoBack}>
                    Leave
                </Button>
                {
                    host &&
                    <Button onClick={() => {
                        let message = recording ? "stop-recording" : "start-recording"
                        socketRef.current?.emit(message, Number(meetId))
                    }}>
                        {
                            recording ? "Stop Recording" : "Start Recording"
                        }
                    </Button>
                }
                <video ref={videoRef} autoPlay className="video" muted hidden={!videoConsume} />
                <Button onClick={() => { setAudioConsume((prev) => !prev) }}>
                    {
                        audioConsume ? "No audio" : "Start audio"
                    }
                </Button>
                <Button onClick={() => { setVideoConsume((prev) => !prev) }}>
                    {
                        videoConsume ? "No video" : "Start video"
                    }
                </Button>
                <div id='videoContainer'></div>
            </div>
        </>
    )
}
