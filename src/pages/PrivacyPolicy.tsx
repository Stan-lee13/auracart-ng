import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                    <p className="text-muted-foreground mb-8">Last updated: November 28, 2025</p>

                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Information We Collect</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Personal Information</h3>
                                    <p className="text-muted-foreground">
                                        When you create an account or make a purchase, we collect:
                                    </p>
                                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                                        <li>Name and contact information (email, phone number)</li>
                                        <li>Shipping and billing addresses</li>
                                        <li>Payment information (processed securely by our payment providers)</li>
                                        <li>Order history and preferences</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Automatically Collected Information</h3>
                                    <p className="text-muted-foreground">
                                        We automatically collect certain information when you use our services:
                                    </p>
                                    <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                                        <li>IP address and geolocation data</li>
                                        <li>Browser type and device information</li>
                                        <li>Pages visited and time spent on our site</li>
                                        <li>Cookies and similar tracking technologies</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>2. How We Use Your Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">We use your information to:</p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li>Process and fulfill your orders</li>
                                    <li>Send order confirmations and shipping updates</li>
                                    <li>Provide customer support</li>
                                    <li>Improve our services and user experience</li>
                                    <li>Send promotional emails (with your consent)</li>
                                    <li>Prevent fraud and ensure security</li>
                                    <li>Comply with legal obligations</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>3. Information Sharing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">We share your information with:</p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li><strong>Payment Processors:</strong> Paystack and NowPayments to process transactions securely</li>
                                    <li><strong>Shipping Partners:</strong> To deliver your orders</li>
                                    <li><strong>Service Providers:</strong> Companies that help us operate our business (hosting, analytics, customer support)</li>
                                    <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                                </ul>
                                <p className="text-muted-foreground mt-4">
                                    We never sell your personal information to third parties.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>4. Data Security</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    We implement industry-standard security measures to protect your data:
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                                    <li>SSL/TLS encryption for data transmission</li>
                                    <li>Secure payment processing (PCI-DSS compliant)</li>
                                    <li>Regular security audits and updates</li>
                                    <li>Access controls and authentication</li>
                                </ul>
                                <p className="text-muted-foreground mt-4">
                                    While we strive to protect your information, no method of transmission over the internet is 100% secure.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>5. Your Rights</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">You have the right to:</p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                                    <li><strong>Deletion:</strong> Request deletion of your data (subject to legal obligations)</li>
                                    <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
                                    <li><strong>Data Portability:</strong> Receive your data in a portable format</li>
                                </ul>
                                <p className="text-muted-foreground mt-4">
                                    To exercise these rights, contact us at privacy@auracart.com
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>6. Cookies</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    We use cookies and similar technologies to:
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li>Remember your preferences and settings</li>
                                    <li>Keep you logged in</li>
                                    <li>Analyze site traffic and usage</li>
                                    <li>Personalize content and ads</li>
                                </ul>
                                <p className="text-muted-foreground mt-4">
                                    You can control cookies through your browser settings, but this may affect site functionality.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>7. Children's Privacy</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Our services are not intended for children under 13. We do not knowingly collect information from children.
                                    If you believe we have collected data from a child, please contact us immediately.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>8. International Data Transfers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Your information may be transferred to and processed in countries other than your own.
                                    We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>9. Changes to This Policy</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice on our website.
                                    Your continued use of our services after changes constitutes acceptance of the updated policy.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>10. Contact Us</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    If you have questions about this Privacy Policy or our data practices, contact us at:
                                </p>
                                <div className="text-muted-foreground space-y-1">
                                    <p><strong>Email:</strong> privacy@auracart.com</p>
                                    <p><strong>Address:</strong> AuraCart Inc., [Your Business Address]</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
