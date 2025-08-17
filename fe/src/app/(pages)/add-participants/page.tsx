'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/navigation';
import { Users, Plus } from 'lucide-react';
import { AddParticipantFormData, Participant } from '@/types';
import axios from 'axios';
import { toast } from "sonner"

export default function AddParticipantsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const meetId = searchParams.get('meetId');

    const [formData, setFormData] = useState<AddParticipantFormData>({
        email: '',
    });
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [errors, setErrors] = useState<Partial<AddParticipantFormData>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if no meetId
    useEffect(() => {
        if (!meetId) {
            router.push('/create-meet');
        }
    }, [meetId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name as keyof AddParticipantFormData]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleRoleChange = (value: 'host' | 'guest') => {
        setFormData(prev => ({ ...prev, role: value }));
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<AddParticipantFormData> = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        } else if (participants.some(p => p.email === formData.email)) {
            newErrors.email = 'This email has already been added';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddParticipant = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        try {
            const response = await axios.post("http://localhost:8000/api/participant/add", {
                email: formData.email,
                meet_id: Number(meetId)
            }, { withCredentials: true })
            if (response.status == 201) {
                toast("Added successfully")
                router.push("/meets")
            }
        } catch (err) {
            toast("Make sure the user has the account in riverside to be added as participant")
        }
    };
    //remove participants /// list participants /// list title
    if (!meetId) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navigation isAuthenticated />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-6">
                        <Users className="h-12 w-12 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Add Participants</h1>
                    <p className="text-xl text-gray-600">
                        Invite guests to join
                    </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Add Participant Form */}
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                Add Participant
                            </CardTitle>
                            <CardDescription>
                                Enter participant email
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddParticipant} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2 space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="guest@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={errors.email ? 'border-red-500' : ''}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-500">{errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Participant
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
