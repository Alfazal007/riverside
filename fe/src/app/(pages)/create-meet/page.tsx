'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from '@/components/navigation';
import { Calendar, Users } from 'lucide-react';
import { CreateMeetFormData } from '@/types';
import axios from 'axios';

export default function CreateMeetPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<CreateMeetFormData>({
        title: '',
    });
    const [errors, setErrors] = useState<Partial<CreateMeetFormData>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name as keyof CreateMeetFormData]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<CreateMeetFormData> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Meet title is required';
        } else if (formData.title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const newMeetResponse = await axios.post("http://localhost:8000/api/meet/create", {
                title: formData.title
            }, { withCredentials: true })
            console.log('Meet created:', formData);
            router.push(`/add-participants?meetId=${newMeetResponse.data.id}`);
        } catch (error) {
            console.error('Failed to create meet:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navigation isAuthenticated />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center mb-6">
                        <Calendar className="h-12 w-12 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Meet</h1>
                    <p className="text-xl text-gray-600">
                        Start a new podcast recording session
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <Card className="shadow-lg border-0">
                        <CardHeader className="text-center pb-6">
                            <CardTitle className="text-2xl">Meet Details</CardTitle>
                            <CardDescription className="text-lg">
                                Give your podcast recording session a memorable title
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="title" className="text-lg font-medium">
                                        Meet Title
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        type="text"
                                        placeholder="e.g., Tech Talk Weekly #42, Startup Stories Interview"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className={`text-lg py-3 ${errors.title ? 'border-red-500' : ''}`}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-red-500">{errors.title}</p>
                                    )}
                                    <p className="text-sm text-gray-500">
                                        Choose a descriptive title that helps you identify this recording session
                                    </p>
                                </div>

                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <h3 className="font-medium text-gray-900 mb-2">Next Steps:</h3>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Add participants to your recording session</li>
                                        <li>• Send invitations to your guests</li>
                                        <li>• Start recording when everyone joins</li>
                                    </ul>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => router.push('/meets')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 text-lg py-3"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            'Creating Meet...'
                                        ) : (
                                            <>
                                                Create Meet
                                                <Users className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
