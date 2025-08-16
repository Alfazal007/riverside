'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/navigation';
import { Users, Mail, Plus, X, Send } from 'lucide-react';
import { AddParticipantFormData, Participant } from '@/types';

export default function AddParticipantsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const meetId = searchParams.get('meetId');
    const meetTitle = searchParams.get('title') || 'Untitled Meet';

    const [formData, setFormData] = useState<AddParticipantFormData>({
        email: '',
        role: 'guest',
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

    const handleAddParticipant = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        const newParticipant: Participant = {
            id: Date.now().toString(),
            email: formData.email,
            role: formData.role,
            status: 'invited',
        };

        setParticipants(prev => [...prev, newParticipant]);
        setFormData({ email: '', role: 'guest' });
    };

    const handleRemoveParticipant = (id: string) => {
        setParticipants(prev => prev.filter(p => p.id !== id));
    };

    const handleSendInvitations = async () => {
        if (participants.length === 0) return;

        setIsLoading(true);

        // Simulate API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Invitations sent to:', participants);
            router.push('/meets');
        } catch (error) {
            console.error('Failed to send invitations:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
                        Invite guests to join "{meetTitle}"
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
                                Enter participant email and select their role
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

                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={formData.role} onValueChange={handleRoleChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="guest">Guest</SelectItem>
                                                <SelectItem value="host">Co-host</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Participant
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Participants List */}
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Participants ({participants.length})
                            </CardTitle>
                            <CardDescription>
                                Review and manage participants for this recording session
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {participants.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No participants added yet.</p>
                                    <p className="text-sm">Add participants using the form above.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {participants.map((participant) => (
                                        <div
                                            key={participant.id}
                                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Mail className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{participant.email}</p>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            variant={participant.role === 'host' ? 'default' : 'secondary'}
                                                            className="text-xs"
                                                        >
                                                            {participant.role === 'host' ? 'Co-host' : 'Guest'}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {participant.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveParticipant(participant.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => router.push('/create-meet')}
                        >
                            Back
                        </Button>
                        <Button
                            className="flex-1 text-lg py-3"
                            onClick={handleSendInvitations}
                            disabled={participants.length === 0 || isLoading}
                        >
                            {isLoading ? (
                                'Sending Invitations...'
                            ) : (
                                <>
                                    Send Invitations
                                    <Send className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
