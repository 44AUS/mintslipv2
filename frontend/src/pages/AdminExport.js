import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { IonButton, IonSpinner } from "@ionic/react";
import { toast } from "sonner";
import { Download, FileText, Users, DollarSign } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

function ExportCard({ icon: Icon, title, description, exportType, dateFilters }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);

      const res = await fetch(`${BACKEND_URL}/api/admin/export/${exportType}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportType}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${title} exported successfully`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-stat-card" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <div style={{ padding: 12, background: "rgba(22,163,74,0.1)", borderRadius: 10 }}>
          <Icon size={24} style={{ color: "#16a34a" }} />
        </div>
        <div>
          <h3 style={{ fontWeight: 600, color: "var(--admin-text)", margin: 0 }}>{title}</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--admin-text-muted)", marginTop: 2 }}>{description}</p>
        </div>
      </div>

      {dateFilters && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label" style={{ fontSize: "0.75rem" }}>Start Date</label>
            <input className="admin-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label" style={{ fontSize: "0.75rem" }}>End Date</label>
            <input className="admin-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      )}

      <IonButton expand="block" color="primary" onClick={handleExport} disabled={loading}>
        {loading
          ? <><IonSpinner name="crescent" style={{ width: 16, height: 16, marginRight: 8 }} />Exporting...</>
          : <><Download size={16} style={{ marginRight: 8 }} />Download CSV</>}
      </IonButton>
    </div>
  );
}

export default function AdminExport() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Export</h1>
          <p className="text-sm text-gray-500 mt-1">Download your data as CSV files</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ExportCard
            icon={FileText}
            title="Purchases"
            description="All purchase records including email, document type, amount, and date"
            exportType="purchases"
            dateFilters={true}
          />
          <ExportCard
            icon={Users}
            title="Users"
            description="All registered user accounts with subscription status and join date"
            exportType="users"
            dateFilters={true}
          />
          <ExportCard
            icon={DollarSign}
            title="Revenue Report"
            description="Daily revenue summary with total amount and transaction count"
            exportType="revenue"
            dateFilters={true}
          />
        </div>

        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: 16, fontSize: "0.875rem", color: "#92400e" }}>
          <strong>Note:</strong> Date filters are optional. Leave blank to export all records.
          Large exports may take a few seconds to generate.
        </div>
      </div>
    </AdminLayout>
  );
}
