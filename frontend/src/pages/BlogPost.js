import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Tag,
  User,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ChevronRight,
  FileText,
  Loader2
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Check if content is HTML (from WYSIWYG editor) or Markdown
const isHtmlContent = (content) => {
  if (!content) return false;
  // Check for common HTML tags
  return /<[a-z][\s\S]*>/i.test(content) && 
         (content.includes('<p>') || content.includes('<h1>') || content.includes('<h2>') || content.includes('<div>'));
};

// Generate table of contents from HTML content
const extractHeadingsFromHtml = (html) => {
  const headings = [];
  if (!html) return headings;
  
  // Parse HTML to extract h2 and h3 headings
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const h2s = doc.querySelectorAll('h2');
  const h3s = doc.querySelectorAll('h3');
  const allHeadings = [...doc.querySelectorAll('h2, h3')];
  
  allHeadings.forEach((heading) => {
    const text = heading.textContent || '';
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    headings.push({
      level: heading.tagName === 'H2' ? 2 : 3,
      text,
      id
    });
  });
  
  return headings;
};

// Generate table of contents from markdown (legacy support)
const extractHeadingsFromMarkdown = (markdown) => {
  const headings = [];
  const lines = markdown.split('\n');
  
  lines.forEach((line, index) => {
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);
    
    if (h2Match) {
      const text = h2Match[1].replace(/\*\*/g, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ level: 2, text, id });
    } else if (h3Match) {
      const text = h3Match[1].replace(/\*\*/g, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ level: 3, text, id });
    }
  });
  
  return headings;
};

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadPost();
    loadCategories();
  }, [slug]);

  const loadPost = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/blog/posts/${slug}`);
      const data = await response.json();
      
      if (data.success) {
        setPost(data.post);
        setRelated(data.related || []);
      } else {
        navigate("/blog");
      }
    } catch (error) {
      console.error("Error loading post:", error);
      navigate("/blog");
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

  // Determine if content is HTML or Markdown and extract headings accordingly
  const headings = useMemo(() => {
    if (!post?.content) return [];
    if (isHtmlContent(post.content)) {
      return extractHeadingsFromHtml(post.content);
    }
    return extractHeadingsFromMarkdown(post.content);
  }, [post?.content]);

  // Process content to add IDs to headings for anchor links
  const processedContent = useMemo(() => {
    if (!post?.content) return '';
    if (!isHtmlContent(post.content)) return post.content;
    
    // Add IDs to h2 and h3 elements for anchor links
    let content = post.content;
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    doc.querySelectorAll('h2, h3').forEach((heading) => {
      const text = heading.textContent || '';
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      heading.id = id;
      heading.className = 'scroll-mt-20';
    });
    
    return doc.body.innerHTML;
  }, [post?.content]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const handleShare = (platform) => {
    const title = post?.title || '';
    let url = '';
    
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="MintSlip" />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
        <Footer />
      </>
    );
  }

  if (!post) {
    return null;
  }

  // Schema.org structured data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.metaDescription,
    "image": post.featuredImage ? (post.featuredImage.startsWith('/') ? `https://mintslip.com${post.featuredImage}` : post.featuredImage) : "https://mintslip.com/og-image.png",
    "author": {
      "@type": "Organization",
      "name": post.author || "MintSlip Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "MintSlip",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mintslip.com/logo.png"
      }
    },
    "datePublished": post.publishDate,
    "dateModified": post.updatedAt || post.publishDate
  };

  const faqSchema = post.faqSchema?.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": post.faqSchema.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://mintslip.com" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://mintslip.com/blog" },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://mintslip.com/blog/${post.slug}` }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{post.metaTitle || post.title} | MintSlip Blog</title>
        <meta name="description" content={post.metaDescription || post.excerpt} />
        <meta name="robots" content={post.indexFollow ? "index, follow" : "noindex, nofollow"} />
        <link rel="canonical" href={`https://mintslip.com/blog/${post.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta property="og:description" content={post.metaDescription || post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://mintslip.com/blog/${post.slug}`} />
        <meta property="og:image" content={post.featuredImage ? (post.featuredImage.startsWith('/') ? `https://mintslip.com${post.featuredImage}` : post.featuredImage) : 'https://mintslip.com/favicon.ico'} />
        <meta property="og:site_name" content="MintSlip" />
        <meta property="article:published_time" content={post.publishDate} />
        <meta property="article:author" content={post.author} />
        
        {/* Twitter */}
        <meta name="twitter:card" content={post.featuredImage ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={post.metaTitle || post.title} />
        <meta name="twitter:description" content={post.metaDescription || post.excerpt} />
        <meta name="twitter:image" content={post.featuredImage ? (post.featuredImage.startsWith('/') ? `https://mintslip.com${post.featuredImage}` : post.featuredImage) : 'https://mintslip.com/favicon.ico'} />
        
        {/* Schema */}
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
      </Helmet>

      <Header title="MintSlip" />

      <div className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <div className="bg-slate-50 border-b">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/" className="hover:text-green-600">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/blog" className="hover:text-green-600">Blog</Link>
              {post.category && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <Link to={`/blog?category=${post.category}`} className="hover:text-green-600">
                    {categories.find(c => c.slug === post.category)?.name || post.category}
                  </Link>
                </>
              )}
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-700 truncate max-w-[200px]">{post.title}</span>
            </nav>
          </div>
        </div>

        <article className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <header className="mb-8">
            {post.category && (
              <Link 
                to={`/blog?category=${post.category}`}
                className="inline-block px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full mb-4 hover:bg-green-100"
              >
                {categories.find(c => c.slug === post.category)?.name || post.category}
              </Link>
            )}
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author || "MintSlip Team"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.publishDate)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readingTime || 5} min read
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={post.featuredImage.startsWith('/') ? `${BACKEND_URL}${post.featuredImage}` : post.featuredImage}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content Layout */}
          <div className="lg:flex lg:gap-12">
            {/* Table of Contents - Sidebar */}
            {headings.length > 0 && (
              <aside className="hidden lg:block lg:w-64 flex-shrink-0">
                <div className="sticky top-24">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Table of Contents</h4>
                  <nav className="space-y-2">
                    {headings.map((heading, index) => (
                      <a
                        key={index}
                        href={`#${heading.id}`}
                        className={`block text-sm text-slate-600 hover:text-green-600 transition-colors ${
                          heading.level === 3 ? 'pl-4' : ''
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                  
                  {/* Share Buttons */}
                  <div className="mt-8 pt-6 border-t">
                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Share Article</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleShare('facebook')}>
                        <Facebook className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleShare('twitter')}>
                        <Twitter className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleShare('linkedin')}>
                        <Linkedin className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleShare('copy')}>
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile TOC */}
              {headings.length > 0 && (
                <div className="lg:hidden mb-8 p-4 bg-slate-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Table of Contents</h4>
                  <nav className="space-y-2">
                    {headings.map((heading, index) => (
                      <a
                        key={index}
                        href={`#${heading.id}`}
                        className={`block text-sm text-slate-600 hover:text-green-600 ${
                          heading.level === 3 ? 'pl-4' : ''
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Article Content */}
              <div 
                className="prose prose-lg max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-a:text-green-600 prose-a:hover:text-green-700 prose-blockquote:border-l-green-500 prose-blockquote:bg-green-50 prose-blockquote:py-2 prose-blockquote:rounded-r prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />

              {/* CTA Block */}
              <div className="my-12 p-6 md:p-8 bg-gradient-to-r from-green-700 to-emerald-600 rounded-xl text-white">
                <h3 className="text-xl md:text-2xl font-bold mb-3">Create Professional Pay Stubs Instantly</h3>
                <p className="text-green-100 mb-4">
                  Generate accurate, professional pay stubs in minutes with MintSlip&apos;s easy-to-use generator.
                </p>
                <Button
                  onClick={() => navigate("/paystub-generator")}
                  className="bg-white text-green-700 hover:bg-green-50 gap-2"
                >
                  Generate Pay Stub Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* FAQ Section */}
              {post.faqSchema?.length > 0 && (
                <div className="my-12">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {post.faqSchema.map((faq, index) => (
                      <div key={index} className="border rounded-lg p-5">
                        <h3 className="font-semibold text-slate-800 mb-2">{faq.question}</h3>
                        <p className="text-slate-600">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-slate-400" />
                    {post.tags.map((tag, index) => (
                      <Link
                        key={index}
                        to={`/blog?search=${tag}`}
                        className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full hover:bg-green-50 hover:text-green-700"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Share */}
              <div className="lg:hidden mt-8 pt-6 border-t">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Share Article</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleShare('facebook')} className="gap-2">
                    <Facebook className="w-4 h-4" /> Facebook
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare('twitter')} className="gap-2">
                    <Twitter className="w-4 h-4" /> Twitter
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleShare('copy')} className="gap-2">
                    <LinkIcon className="w-4 h-4" /> Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="bg-slate-50 py-12">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((relPost) => (
                  <Link
                    key={relPost.id}
                    to={`/blog/${relPost.slug}`}
                    className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {relPost.featuredImage ? (
                      <div className="aspect-video bg-slate-100 overflow-hidden">
                        <img
                          src={relPost.featuredImage.startsWith('/') ? `${BACKEND_URL}${relPost.featuredImage}` : relPost.featuredImage}
                          alt={relPost.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-green-300" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-800 line-clamp-2 hover:text-green-700">
                        {relPost.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-2">
                        {relPost.readingTime || 5} min read
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back to Blog */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Button
            variant="outline"
            onClick={() => navigate("/blog")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Button>
        </div>
      </div>

      <Footer />
    </>
  );
}
