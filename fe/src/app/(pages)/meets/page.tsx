'use client';

import Cookies from "js-cookie";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/navigation';
import {
    Calendar,
    Play,
    Plus,
} from 'lucide-react';
import { Meet } from '@/types';
import { useRouter } from 'next/navigation';
import axios from "axios";

export default function MeetsPage() {
    const [meets, setMeets] = useState<Meet[]>([]);
    const router = useRouter()

    async function getMeets() {
        try {
            const meets = await axios.get("http://localhost:8000/api/meet/all-meets", { withCredentials: true })
            setMeets(meets.data)
        } catch (err) {
            console.log("issue fetching data")
        }
    }

    useEffect(() => {
        const accessToken = Cookies.get("accessToken")
        const userId = Cookies.get("userId")
        if (!accessToken || !userId) {
            router.push("/login")
            return
        }
        getMeets()
    }, [])

    const handleJoinMeet = (meetId: number) => {
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navigation isAuthenticated />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">My Meets</h1>
                        <p className="text-xl text-gray-600">
                            Manage and join your podcast recording sessions
                        </p>
                    </div>
                    <Link href="/create-meet">
                        <Button size="lg" className="text-lg px-6 py-3">
                            <Plus className="h-5 w-5 mr-2" />
                            Create New Meet
                        </Button>
                    </Link>
                </div>

                {meets.length === 0 ? (
                    <Card className="shadow-lg border-0 text-center py-12">
                        <CardContent>
                            <Calendar className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No meets yet</h3>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                Create your first podcast recording session to get started with professional-quality content.
                            </p>
                            <Link href="/create-meet">
                                <Button size="lg">
                                    <Plus className="h-5 w-5 mr-2" />
                                    Create Your First Meet
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {meets.map((meet) => (
                            <Card key={meet.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-xl mb-2 line-clamp-2">
                                                {meet.meet_id}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        onClick={() => handleJoinMeet(Number(meet.meet_id))}
                                    >
                                        <Play className="h-4 w-4 mr-2" />
                                        Join
                                    </Button>
                                    {
                                        meet.is_host &&
                                        <Link href={`/add-participants?meetId=${meet.id}`}>
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700"
                                            >
                                                Add participants
                                            </Button>
                                        </Link>
                                    }
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {meets.length > 0 && (
                    <div className="mt-12 text-center">
                        <p className="text-gray-600 mb-4">
                            Ready to create more professional content?
                        </p>
                        <Link href="/create-meet">
                            <Button variant="outline" size="lg">
                                <Plus className="h-5 w-5 mr-2" />
                                Create Another Meet
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div >
    );
}
