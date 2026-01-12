import { useNavigate } from "react-router-dom";
import { useState, useMemo, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { 
  Search,
  Receipt,
  FileText,
  FileBarChart,
  Users,
  Landmark,
  Mail,
  Car,
  Zap,
  MapPin,
  PiggyBank,
  ArrowRight,
  Sparkles,
  Filter,
  Grid3X3,
  List,
  X,
  TreePine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Custom hook for intersection observer
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isInView];
};

// All available generators data
const generators = [
  {
    id: "paystub",
    name: "Pay Stub Generator",
    description: "Generate professional pay stubs with accurate tax calculations, direct deposit information, and customizable pay periods.",
    path: "/paystub-generator",
    icon: Receipt,
    price: "$9.99",
    category: "Income Documents",
    tags: ["paystub", "pay stub", "paycheck", "salary", "wages", "income", "employee", "w2"],
    popular: true
  },
  {
    id: "canadian-paystub",
    name: "Canadian Pay Stub Generator",
    description: "Generate Canadian pay stubs with accurate CPP/QPP, EI, and provincial tax calculations for all provinces and territories.",
    path: "/canadian-paystub-generator",
    icon: TreePine,
    iconColor: "text-red-600",
    price: "$9.99",
    category: "Income Documents",
    tags: ["canadian", "canada", "paystub", "cpp", "ei", "provincial tax", "quebec"]
  },
    {
    id: "ai-resume",
    name: "AI Resume Builder",
    description: "Create an ATS-optimized resume tailored to your target job in minutes",
    path: "/ai-resume-builder",
    icon: Sparkles,
    price: "$9.99",
    category: "Employment Documents",
    tags: ["ai", "resume", "resume builder", "ats", "employment"]
  },
  // {
  //   id: "accounting-mockup",
  //   name: "Accounting Mockups Generator",
  //   description: "Generate statement templates for personal bookkeeping and organizational purposes.",
  //   path: "/accounting-mockup-generator",
  //   icon: PiggyBank,
  //   price: "$49.99",
  //   category: "Financial Documents",
  //   tags: ["bank statement", "accounting", "mockup", "bank", "financial", "statement", "bookkeeping"],
  //   popular: true
  // },
  {
    id: "w2",
    name: "W-2 Form Generator",
    description: "Create fully detailed W-2 forms with accurate wage information, tax breakdowns, employer/employee details, and clean formatting.",
    path: "/w2-generator",
    icon: FileText,
    price: "$14.99",
    category: "Tax Forms",
    tags: ["w2", "w-2", "tax form", "wages", "annual", "employer", "irs", "federal"]
  },
  {
    id: "w9",
    name: "W-9 Form Generator",
    description: "Generate W-9 Request for Taxpayer Identification Number and Certification forms with all required fields.",
    path: "/w9-generator",
    icon: FileText,
    price: "$14.99",
    category: "Tax Forms",
    tags: ["w9", "w-9", "tin", "taxpayer", "certification", "contractor", "vendor"],
    isNew: true
  },
  {
    id: "1099-nec",
    name: "1099-NEC Generator",
    description: "Generate 1099-NEC forms for nonemployee compensation. Perfect for contractor and freelancer payments.",
    path: "/1099-nec-generator",
    icon: Users,
    price: "$14.99",
    category: "Tax Forms",
    tags: ["1099", "nec", "contractor", "freelancer", "nonemployee", "compensation", "independent"],
    isNew: true
  },
  {
    id: "1099-misc",
    name: "1099-MISC Generator",
    description: "Create 1099-MISC forms for miscellaneous income including rents, royalties, and other payments.",
    path: "/1099-misc-generator",
    icon: Landmark,
    price: "$14.99",
    category: "Tax Forms",
    tags: ["1099", "misc", "miscellaneous", "rent", "royalties", "prizes", "awards"],
    isNew: true
  },
  {
    id: "schedule-c",
    name: "Schedule C Generator",
    description: "Generate Schedule C forms for sole proprietors with complete income, expenses, and profit/loss calculations.",
    path: "/schedule-c-generator",
    icon: FileBarChart,
    price: "$14.99",
    category: "Tax Forms",
    tags: ["schedule c", "sole proprietor", "business", "profit", "loss", "self-employed", "irs"],
    isNew: true
  },
  {
    id: "offer-letter",
    name: "Offer Letter Generator",
    description: "Create professional employment offer letters with 3 customizable templates and signature lines.",
    path: "/offer-letter-generator",
    icon: Mail,
    price: "$9.99",
    category: "Employment Documents",
    tags: ["offer letter", "employment", "job offer", "hiring", "hr", "signature", "template"]
  },
  {
    id: "vehicle-bill-of-sale",
    name: "Vehicle Bill of Sale Generator",
    description: "Create professional vehicle bill of sale documents with seller/buyer info, vehicle details, and optional notary section.",
    path: "/vehicle-bill-of-sale-generator",
    icon: Car,
    price: "$9.99",
    category: "Legal Documents",
    tags: ["vehicle", "bill of sale", "car", "auto", "seller", "buyer", "notary", "vin"],
    isNew: true
  },
  // {
  //   id: "service-expense",
  //   name: "Service Expense Generator",
  //   description: "Generate professional service expense statements for home budgeting with custom logos and 3 template styles.",
  //   path: "/service-expense-generator",
  //   icon: Zap,
  //   price: "$49.99",
  //   category: "Financial Documents",
  //   tags: ["utility", "bill", "expense", "service", "electric", "gas", "water", "budget"]
  // }
];

// Get unique categories
const categories = [...new Set(generators.map(g => g.category))];

export default function DocumentDirectory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [heroRef, heroInView] = useInView();
  const [resultsRef, resultsInView] = useInView();
  const searchInputRef = useRef(null);

  // Filter generators based on search query and category
  const filteredGenerators = useMemo(() => {
    let results = generators;

    // Filter by category
    if (selectedCategory !== "All") {
      results = results.filter(g => g.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(g => 
        g.name.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.tags.some(tag => tag.toLowerCase().includes(query)) ||
        g.category.toLowerCase().includes(query)
      );
    }

    return results;
  }, [searchQuery, selectedCategory]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Document Generator Directory | MintSlip - All Generators</title>
        <meta name="description" content="Browse all MintSlip document generators. Find paystub generators, tax forms (W-2, W-9, 1099), offer letters, vehicle bill of sale, and more. Search and filter by category." />
        <meta name="keywords" content="document generator directory, paystub generator, W-2 generator, 1099 generator, tax form generator, offer letter generator" />
        <meta property="og:title" content="Document Generator Directory | MintSlip" />
        <meta property="og:description" content="Browse and search all MintSlip document generators. Find the right generator for your needs." />
        <link rel="canonical" href="https://mintslip.com/generators" />
      </Helmet>

      <Header title="MintSlip" />

      {/* Hero Section with Search */}
      <section ref={heroRef} className="relative py-16 md:py-20 bg-gradient-to-br from-slate-50 to-green-50 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-100 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-100 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="max-w-4xl mx-auto px-6 relative">
          <div 
            className="text-center space-y-6"
            style={{
              opacity: heroInView ? 1 : 0,
              transform: heroInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease-out'
            }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-green-200 shadow-sm">
              <Sparkles className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">{generators.length} Document Generators</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', lineHeight: '1.1' }}>
              <span className="text-slate-800">Document</span>
              <span className="block text-green-700">Generator Directory</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Search and browse all available document generators. Find the right tool for paystubs, tax forms, legal documents, and more.
            </p>

            {/* Search Bar */}
            <div 
              className="max-w-2xl mx-auto pt-4"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.6s ease-out 0.2s'
              }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search generators (e.g., 'paystub', 'W-2', '1099', 'contractor')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-6 text-lg border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-green-500 shadow-lg"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div 
              className="flex flex-wrap gap-2 justify-center pt-2"
              style={{
                opacity: heroInView ? 1 : 0,
                transform: heroInView ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.6s ease-out 0.3s'
              }}
            >
              <button
                onClick={() => setSelectedCategory("All")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === "All"
                    ? "bg-green-700 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                All ({generators.length})
              </button>
              {categories.map((category) => {
                const count = generators.filter(g => g.category === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-green-700 text-white shadow-md"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    {category} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section ref={resultsRef} className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Results Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {searchQuery ? (
                  <>
                    {filteredGenerators.length} result{filteredGenerators.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                  </>
                ) : selectedCategory !== "All" ? (
                  <>
                    {filteredGenerators.length} {selectedCategory} Generator{filteredGenerators.length !== 1 ? 's' : ''}
                  </>
                ) : (
                  <>All Document Generators</>
                )}
              </h2>
              {searchQuery && filteredGenerators.length === 0 && (
                <p className="text-slate-500 mt-1">Try a different search term or clear filters</p>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "grid" 
                    ? "bg-white shadow-sm text-green-700" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-all ${
                  viewMode === "list" 
                    ? "bg-white shadow-sm text-green-700" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* No Results State */}
          {filteredGenerators.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-2">No generators found</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                We couldn&apos;t find any generators matching &ldquo;{searchQuery}&rdquo;. Try adjusting your search or browse all categories.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="bg-green-700 hover:bg-green-800"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Grid View */}
          {viewMode === "grid" && filteredGenerators.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGenerators.map((generator, index) => {
                const IconComponent = generator.icon;
                return (
                  <button
                    key={generator.id}
                    onClick={() => navigate(generator.path)}
                    className="group relative p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-green-600 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left"
                    style={{
                      opacity: resultsInView ? 1 : 0,
                      transform: resultsInView ? 'translateY(0)' : 'translateY(20px)',
                      transition: `all 0.4s ease-out ${0.05 * index}s`
                    }}
                  >
                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {generator.popular && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          POPULAR
                        </span>
                      )}
                      {generator.isNew && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-700 transition-colors`}>
                      <IconComponent className={`w-6 h-6 ${generator.iconColor || 'text-green-700'} group-hover:text-white transition-colors`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-green-700 transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {generator.name}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {generator.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-green-700">{generator.price}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        {generator.category}
                      </span>
                    </div>

                    {/* Arrow indicator */}
                    <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-slate-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && filteredGenerators.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <div className="col-span-5">Generator</div>
                <div className="col-span-3">Category</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {/* Table Rows */}
              {filteredGenerators.map((generator, index) => {
                const IconComponent = generator.icon;
                return (
                  <div
                    key={generator.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 border-b border-slate-100 hover:bg-green-50/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(generator.path)}
                    style={{
                      opacity: resultsInView ? 1 : 0,
                      transform: resultsInView ? 'translateX(0)' : 'translateX(-20px)',
                      transition: `all 0.3s ease-out ${0.03 * index}s`
                    }}
                  >
                    {/* Generator Info */}
                    <div className="col-span-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors`}>
                        <IconComponent className={`w-5 h-5 ${generator.iconColor || 'text-green-700'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-800 group-hover:text-green-700 transition-colors">
                            {generator.name}
                          </h3>
                          {generator.popular && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              POPULAR
                            </span>
                          )}
                          {generator.isNew && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 truncate hidden lg:block">
                          {generator.description}
                        </p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-3 flex items-center">
                      <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        {generator.category}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-2 flex items-center">
                      <span className="font-bold text-green-700">{generator.price}</span>
                    </div>

                    {/* Action */}
                    <div className="col-span-2 flex items-center justify-end">
                      <Button
                        size="sm"
                        className="bg-green-700 hover:bg-green-800 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Open
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Generators", value: generators.length },
              { label: "Tax Forms", value: generators.filter(g => g.category === "Tax Forms").length },
              { label: "Income Documents", value: generators.filter(g => g.category === "Income Documents").length },
              { label: "New This Month", value: generators.filter(g => g.isNew).length }
            ].map((stat, index) => (
              <div 
                key={index}
                className="bg-slate-50 rounded-xl p-4 text-center"
                style={{
                  opacity: resultsInView ? 1 : 0,
                  transform: resultsInView ? 'translateY(0)' : 'translateY(10px)',
                  transition: `all 0.4s ease-out ${0.6 + (0.1 * index)}s`
                }}
              >
                <div className="text-3xl font-black text-green-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-800 to-emerald-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Can&apos;t Find What You Need?
          </h2>
          <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
            We&apos;re constantly adding new document generators. Contact us if you need a specific document type.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/contact")}
              size="lg"
              className="gap-2 px-8 py-6 bg-white text-green-800 hover:bg-green-50 shadow-lg"
            >
              Contact Us
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => navigate("/")}
              size="lg"
              variant="outline"
              className="gap-2 px-8 py-6 border-2 border-white text-white hover:bg-white/10"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
