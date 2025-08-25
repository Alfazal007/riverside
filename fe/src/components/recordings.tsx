"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { authUrl } from "../../constants";

export interface Recording {
    recording: number;
    ready: boolean;
}

export function RecordingsSection({ recordings, meetId }: { recordings: Recording[], meetId: number }) {
    const router = useRouter()

    async function getUrl(recordingId: number) {
        try {
            const response = await axios.post(`${authUrl}/recording/get-one`, {
                meet_id: meetId,
                recording_id: recordingId
            }, { withCredentials: true })
            if (response.status != 200) {
                toast("Could not get the data, try again later")
                return
            }
            const { url } = response.data as { url: string };
            router.push(`/video?url=${url}`)
            return
        } catch (err) {
            toast("Could not get the data, try again later")
        }
    }

    return (
        <Card className="shadow-lg border-0 mt-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Recordings
                </CardTitle>
                <CardDescription>
                    Generated meeting recordings
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {recordings.length > 0 ? (
                        recordings.map((rec) => (
                            <div
                                key={rec.recording}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <p className="font-medium text-gray-900">
                                    Recording #{rec.recording}
                                </p>
                                {rec.ready ? (
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={() => {
                                            getUrl(rec.recording)
                                        }}
                                    >
                                        View
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No recordings available</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
