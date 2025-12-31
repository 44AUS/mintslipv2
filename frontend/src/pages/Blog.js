import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  Tag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Blog() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters from URL
  const currentPage = parseInt(searchParams.get("page") || "1");
  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "newest";
  
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    loadPosts();
    loadCategories();
  }, [currentPage, currentCategory, currentSearch, currentSort]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "9",
        sort: currentSort
      });
      
      if (currentCategory) params.append("category", currentCategory);
      if (currentSearch) params.append("search", currentSearch);
      
      const response = await fetch(`${BACKEND_URL}/api/blog/posts?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/blog/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const updateFilters = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    // Reset to page 1 when filters change (except page itself)
    if (!("page" in updates)) {
      newParams.set("page", "1");
    }
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <>
      <Helmet>
        <title>Blog - Pay Stub Tips, Payroll Guides & Financial Documentation | MintSlip</title>
        <meta name="description" content="Expert guides on pay stubs, proof of income, payroll management, and financial documentation. Learn how to create professional pay stubs and manage your finances." />
        <meta property="og:title" content="MintSlip Blog - Pay Stub & Payroll Guides" />
        <meta property="og:description" content="Expert guides on pay stubs, proof of income, and financial documentation." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://mintslip.com/blog" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-800 to-emerald-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">MintSlip Blog</h1>
            <p className="text-xl text-green-100 max-w-2xl">
              Expert guides, tips, and resources for pay stubs, proof of income, payroll, and financial documentation.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search articles..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>
              
              {/* Category Filter */}
              <Select 
                value={currentCategory || "all"} 
                onValueChange={(v) => updateFilters({ category: v === "all" ? "" : v })}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name} ({cat.postCount || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Sort */}
              <Select value={currentSort} onValueChange={(v) => updateFilters({ sort: v })}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Active Filters */}
            {(currentCategory || currentSearch) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-slate-500">Filters:</span>
                {currentCategory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilters({ category: "" })}
                    className="gap-1"
                  >
                    {categories.find(c => c.slug === currentCategory)?.name || currentCategory}
                    <span className="ml-1">×</span>
                  </Button>
                )}
                {currentSearch && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSearchInput(""); updateFilters({ search: "" }); }}
                    className="gap-1"
                  >
                    Search: {currentSearch}
                    <span className="ml-1">×</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Posts Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No articles found</h3>
              <p className="text-slate-500">
                {currentSearch || currentCategory
                  ? "Try adjusting your filters"
                  : "Check back soon for new content!"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                  >
                    {/* Featured Image */}
                    {post.featuredImage ? (
                      <div className="aspect-video bg-slate-100 overflow-hidden">
                        <img
                          src={post.featuredImage.startsWith('/') ? `${BACKEND_URL}${post.featuredImage}` : post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-green-300" />
                      </div>
                    )}
                    
                    <div className="p-5">
                      {/* Category */}
                      {post.category && (
                        <span className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded mb-3">
                          {categories.find(c => c.slug === post.category)?.name || post.category}
                        </span>
                      )}
                      
                      {/* Title */}
                      <h2 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors">
                        {post.title}
                      </h2>
                      
                      {/* Excerpt */}
                      <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                      
                      {/* Meta */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(post.publishDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readingTime || 5} min read
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => updateFilters({ page: (currentPage - 1).toString() })}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="text-sm text-slate-600 px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => updateFilters({ page: (currentPage + 1).toString() })}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Create Professional Pay Stubs?</h2>
            <p className="text-green-100 mb-6 max-w-xl mx-auto">
              Generate accurate, professional pay stubs in minutes with our easy-to-use generator.
            </p>
            <Button
              onClick={() => navigate("/paystub-generator")}
              size="lg"
              className="bg-white text-green-700 hover:bg-green-50 gap-2"
            >
              Create Pay Stub Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
