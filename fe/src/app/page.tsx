import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Navigation } from '@/components/navigation';
import {
    Mic,
    Video,
    Users,
    Shield,
    Zap,
    Globe,
    Check,
} from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navigation />

            {/* Hero Section */}
            <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8">
                            Create{' '}
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Studio-Quality
                            </span>
                            <br />
                            Podcasts Together
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
                            Record high-quality audio and video with remote guests.
                            Professional podcasting made simple, from anywhere in the world.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/signup">
                                <Button size="lg" className="text-lg px-8 py-4">
                                    Start Recording Free
                                </Button>
                            </Link>
                            <Link href="#features">
                                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                                    See How It Works
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need for Professional Podcasting
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Built for creators, by creators. Our platform combines simplicity with
                            professional-grade features to help you create amazing content.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <Card className="p-8 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                            <CardContent className="p-0">
                                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                                    <Video className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4">4K Video Recording</h3>
                                <p className="text-gray-600">
                                    Record crystal-clear video up to 4K resolution. Your audience will see every detail.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="p-8 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-purple-50 to-purple-100">
                            <CardContent className="p-0">
                                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                                    <Mic className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4">Studio-Quality Audio</h3>
                                <p className="text-gray-600">
                                    Professional audio processing ensures your podcast sounds perfect every time.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="p-8 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-green-50 to-green-100">
                            <CardContent className="p-0">
                                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4">Multiple Participants</h3>
                                <p className="text-gray-600">
                                    Invite unlimited guests to your recording sessions. Everyone gets their own track.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="p-8 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-orange-50 to-orange-100">
                            <CardContent className="p-0">
                                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-6">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4">Secure & Private</h3>
                                <p className="text-gray-600">
                                    Your content is encrypted and secure. Full privacy controls for sensitive recordings.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="p-8 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-red-50 to-red-100">
                            <CardContent className="p-0">
                                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-6">
                                    <Zap className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4">Instant Setup</h3>
                                <p className="text-gray-600">
                                    No downloads required. Start recording in seconds with just your web browser.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="p-8 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-indigo-50 to-indigo-100">
                            <CardContent className="p-0">
                                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-6">
                                    <Globe className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4">Global Reach</h3>
                                <p className="text-gray-600">
                                    Connect with guests anywhere in the world. Low-latency recording from any location.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-xl text-gray-600">
                            Start free, upgrade when you need more features
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <Card className="p-8 border-0 bg-white">
                            <CardContent className="p-0">
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold mb-4">Free</h3>
                                    <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-500">/month</span></div>
                                    <ul className="space-y-3 mb-8">
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            Up to 2 participants
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            1080p recording
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            2 hours/month
                                        </li>
                                    </ul>
                                    <Button className="w-full" variant="outline">Get Started</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="p-8 border-2 border-blue-500 bg-white relative">
                            <CardContent className="p-0">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </div>
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold mb-4">Pro</h3>
                                    <div className="text-4xl font-bold mb-6">$29<span className="text-lg text-gray-500">/month</span></div>
                                    <ul className="space-y-3 mb-8">
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            Up to 10 participants
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            4K recording
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            Unlimited recording
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            Priority support
                                        </li>
                                    </ul>
                                    <Button className="w-full">Start Pro Trial</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="p-8 border-0 bg-white">
                            <CardContent className="p-0">
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
                                    <div className="text-4xl font-bold mb-6">Custom</div>
                                    <ul className="space-y-3 mb-8">
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            Unlimited participants
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            Custom branding
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            API access
                                        </li>
                                        <li className="flex items-center">
                                            <Check className="h-5 w-5 text-green-500 mr-3" />
                                            24/7 support
                                        </li>
                                    </ul>
                                    <Button className="w-full" variant="outline">Contact Sales</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">
                        Ready to Create Your First Professional Podcast?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8">
                        Join thousands of creators who trust PodcastPro for their recordings
                    </p>
                    <Link href="/signup">
                        <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                            Start Recording Free Today
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Mic className="h-8 w-8 text-blue-400" />
                            <span className="font-bold text-xl">PodcastPro</span>
                        </div>
                        <p className="text-gray-400">
                            © 2024 PodcastPro. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
