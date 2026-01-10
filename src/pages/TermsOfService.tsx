import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
    return (
        <div className="min-h-screen">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
                    <p className="text-muted-foreground mb-8">Last updated: November 28, 2025</p>

                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Acceptance of Terms</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    By accessing and using AuraCart ("the Service"), you accept and agree to be bound by these Terms of Service.
                                    If you do not agree to these terms, please do not use our Service.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>2. Account Registration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-muted-foreground">
                                    To make purchases, you must create an account. You agree to:
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li>Provide accurate and complete information</li>
                                    <li>Keep your password secure and confidential</li>
                                    <li>Notify us immediately of unauthorized use</li>
                                    <li>Be responsible for all activities under your account</li>
                                    <li>Be at least 18 years old or have parental consent</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>3. Product Information and Pricing</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Product Descriptions</h3>
                                    <p className="text-muted-foreground">
                                        We strive to provide accurate product descriptions and images. However, we do not warrant that descriptions,
                                        images, or other content are error-free, complete, or current.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Pricing</h3>
                                    <p className="text-muted-foreground">
                                        All prices are in Nigerian Naira (NGN) unless otherwise stated. We reserve the right to change prices at any time.
                                        Prices are confirmed at checkout. Pricing errors will be corrected, and you will have the option to continue your purchase at the correct price.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Availability</h3>
                                    <p className="text-muted-foreground">
                                        Product availability is subject to change. We reserve the right to limit quantities or discontinue products.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>4. Orders and Payment</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Order Acceptance</h3>
                                    <p className="text-muted-foreground">
                                        Your order is an offer to purchase. We reserve the right to accept or decline any order.
                                        We may cancel orders due to product unavailability, pricing errors, or suspected fraud.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Payment Methods</h3>
                                    <p className="text-muted-foreground">
                                        We accept payments via Paystack (card payments) and NowPayments (cryptocurrency).
                                        Payment must be received in full before order fulfillment.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Order Confirmation</h3>
                                    <p className="text-muted-foreground">
                                        You will receive an email confirmation when your order is placed and when it ships.
                                        Please review order details carefully.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>5. Shipping and Delivery</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li>We ship to addresses within Nigeria and select international locations</li>
                                    <li>Delivery times are estimates and not guaranteed</li>
                                    <li>You are responsible for providing accurate shipping information</li>
                                    <li>Risk of loss passes to you upon delivery to the carrier</li>
                                    <li>We are not responsible for delays caused by shipping carriers or customs</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>6. Returns and Refunds</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    Please refer to our <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a> for details on returns,
                                    exchanges, and refunds. By making a purchase, you agree to our refund terms.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>7. Prohibited Uses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">You agree not to:</p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li>Use the Service for any illegal purpose</li>
                                    <li>Attempt to gain unauthorized access to our systems</li>
                                    <li>Interfere with or disrupt the Service</li>
                                    <li>Use bots, scrapers, or automated tools</li>
                                    <li>Impersonate others or provide false information</li>
                                    <li>Engage in fraudulent activities</li>
                                    <li>Resell products without authorization</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>8. Intellectual Property</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    All content on AuraCart, including text, graphics, logos, images, and software, is our property or our licensors' property.
                                    You may not reproduce, distribute, or create derivative works without our written permission.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>9. Limitation of Liability</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    To the maximum extent permitted by law:
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li>AuraCart is provided "as is" without warranties of any kind</li>
                                    <li>We are not liable for indirect, incidental, or consequential damages</li>
                                    <li>Our total liability shall not exceed the amount you paid for the product</li>
                                    <li>We are not responsible for third-party content or services</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>10. Indemnification</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    You agree to indemnify and hold AuraCart harmless from any claims, damages, or expenses arising from your use of the Service,
                                    violation of these Terms, or infringement of any rights of another party.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>11. Governing Law</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    These Terms are governed by the laws of the Federal Republic of Nigeria.
                                    Any disputes shall be resolved in the courts of Nigeria.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>12. Changes to Terms</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    We reserve the right to update these Terms at any time. Changes will be posted on this page with an updated revision date.
                                    Your continued use of the Service constitutes acceptance of modified Terms.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>13. Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    For questions about these Terms, contact us at:
                                </p>
                                <div className="text-muted-foreground space-y-1">
                                    <p><strong>Email:</strong> legal@auracart.com</p>
                                    <p><strong>Support:</strong> support@auracart.com</p>
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
