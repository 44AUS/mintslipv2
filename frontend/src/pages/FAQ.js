import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, FileText, Building2, Receipt, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// FAQ Categories and Questions
const FAQ_CATEGORIES = {
  general: {
    title: "General Questions",
    icon: HelpCircle,
    questions: [
      {
        question: "Who is MintSlip?",
        answer: "MintSlip is a professional document generation platform based in the United States. Our goal is to provide easy-to-use tools for creating accurate pay stubs, accounting mockups, W-2 forms, and more. We've built this platform to remove the stress of document generation while ensuring accuracy and professionalism."
      },
      {
        question: "How will I receive my documents?",
        answer: "After completing your purchase, your documents will be automatically downloaded to your computer as a PDF file. The download happens instantly after payment confirmation - no waiting required!"
      },
      {
        question: "How long does it take to create a document?",
        answer: "It only takes a few minutes to create a document with our generator. Simply enter your information, preview your document, complete payment, and download instantly. Our system automatically calculates taxes and formats everything professionally."
      },
      {
        question: "How can I contact MintSlip's customer service?",
        answer: "You can reach us through our Contact page or email us directly at support@mintslip.com. Our team typically responds within 24 hours and is ready to assist you with any questions."
      },
      {
        question: "Are documents created with MintSlip legal?",
        answer: "Yes, all documents created on MintSlip are professionally formatted and include accurate calculations. However, please note that these documents should only be used for legitimate purposes and the information entered must be accurate and truthful."
      },
      {
        question: "Will my information be safe on this site?",
        answer: "Absolutely! We prioritize your privacy and security. All documents are generated directly in your browser - we do not store your personal information on our servers. Your data stays on your device and is never transmitted to third parties."
      },
      {
        question: "Can I create documents from my mobile device?",
        answer: "Yes! Our website is fully responsive and works on all devices including smartphones and tablets. You can create and download your documents on any device with a modern web browser."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major payment methods through PayPal, including credit cards (Visa, Mastercard, American Express, Discover), debit cards, and PayPal balance. All payments are processed securely."
      },
      {
        question: "Can I get a refund?",
        answer: "Due to the digital nature of our products, we generally do not offer refunds for completed orders. However, if there's an issue with your document or you experience technical problems, please contact our support team and we'll work to resolve the issue."
      },
      {
        question: "Is there a charge to remove the watermark?",
        answer: "No, there's no additional charge. The watermark appears on the preview only. Once you complete your purchase, your downloaded document will not have any watermark."
      }
    ]
  },
  paystub: {
    title: "Pay Stub Questions",
    icon: Receipt,
    questions: [
      {
        question: "What information is included in a pay stub?",
        answer: "Our pay stubs include: gross earnings, federal and state tax withholdings, Social Security and Medicare taxes (FICA), any additional deductions, net pay, and year-to-date (YTD) totals. The document also includes employer and employee information, pay period dates, and payment details."
      },
      {
        question: "What is Net Pay?",
        answer: "Net pay is the amount you actually receive after all taxes and deductions have been subtracted from your gross pay. It's commonly referred to as your 'take-home pay.'"
      },
      {
        question: "What does YTD mean on a pay stub?",
        answer: "YTD stands for 'Year-to-Date.' It represents the cumulative total of your earnings and deductions from January 1st through the current pay period. This helps track your total income and tax payments throughout the year."
      },
      {
        question: "What does gross pay mean?",
        answer: "Gross pay is your total earnings before any taxes or deductions are taken out. For example, if you earn $25 per hour and work 40 hours, your gross pay is $1,000."
      },
      {
        question: "What is the difference between gross and net pay?",
        answer: "Gross pay is your total earnings before deductions. Net pay is what you actually receive after taxes and deductions are subtracted. For example, if your gross pay is $2,000 and $500 is deducted for taxes, your net pay is $1,500."
      },
      {
        question: "What is the difference between an employee and a contractor?",
        answer: "An employee (W-2) has taxes withheld by their employer and receives benefits. A contractor (1099) is self-employed, doesn't have taxes withheld, and is responsible for paying their own taxes. Our system supports both types with appropriate tax calculations."
      },
      {
        question: "Why am I seeing $0 for federal or state tax?",
        answer: "This can happen if the earnings amount is below the tax threshold for that pay period, or if you've selected 'Contractor' status (contractors don't have taxes withheld). Double-check your worker type and earnings to ensure accuracy."
      },
      {
        question: "Can I create pay stubs for previous dates?",
        answer: "Yes, you can create pay stubs for any date. Simply enter the pay period start and end dates, and the system will calculate everything accordingly, including accurate YTD totals based on your hire date."
      },
      {
        question: "Do I need to calculate taxes manually?",
        answer: "No! Our system automatically calculates federal tax, state tax, Social Security, Medicare, and other deductions based on the information you provide. You just enter the basic information and we handle the math."
      },
      {
        question: "What pay stub templates are available?",
        answer: "We currently offer multiple professional templates including a standard template and a Gusto-style template. Each template is professionally designed and includes all necessary information for a complete pay stub."
      }
    ]
  },
  bankstatement: {
    title: "Accounting Mockup Questions",
    icon: Building2,
    questions: [
      {
        question: "What information is included in a accounting mockup?",
        answer: "Our accounting mockups include: account holder information, account number, statement period, beginning and ending balances, detailed transaction history with dates and descriptions, and a comprehensive summary of deposits, withdrawals, and fees."
      },
      {
        question: "Can I add custom transactions?",
        answer: "Yes! You can add as many transactions as you need, including deposits, withdrawals, purchases, transfers, and fees. Each transaction can have a custom date, description, and amount."
      },
      {
        question: "What accounting mockup templates are available?",
        answer: "We offer multiple professional templates that are meticulously styled. Each template includes accurate formatting, proper sections, and professional layouts."
      },
      {
        question: "Can I create statements for previous months?",
        answer: "Yes, you can create accounting mockups for any month. Simply select the statement month and enter your transactions for that period."
      },
      {
        question: "How many transactions can I include?",
        answer: "You can include as many transactions as needed for your statement period. There's no limit on the number of transactions you can add."
      },
      {
        question: "Will the statement show accurate running balances?",
        answer: "Yes! Our system automatically calculates the running balance for each transaction based on your beginning balance and the transaction amounts. The ending balance is also calculated automatically."
      }
    ]
  },
  w2: {
    title: "W-2 Form Questions",
    icon: FileText,
    questions: [
      {
        question: "What is a W-2 form?",
        answer: "A W-2 form is an official IRS tax document that reports an employee's annual wages and the amount of taxes withheld from their paycheck. Employers are required to provide W-2 forms to employees by January 31st each year for tax filing purposes."
      },
      {
        question: "Who needs to receive a W-2 form?",
        answer: "Any employee who received wages from an employer during the tax year should receive a W-2 form. This does not apply to independent contractors or freelancers, who receive 1099 forms instead."
      },
      {
        question: "What information is included on a W-2?",
        answer: "A W-2 includes: employer and employee information, wages and tips (Box 1), federal tax withheld (Box 2), Social Security wages and tax (Boxes 3-4), Medicare wages and tax (Boxes 5-6), state and local tax information (Boxes 15-20), and various codes for benefits and deductions (Box 12)."
      },
      {
        question: "What are Box 12 codes on a W-2?",
        answer: "Box 12 codes report various types of compensation and benefits, such as: Code D (401k contributions), Code DD (health insurance costs), Code W (HSA contributions), and many others. Our system includes all standard Box 12 codes for you to select."
      },
      {
        question: "Can I create W-2 forms for multiple tax years?",
        answer: "Yes! Our W-2 generator supports multiple tax years. You can select from the current year and several previous years to create forms for the appropriate tax period."
      },
      {
        question: "Does the W-2 generator calculate taxes automatically?",
        answer: "Our W-2 generator includes an 'Auto-Calculate' feature that can help calculate Social Security and Medicare taxes based on the wages you enter. However, you should verify all amounts match your actual payroll records."
      },
      {
        question: "What is Box 13 on a W-2?",
        answer: "Box 13 contains three checkboxes: 'Statutory employee' (for certain types of workers), 'Retirement plan' (if the employee participated in a retirement plan), and 'Third-party sick pay' (if applicable). Our form includes all three options."
      },
      {
        question: "Can I include state and local tax information?",
        answer: "Yes! Our W-2 form includes complete state and local tax sections (Boxes 15-20) where you can enter state wages, state tax withheld, local wages, local tax, and locality name."
      }
    ]
  }
};

export default function FAQ() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");

  // Filter questions based on search
  const getFilteredQuestions = (category) => {
    if (!searchQuery.trim()) {
      return FAQ_CATEGORIES[category].questions;
    }
    
    const query = searchQuery.toLowerCase();
    return FAQ_CATEGORIES[category].questions.filter(
      q => q.question.toLowerCase().includes(query) || 
           q.answer.toLowerCase().includes(query)
    );
  };

  // Get all filtered questions across categories for search results
  const getAllFilteredQuestions = () => {
    if (!searchQuery.trim()) return null;
    
    const results = [];
    Object.entries(FAQ_CATEGORIES).forEach(([key, category]) => {
      const filtered = getFilteredQuestions(key);
      if (filtered.length > 0) {
        results.push({ category: key, title: category.title, questions: filtered });
      }
    });
    return results;
  };

  const searchResults = getAllFilteredQuestions();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            You asked, we answered
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-10">
            MintSlip's most frequently asked questions by our customers
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 text-base rounded-xl border-0 shadow-lg text-slate-800"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        
        {/* Show search results if searching */}
        {searchQuery.trim() && searchResults ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                Search Results
              </h2>
              <button 
                onClick={() => setSearchQuery("")}
                className="text-sm text-green-700 hover:text-green-800 font-medium"
              >
                Clear search
              </button>
            </div>
            
            {searchResults.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No results found for "{searchQuery}"</p>
                <p className="text-slate-400 text-sm mt-2">Try different keywords or browse categories below</p>
              </div>
            ) : (
              searchResults.map((result) => (
                <div key={result.category} className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                    {(() => {
                      const IconComponent = FAQ_CATEGORIES[result.category].icon;
                      return <IconComponent className="w-5 h-5 text-green-700" />;
                    })()}
                    {result.title}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-3">
                    {result.questions.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`${result.category}-${index}`}
                        className="bg-white rounded-xl border border-slate-200 px-6 shadow-sm"
                      >
                        <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-800 py-5">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-600 pb-5 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Category Tabs */
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-transparent h-auto p-0">
              {Object.entries(FAQ_CATEGORIES).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 data-[state=active]:border-green-700 data-[state=active]:bg-green-50 data-[state=active]:text-green-800 hover:border-green-300 transition-all"
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="font-medium text-sm">{category.title.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(FAQ_CATEGORIES).map(([key, category]) => (
              <TabsContent key={key} value={key} className="mt-8">
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
                    {category.title}
                  </h2>
                  <p className="text-slate-500">
                    {category.questions.length} questions answered
                  </p>
                </div>

                <Accordion type="single" collapsible className="space-y-4">
                  {category.questions.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`item-${index}`}
                      className="bg-white rounded-xl border border-slate-200 px-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <AccordionTrigger className="text-left font-semibold text-slate-800 hover:text-green-800 py-5">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600 pb-5 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </section>

      {/* Still Have Questions CTA */}
      <section className="bg-green-50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <HelpCircle className="w-8 h-8 text-green-700" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
            Still have questions?
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <Button 
            onClick={() => navigate("/contact")}
            size="lg"
            className="h-12 px-8 text-base font-semibold bg-green-800 hover:bg-green-900"
          >
            Contact Support
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
