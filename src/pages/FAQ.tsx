import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Aura Cart?",
    answer: "Aura Cart is a premium e-commerce platform offering curated products from global suppliers with AI-powered pricing and automated fulfillment."
  },
  {
    question: "How long does shipping take?",
    answer: "Shipping times vary by location and product. Most orders arrive within 7-21 business days. You can track your order in real-time from your account."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, and digital payment methods through our secure Paystack integration. All transactions are encrypted and secure."
  },
  {
    question: "Can I track my order?",
    answer: "Yes! Once your order ships, you'll receive tracking information via email. You can also track your order anytime using our Track Order page."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy on most items. Products must be unused and in original packaging. See our Returns page for full details."
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by destination."
  },
  {
    question: "How do you calculate prices?",
    answer: "Our AI-powered pricing engine analyzes market trends, product categories, and demand to offer competitive prices while maintaining quality standards."
  },
  {
    question: "Are my payment details secure?",
    answer: "Absolutely. We use industry-standard encryption and never store your full payment details. All transactions are processed through secure payment gateways."
  },
  {
    question: "Can I cancel my order?",
    answer: "Orders can be cancelled within 24 hours of placement if they haven't been shipped yet. Contact support immediately for assistance."
  },
  {
    question: "How do I contact customer support?",
    answer: "You can reach us through our Contact page, email at support@auracart.com, or use the live chat feature available on our website."
  }
];

export default function FAQ() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Find answers to common questions about Aura Cart.
          </p>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
