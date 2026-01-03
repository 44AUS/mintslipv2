import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, FileText, Building2, Receipt, Search, ClipboardList, FileCheck, FileBadge } from "lucide-react";
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
        answer: "We accept all major payment methods through Stripe, including credit cards (Visa, Mastercard, American Express, Discover), debit cards, Apple Pay, and Google Pay. All payments are processed securely."
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
  },
  w9: {
    title: "W-9 Form Questions",
    icon: FileCheck,
    questions: [
      {
        question: "What is a W-9 form?",
        answer: "A W-9 form (Request for Taxpayer Identification Number and Certification) is an IRS form used to provide your correct taxpayer identification number (TIN) to a person or entity who is required to file information returns with the IRS. It's commonly used by independent contractors and freelancers."
      },
      {
        question: "Who needs to fill out a W-9?",
        answer: "You typically need to fill out a W-9 if you're an independent contractor, freelancer, self-employed individual, or business receiving payments from another business. Clients use the information to report payments made to you to the IRS via Form 1099."
      },
      {
        question: "Should I use my SSN or EIN on the W-9?",
        answer: "If you're a sole proprietor or single-member LLC, you can use either your SSN or EIN. If you have an EIN, it's generally recommended to use it for business purposes to protect your personal SSN. Corporations and partnerships must use their EIN."
      },
      {
        question: "What are the federal tax classifications?",
        answer: "The W-9 includes several tax classifications: Individual/Sole Proprietor, C Corporation, S Corporation, Partnership, Trust/Estate, Limited Liability Company (LLC), and Exempt Payee. Your classification affects how your income is taxed and reported."
      },
      {
        question: "What is backup withholding?",
        answer: "Backup withholding is when payers withhold 24% of your payments and send it to the IRS. This happens if you don't provide a valid TIN or if the IRS notifies the payer that you're subject to backup withholding. Properly completing your W-9 helps avoid this."
      },
      {
        question: "Do I need to sign the W-9?",
        answer: "Yes, the W-9 requires a signature certifying that the information provided is correct. Our generator creates a complete W-9 form ready for your signature. You can sign it electronically or print and sign manually."
      },
      {
        question: "How often do I need to submit a new W-9?",
        answer: "You generally only need to submit a new W-9 when your information changes (name, address, TIN, or tax classification). Unlike W-2s, W-9s don't need to be submitted annually. Requesters may ask for an updated W-9 periodically for their records."
      },
      {
        question: "Is my W-9 information secure?",
        answer: "Absolutely! Our W-9 generator processes all information directly in your browser. We do not store your SSN, EIN, or any personal information on our servers. Your data stays private and secure on your device."
      }
    ]
  },
  form1099nec: {
    title: "1099-NEC Form Questions",
    icon: FileBadge,
    questions: [
      {
        question: "What is a 1099-NEC form?",
        answer: "Form 1099-NEC (Nonemployee Compensation) is used to report payments of $600 or more made to independent contractors, freelancers, and other self-employed individuals during the tax year. It replaced Box 7 of the 1099-MISC starting in 2020."
      },
      {
        question: "Who receives a 1099-NEC?",
        answer: "Independent contractors, freelancers, consultants, and other self-employed individuals who earned $600 or more from a single client during the tax year receive a 1099-NEC. This includes gig workers, consultants, and anyone providing services as a non-employee."
      },
      {
        question: "What's the difference between 1099-NEC and 1099-MISC?",
        answer: "The 1099-NEC is specifically for nonemployee compensation (payments to independent contractors), while 1099-MISC is used for other types of miscellaneous income like rent, royalties, prizes, and awards. Before 2020, nonemployee compensation was reported on 1099-MISC Box 7."
      },
      {
        question: "What is Box 1 on the 1099-NEC?",
        answer: "Box 1 reports nonemployee compensation - the total amount paid to the recipient for services performed. This includes fees, commissions, prizes, awards, and other forms of compensation for services as a nonemployee."
      },
      {
        question: "What is Box 4 (Federal tax withheld)?",
        answer: "Box 4 shows any federal income tax that was withheld from payments. This typically occurs due to backup withholding (24%) when a contractor hasn't provided a valid TIN or is subject to IRS notification for backup withholding."
      },
      {
        question: "When is the 1099-NEC due?",
        answer: "The 1099-NEC must be furnished to recipients by January 31st and filed with the IRS by January 31st (no automatic extension). This deadline is earlier than many other 1099 forms to help recipients file their taxes on time."
      },
      {
        question: "Do I need to report state information?",
        answer: "If you withheld state income tax, you should report the state, state ID number, and state income in Boxes 5-7. Some states require 1099-NEC filing even without withholding. Our generator supports state tax information."
      },
      {
        question: "Can I generate 1099-NEC forms for previous years?",
        answer: "Yes! Our 1099-NEC generator supports multiple tax years. Simply select the appropriate tax year from the dropdown menu. This is helpful for correcting records or creating forms for prior years."
      }
    ]
  },
  form1099misc: {
    title: "1099-MISC Form Questions",
    icon: FileBadge,
    questions: [
      {
        question: "What is a 1099-MISC form?",
        answer: "Form 1099-MISC (Miscellaneous Information) is used to report various types of miscellaneous income including rents, royalties, prizes, awards, medical and health care payments, crop insurance proceeds, and other income payments that don't fall under other specific 1099 forms."
      },
      {
        question: "What types of income are reported on 1099-MISC?",
        answer: "1099-MISC reports: Rents (Box 1), Royalties (Box 2), Other income (Box 3), Medical/healthcare payments (Box 6), Crop insurance proceeds (Box 9), Gross proceeds to attorneys (Box 10), and Section 409A deferrals (Box 12). Nonemployee compensation is now reported on 1099-NEC instead."
      },
      {
        question: "What is Box 1 (Rents)?",
        answer: "Box 1 reports rental income paid to a landlord totaling $600 or more during the year. This includes payments for real estate rentals, equipment rentals, or any other type of rental property used in the payer's trade or business."
      },
      {
        question: "What is Box 2 (Royalties)?",
        answer: "Box 2 reports royalty payments of $10 or more. This includes payments for the use of intellectual property such as patents, copyrights, trademarks, trade names, and natural resources like oil, gas, and minerals."
      },
      {
        question: "What is Box 3 (Other income)?",
        answer: "Box 3 reports other income not covered by other boxes, including prizes and awards, punitive damages, Indian gaming profits, and other taxable income of $600 or more that doesn't fit elsewhere on the form."
      },
      {
        question: "When is the 1099-MISC due?",
        answer: "The 1099-MISC must be furnished to recipients by January 31st for most boxes (or February 15th for Boxes 8 and 10). The form must be filed with the IRS by February 28th (paper filing) or March 31st (electronic filing)."
      },
      {
        question: "Should I use 1099-MISC or 1099-NEC for contractors?",
        answer: "Use 1099-NEC for nonemployee compensation (payments to independent contractors). Use 1099-MISC for other types of miscellaneous income like rent, royalties, and prizes. Since 2020, contractor payments are no longer reported on 1099-MISC."
      },
      {
        question: "Can I generate 1099-MISC forms for previous years?",
        answer: "Yes! Our 1099-MISC generator supports multiple tax years. Select the appropriate tax year from the dropdown menu to generate forms for the current year or prior years as needed."
      }
    ]
  },
  scheduleC: {
    title: "Schedule C Form Questions",
    icon: ClipboardList,
    questions: [
      {
        question: "What is Schedule C?",
        answer: "Schedule C (Form 1040) is used to report profit or loss from a business you operated as a sole proprietor. It's filed with your personal tax return and calculates your net business income or loss, which is then reported on your Form 1040."
      },
      {
        question: "Who needs to file Schedule C?",
        answer: "You need to file Schedule C if you operate a business as a sole proprietor, are a single-member LLC (not treated as a corporation), are an independent contractor who received 1099-NEC income, or have self-employment income from freelancing or gig work."
      },
      {
        question: "What business expenses can I deduct?",
        answer: "Common deductible expenses include: advertising, car/truck expenses, contract labor, insurance, legal/professional services, office expenses, rent, repairs, supplies, travel, meals (50%), utilities, and wages. Our generator includes fields for all standard expense categories."
      },
      {
        question: "What is gross receipts vs net profit?",
        answer: "Gross receipts is your total business income before any deductions. Net profit is what remains after subtracting all allowable business expenses from your gross receipts. Your net profit is subject to both income tax and self-employment tax."
      },
      {
        question: "What is the home office deduction?",
        answer: "If you use part of your home exclusively and regularly for business, you may deduct home office expenses. You can use the simplified method ($5 per square foot, up to 300 sq ft) or the regular method (actual expenses based on percentage of home used)."
      },
      {
        question: "Do I need an EIN or can I use my SSN?",
        answer: "If you're a sole proprietor with no employees, you can use your Social Security Number. However, if you have employees, pay excise taxes, or have a Keogh plan, you need an EIN. Many sole proprietors get an EIN anyway to protect their SSN."
      },
      {
        question: "What accounting method should I use?",
        answer: "Most small businesses use cash basis accounting, where income is recorded when received and expenses when paid. Accrual accounting records income when earned and expenses when incurred. Once you choose a method, you generally must stick with it."
      },
      {
        question: "Can I generate Schedule C for previous years?",
        answer: "Yes! Our Schedule C generator supports multiple tax years. Select the appropriate tax year from the dropdown menu to generate forms for the current year or prior years as needed for your records."
      }
    ]
  }
};

// Generate FAQ Schema for SEO
const generateFAQSchema = () => {
  const allQuestions = [];
  Object.values(FAQ_CATEGORIES).forEach(category => {
    category.questions.forEach(q => {
      allQuestions.push({
        "@type": "Question",
        "name": q.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": q.answer
        }
      });
    });
  });
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allQuestions
  };
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
      <Helmet>
        <title>FAQ | MintSlip - Frequently Asked Questions</title>
        <meta name="description" content="Find answers to common questions about MintSlip's paystub generator, accountant mockups, W-2 forms, and more. Get help with document generation and payments." />
        <meta name="keywords" content="MintSlip FAQ, paystub questions, document generator help, tax form questions" />
        <meta property="og:title" content="FAQ | MintSlip" />
        <meta property="og:description" content="Get answers to frequently asked questions about our document generation services." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="MintSlip FAQ" />
        <meta name="twitter:description" content="Answers to common questions about document generation." />
        <script type="application/ld+json">
          {JSON.stringify(generateFAQSchema())}
        </script>
      </Helmet>
      
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
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-transparent h-auto p-0">
              {Object.entries(FAQ_CATEGORIES).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl border-2 border-slate-200 data-[state=active]:border-green-700 data-[state=active]:bg-green-50 data-[state=active]:text-green-800 hover:border-green-300 transition-all"
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium text-xs truncate">{category.title.replace(' Questions', '').replace(' Form', '')}</span>
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
