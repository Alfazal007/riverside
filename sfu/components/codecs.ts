import * as mediasoup from "mediasoup";

export const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
    {
        kind: "audio",
        mimeType: "audio/opus",
        preferredPayloadType: 111,
        clockRate: 48000,
        channels: 2,
    },
    {
        kind: "video",
        mimeType: "video/VP8",
        preferredPayloadType: 96,
        clockRate: 90000,
        parameters: {
            "x-google-start-bitrate": 1000,
        },
    },
];

