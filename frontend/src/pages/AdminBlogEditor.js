import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  X,
  Code
} from "lucide-react";
import TiptapEditor from "@/components/TiptapEditor";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminBlogEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiKeywords, setAiKeywords] = useState("");
  
  const [post, setPost] = useState({
    title: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    author: "MintSlip Team",
    featuredImage: "",
    content: "",
    excerpt: "",
    category: "",
    tags: [],
    faqSchema: [],
    status: "draft",
    indexFollow: true,
    publishDate: new Date().toISOString().split('T')[0]
  });
  
  const [newTag, setNewTag] = useState("");
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    
    loadCategories();
    
    if (isEditing) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/blog/posts/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.status === 401) {
        navigate("/admin/login");
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setPost({
          ...data.post,
          publishDate: data.post.publishDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          tags: data.post.tags || [],
          faqSchema: data.post.faqSchema || []
        });
      } else {
        toast.error("Post not found");
        navigate("/admin/blog");
      }
    } catch (error) {
      console.error("Error loading post:", error);
      toast.error("Failed to load post");
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

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setPost(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const token = localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/blog/upload-image`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        setPost(prev => ({ ...prev, featuredImage: data.url }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error(data.detail || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  // Handler for WYSIWYG editor image uploads - returns the URL
  const handleEditorImageUpload = async (file) => {
    const token = localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/blog/upload-image`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        // Return full URL for the editor
        const imageUrl = data.url.startsWith('/') ? `${BACKEND_URL}${data.url}` : data.url;
        toast.success("Image inserted");
        return imageUrl;
      } else {
        toast.error("Failed to upload image");
        return null;
      }
    } catch (error) {
      toast.error("Error uploading image");
      return null;
    }
  };

  // AI Image Generation Handler
  const handleGenerateImage = async () => {
    if (!post.title.trim()) {
      toast.error("Please enter a blog title first");
      return;
    }
    
    setIsGeneratingImage(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/blog/generate-image`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: post.title,
          category: post.category || null,
          keywords: post.tags.join(", ") || null
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPost(prev => ({ ...prev, featuredImage: data.url }));
        toast.success("AI image generated successfully!");
      } else {
        toast.error(data.detail || "Failed to generate image");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Error generating AI image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (post.tags.includes(newTag.trim())) {
      toast.error("Tag already exists");
      return;
    }
    setPost(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
    setNewTag("");
  };

  const handleRemoveTag = (tag) => {
    setPost(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleAddFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      toast.error("Please fill in both question and answer");
      return;
    }
    setPost(prev => ({ ...prev, faqSchema: [...prev.faqSchema, { ...newFaq }] }));
    setNewFaq({ question: "", answer: "" });
  };

  const handleRemoveFaq = (index) => {
    setPost(prev => ({
      ...prev,
      faqSchema: prev.faqSchema.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (status = post.status) => {
    if (!post.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!post.slug.trim()) {
      toast.error("Please enter a slug");
      return;
    }
    if (!post.content.trim()) {
      toast.error("Please enter content");
      return;
    }
    
    setIsSaving(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      const endpoint = isEditing 
        ? `${BACKEND_URL}/api/admin/blog/posts/${id}`
        : `${BACKEND_URL}/api/admin/blog/posts`;
      
      const method = isEditing ? "PUT" : "POST";
      
      const payload = {
        ...post,
        status,
        publishDate: new Date(post.publishDate).toISOString()
      };
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(isEditing ? "Post updated!" : "Post created!");
        if (!isEditing && data.post?.id) {
          navigate(`/admin/blog/edit/${data.post.id}`);
        }
      } else {
        toast.error(data.detail || "Failed to save post");
      }
    } catch (error) {
      toast.error("Error saving post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    
    setIsGenerating(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      const params = new URLSearchParams({
        topic: aiTopic,
        keywords: aiKeywords,
        tone: "professional"
      });
      
      const response = await fetch(`${BACKEND_URL}/api/admin/blog/ai-generate?${params}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success && data.generated) {
        const generated = data.generated;
        setPost(prev => ({
          ...prev,
          title: prev.title || aiTopic,
          slug: prev.slug || generated.suggestedSlug || generateSlug(aiTopic),
          metaTitle: generated.metaTitle || prev.metaTitle,
          metaDescription: generated.metaDescription || prev.metaDescription,
          content: generated.content || prev.content,
          excerpt: generated.excerpt || prev.excerpt,
          faqSchema: generated.faqSchema || prev.faqSchema,
          tags: [...new Set([...prev.tags, ...(generated.suggestedTags || [])])]
        }));
        toast.success("Content generated! Review and edit as needed.");
        setAiDialogOpen(false);
        setAiTopic("");
        setAiKeywords("");
      } else {
        toast.error(data.detail || "Failed to generate content");
      }
    } catch (error) {
      toast.error("Error generating content");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <AdminLayout>
      {/* Page toolbar */}
      <div className="bg-white border-b border-slate-200 -mx-6 -mt-6 px-6 py-4 mb-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/blog")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-xl font-bold text-slate-800">
                {isEditing ? "Edit Post" : "New Post"}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? "Edit" : "Preview"}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiDialogOpen(true)}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI Assist
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSave("draft")}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Draft
              </Button>
              
              <Button
                onClick={() => handleSave("published")}
                disabled={isSaving}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {post.status === "published" ? "Update" : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {showPreview ? (
              /* Preview Mode */
              <div className="bg-white rounded-xl shadow-sm border p-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-4">{post.title || "Untitled"}</h1>
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content || "<p><em>No content yet</em></p>" }}
                />
              </div>
            ) : (
              /* Edit Mode */
              <>
                {/* Title & Slug */}
                <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                    <Input
                      value={post.title}
                      onChange={handleTitleChange}
                      placeholder="Enter post title"
                      className="text-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Slug *</label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">/blog/</span>
                      <Input
                        value={post.slug}
                        onChange={(e) => setPost(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                        placeholder="post-url-slug"
                      />
                    </div>
                  </div>
                </div>

                {/* Content - WYSIWYG Editor */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <label className="block text-sm font-medium text-slate-700 mb-4">Content *</label>
                  <TiptapEditor
                    content={post.content}
                    onChange={(html) => setPost(prev => ({ ...prev, content: html }))}
                    onImageUpload={handleEditorImageUpload}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Use the toolbar above to format text, add headings, lists, images, and links.
                  </p>
                </div>

                {/* Excerpt */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Excerpt</label>
                  <Textarea
                    value={post.excerpt}
                    onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief summary of the post (auto-generated if empty)"
                    rows={3}
                  />
                </div>

                {/* FAQ Schema */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <label className="block text-sm font-medium text-slate-700 mb-4">FAQ Schema (for SEO)</label>
                  
                  {post.faqSchema.map((faq, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-3 bg-slate-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{faq.question}</p>
                          <p className="text-sm text-slate-600 mt-1">{faq.answer}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFaq(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="space-y-3 mt-4 pt-4 border-t">
                    <Input
                      value={newFaq.question}
                      onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Question"
                    />
                    <Textarea
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                      placeholder="Answer"
                      rows={2}
                    />
                    <Button variant="outline" size="sm" onClick={handleAddFaq} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add FAQ
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Date */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <h3 className="font-semibold text-slate-800">Publish Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <Select 
                  value={post.status} 
                  onValueChange={(v) => setPost(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Publish Date</label>
                <Input
                  type="date"
                  value={post.publishDate}
                  onChange={(e) => setPost(prev => ({ ...prev, publishDate: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Author</label>
                <Input
                  value={post.author}
                  onChange={(e) => setPost(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>
            </div>

            {/* Featured Image */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Featured Image</h3>
                {post.featuredImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !post.title.trim()}
                    className="gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Regenerate
                  </Button>
                )}
              </div>
              
              {post.featuredImage ? (
                <div className="relative">
                  <img
                    src={post.featuredImage.startsWith('/') ? `${BACKEND_URL}${post.featuredImage}` : post.featuredImage}
                    alt="Featured"
                    className="w-full rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setPost(prev => ({ ...prev, featuredImage: "" }))}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* AI Generate Button */}
                  <Button
                    variant="outline"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !post.title.trim()}
                    className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating AI Image...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                  
                  {!post.title.trim() && (
                    <p className="text-xs text-slate-400 text-center">Enter a title to enable AI generation</p>
                  )}
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400">or upload manually</span>
                    </div>
                  </div>
                  
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 mx-auto text-slate-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500">Click to upload</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <h3 className="font-semibold text-slate-800">Category</h3>
              <Select 
                value={post.category || "none"} 
                onValueChange={(v) => setPost(prev => ({ ...prev, category: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <h3 className="font-semibold text-slate-800">Tags</h3>
              
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 bg-slate-100 rounded text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button variant="outline" size="sm" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <h3 className="font-semibold text-slate-800">SEO Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta Title <span className="text-slate-400">({(post.metaTitle || post.title).length}/60)</span>
                </label>
                <Input
                  value={post.metaTitle}
                  onChange={(e) => setPost(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder={post.title || "SEO title"}
                  maxLength={60}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta Description <span className="text-slate-400">({(post.metaDescription || "").length}/160)</span>
                </label>
                <Textarea
                  value={post.metaDescription}
                  onChange={(e) => setPost(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="Brief description for search engines"
                  rows={3}
                  maxLength={160}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="indexFollow"
                  checked={post.indexFollow}
                  onChange={(e) => setPost(prev => ({ ...prev, indexFollow: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="indexFollow" className="text-sm text-slate-700">
                  Allow search engines to index this post
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generation Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Content Generator
            </DialogTitle>
            <DialogDescription>
              Generate blog content using AI. The generated content can be edited after.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Topic / Title *</label>
              <Input
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., How to Create a Pay Stub for Self-Employment"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Keywords (optional)</label>
              <Input
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                placeholder="e.g., pay stub, self-employed, proof of income"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAiGenerate} 
              disabled={isGenerating || !aiTopic.trim()}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Content
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
