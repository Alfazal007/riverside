'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mic, Users, Calendar, LogOut } from 'lucide-react';

interface NavigationProps {
    isAuthenticated?: boolean;
}

export function Navigation({ isAuthenticated = false }: NavigationProps) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    if (!isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
        return (
            <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center space-x-2">
                                <Mic className="h-8 w-8 text-blue-600" />
                                <span className="font-bold text-xl">PodcastPro</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/login">
                                <Button
                                    variant={isActive('/login') ? 'default' : 'ghost'}
                                    className="text-sm"
                                >
                                    Login
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button
                                    variant={isActive('/signup') ? 'default' : 'outline'}
                                    className="text-sm"
                                >
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    if (isAuthenticated) {
        return (
            <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/dashboard" className="flex items-center space-x-2">
                                <Mic className="h-8 w-8 text-blue-600" />
                                <span className="font-bold text-xl">PodcastPro</span>
                            </Link>
                            <div className="flex space-x-4">
                                <Link href="/meets">
                                    <Button
                                        variant={isActive('/meets') ? 'default' : 'ghost'}
                                        size="sm"
                                        className="flex items-center space-x-2"
                                    >
                                        <Calendar className="h-4 w-4" />
                                        <span>My Meets</span>
                                    </Button>
                                </Link>
                                <Link href="/create-meet">
                                    <Button
                                        variant={isActive('/create-meet') ? 'default' : 'ghost'}
                                        size="sm"
                                        className="flex items-center space-x-2"
                                    >
                                        <Users className="h-4 w-4" />
                                        <span>Create Meet</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">john@example.com</span>
                            <Link href="/">
                                <Button variant="ghost" size="sm">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Mic className="h-8 w-8 text-blue-600" />
                            <span className="font-bold text-xl">PodcastPro</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/login">
                            <Button variant="ghost" className="text-sm">
                                Login
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button className="text-sm">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
