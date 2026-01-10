import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function RefundPolicy() {
    return (
        <div className="min-h-screen">
            <Header />
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">Refund & Return Policy</h1>
                    <p className="text-muted-foreground mb-8">Last updated: November 28, 2025</p>

                    <Alert className="mb-8">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            We want you to be completely satisfied with your purchase. Please read our policy carefully to understand your rights.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Return Window</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    You have <strong>14 days</strong> from the date of delivery to initiate a return for:
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li>Defective or damaged products</li>
                                    <li>Products that differ significantly from their description</li>
                                    <li>Wrong items shipped</li>
                                </ul>
                                <p className="text-muted-foreground mt-4">
                                    For change of mind returns, you have <strong>7 days</strong> from delivery (product must be unused and in original packaging).
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>2. Eligible Returns</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-2 text-green-600">✓ We Accept Returns For:</h3>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                            <li>Defective or damaged products</li>
                                            <li>Products received in error</li>
                                            <li>Items that don't match the description</li>
                                            <li>Unopened products in original packaging (change of mind)</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2 text-red-600">✗ We Cannot Accept Returns For:</h3>
                                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                            <li>Products used or installed</li>
                                            <li>Items without original packaging or tags</li>
                                            <li>Perishable goods</li>
                                            <li>Personalized or custom-made items</li>
                                            <li>Hygiene products (opened)</li>
                                            <li>Digital products or downloadable software</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>3. How to Initiate a Return</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="list-decimal list-inside text-muted-foreground space-y-3">
                                    <li>
                                        <strong>Contact Us:</strong> Email support@auracart.com with your order number, reason for return, and photos (if applicable)
                                    </li>
                                    <li>
                                        <strong>Wait for Authorization:</strong> We will review your request and provide a Return Merchandise Authorization (RMA) number within 48 hours
                                    </li>
                                    <li>
                                        <strong>Pack the Item:</strong> Include all original packaging, accessories, and documentation
                                    </li>
                                    <li>
                                        <strong>Ship the Item:</strong> Send to the address provided in your RMA email. Keep your tracking number
                                    </li>
                                    <li>
                                        <strong>Inspection:</strong> We will inspect the returned item within 5-7 business days
                                    </li>
                                </ol>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>4. Refund Process</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Refund Methods</h3>
                                        <p className="text-muted-foreground">
                                            Refunds will be issued to your original payment method:
                                        </p>
                                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                                            <li><strong>Card Payments (Paystack):</strong> 5-10 business days</li>
                                            <li><strong>Cryptocurrency (NowPayments):</strong> 3-5 business days</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Partial Refunds</h3>
                                        <p className="text-muted-foreground">
                                            Partial refunds may be issued for:
                                        </p>
                                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                                            <li>Items with obvious signs of use</li>
                                            <li>Items returned more than 14 days after delivery</li>
                                            <li>Items not in original condition or missing parts</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>5. Exchanges</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    We offer exchanges for:
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li>Defective items (replaced with identical product)</li>
                                    <li>Wrong size/color (subject to availability)</li>
                                    <li>Damaged during shipping</li>
                                </ul>
                                <p className="text-muted-foreground mt-4">
                                    To request an exchange, follow the same process as returns. We will ship the replacement once we receive and inspect the returned item.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>6. Shipping Costs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="font-semibold mb-1">Our Fault (Defective/Wrong Item):</h3>
                                        <p className="text-muted-foreground">We cover all return shipping costs and provide a prepaid label.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Change of Mind:</h3>
                                        <p className="text-muted-foreground">You are responsible for return shipping costs. We recommend insured shipping with tracking.</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Exchanges:</h3>
                                        <p className="text-muted-foreground">We cover shipping costs for replacement items if the original product was defective.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>7. Damaged or Lost Shipments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li>
                                        <strong>Damaged on Arrival:</strong> Contact us within 48 hours with photos. We will arrange a replacement or refund.
                                    </li>
                                    <li>
                                        <strong>Lost in Transit:</strong> If your package doesn't arrive within expected timeframe, contact us. We will work with the carrier to locate it or issue a replacement.
                                    </li>
                                    <li>
                                        <strong>Stolen Packages:</strong> We are not responsible for packages stolen after delivery. We recommend shipping to a secure location or using signature confirmation.
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>8. Cancellations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="font-semibold mb-1">Before Shipment:</h3>
                                        <p className="text-muted-foreground">
                                            You can cancel your order before it ships for a full refund. Contact us immediately at support@auracart.com.
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">After Shipment:</h3>
                                        <p className="text-muted-foreground">
                                            Once shipped, you must follow our return process. Cancellations are not possible.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>9. International Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    For international returns:
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                                    <li>Customer is responsible for return shipping costs</li>
                                    <li>Customs duties and taxes are non-refundable</li>
                                    <li>Returns must comply with customs regulations</li>
                                    <li>Processing may take longer (up to 21 days)</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>10. Restocking Fee</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    A restocking fee of <strong>15%</strong> may apply to change-of-mind returns for:
                                </p>
                                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                                    <li>Large or bulky items</li>
                                    <li>Special order items</li>
                                    <li>Items marked as "final sale"</li>
                                </ul>
                                <p className="text-muted-foreground mt-3">
                                    This fee does not apply to defective items or our errors.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>11. Contact Us</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-4">
                                    For return or refund inquiries:
                                </p>
                                <div className="text-muted-foreground space-y-1">
                                    <p><strong>Email:</strong> support@auracart.com</p>
                                    <p><strong>Subject Line:</strong> Return Request - Order #[Your Order Number]</p>
                                    <p><strong>Response Time:</strong> Within 24-48 hours</p>
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
