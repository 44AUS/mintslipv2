import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonContent as IonModalContent,
  IonFooter, IonButton, IonButtons, IonSpinner,
} from "@ionic/react";
import { toast } from "sonner";
import {
  FileText, Plus, Pencil, Trash2, Eye, Search, Filter,
  Calendar, Clock, MoreVertical, ExternalLink, X,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminBlog() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const info = localStorage.getItem("adminInfo");
    if (!token) { navigate("/admin/login"); return; }
    if (info) setAdminInfo(JSON.parse(info));
    loadPosts();
    loadCategories();
  }, [currentPage, statusFilter]);

  const loadPosts = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("adminToken");
    try {
      const params = new URLSearchParams({ page: currentPage.toString(), limit: "20" });
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      const response = await fetch(`${BACKEND_URL}/api/admin/blog/posts?${params}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.status === 401) { navigate("/admin/login"); return; }
      const data = await response.json();
      if (data.success) { setPosts(data.posts); setTotalPages(data.pages); }
    } catch (error) {
      toast.error("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/blog/categories`);
      const data = await response.json();
      if (data.success) setCategories(data.categories);
    } catch (_) {}
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/blog/posts/${postToDelete.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) { toast.success("Post deleted successfully"); loadPosts(); }
      else toast.error("Failed to delete post");
    } catch (_) {
      toast.error("Error deleting post");
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return post.title.toLowerCase().includes(query) || post.slug.toLowerCase().includes(query);
  });

  return (
    <AdminLayout adminInfo={adminInfo} onRefresh={loadPosts}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Blog Management</h2>
        <IonButton color="primary" onClick={() => navigate("/admin/blog/new")}>
          <Plus size={16} style={{ marginRight: 6 }} />New Post
        </IonButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Posts", value: posts.length, bg: "rgba(22,163,74,0.12)", color: "#16a34a", icon: FileText },
          { label: "Published", value: posts.filter(p => p.status === "published").length, bg: "rgba(59,130,246,0.12)", color: "#3b82f6", icon: Eye },
          { label: "Drafts", value: posts.filter(p => p.status === "draft").length, bg: "rgba(234,179,8,0.12)", color: "#ca8a04", icon: Pencil },
          { label: "Total Views", value: posts.reduce((s, p) => s + (p.views || 0), 0), bg: "rgba(139,92,246,0.12)", color: "#8b5cf6", icon: Eye },
        ].map(({ label, value, bg, color, icon: Icon }) => (
          <div key={label} className="admin-stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="admin-stat-label">{label}</p>
                <p className="admin-stat-value">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 400 }}>
            <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
            <input
              className="admin-input"
              style={{ paddingLeft: 34 }}
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={16} style={{ color: "#64748b" }} />
            <select className="admin-select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl shadow-sm" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
            <IonSpinner name="crescent" color="primary" style={{ width: 32, height: 32 }} />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <FileText size={64} style={{ color: "#cbd5e1", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#475569", marginBottom: 8 }}>No posts yet</h3>
            <p style={{ color: "#64748b", marginBottom: 16 }}>Create your first blog post to get started</p>
            <IonButton color="primary" onClick={() => navigate("/admin/blog/new")}>
              <Plus size={16} style={{ marginRight: 6 }} />Create Post
            </IonButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 400 }}>Post</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Date</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        {post.featuredImage ? (
                          <img src={post.featuredImage.startsWith('/') ? `${BACKEND_URL}${post.featuredImage}` : post.featuredImage} alt="" style={{ width: 64, height: 48, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 64, height: 48, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FileText size={24} style={{ color: "#cbd5e1" }} />
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</p>
                          <p style={{ fontSize: "0.875rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/blog/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {post.category
                        ? <span className="admin-badge admin-badge-slate">{categories.find(c => c.slug === post.category)?.name || post.category}</span>
                        : <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>
                    <td>
                      <span className={`admin-badge ${post.status === "published" ? "admin-badge-green" : "admin-badge-amber"}`}>
                        {post.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>{post.views || 0}</td>
                    <td>
                      <div style={{ fontSize: "0.875rem" }}>
                        <span style={{ color: "#475569" }}>{formatDate(post.publishDate || post.createdAt)}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                          <Clock size={12} />{post.readingTime || 5} min
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ position: "relative" }}>
                        <button className="admin-action-btn" onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}>
                          <MoreVertical size={14} />
                        </button>
                        {openMenuPostId === post.id && (
                          <div className="user-action-menu">
                            <button className="profile-menu-item" onClick={() => { navigate(`/admin/blog/edit/${post.id}`); setOpenMenuPostId(null); }}>
                              <Pencil size={13} /> Edit
                            </button>
                            {post.status === "published" && (
                              <button className="profile-menu-item" onClick={() => { window.open(`/blog/${post.slug}`, '_blank'); setOpenMenuPostId(null); }}>
                                <ExternalLink size={13} /> View
                              </button>
                            )}
                            <div className="profile-menu-divider" />
                            <button className="profile-menu-item danger" onClick={() => { setPostToDelete(post); setDeleteDialogOpen(true); setOpenMenuPostId(null); }}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <IonModal isOpen={deleteDialogOpen} onDidDismiss={() => setDeleteDialogOpen(false)} style={{ "--width": "440px", "--max-width": "95vw", "--height": "auto" }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Delete Post</IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" color="medium" onClick={() => setDeleteDialogOpen(false)}><X size={20} /></IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonModalContent className="ion-padding">
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            Are you sure you want to delete "<strong>{postToDelete?.title}</strong>"? This action cannot be undone.
          </p>
        </IonModalContent>
        <IonFooter>
          <IonToolbar style={{ padding: "8px 16px" }}>
            <IonButtons slot="end">
              <IonButton fill="outline" color="medium" onClick={() => setDeleteDialogOpen(false)}>Cancel</IonButton>
              <IonButton color="danger" onClick={handleDelete}>Delete Post</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </IonModal>
    </AdminLayout>
  );
}
