"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { Plus, Edit2, CheckCircle2, XCircle, Clock, IndianRupee } from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
}

export default function ServicesManager() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState(300);

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/admin/services");
      if (res.ok) {
        const json = await res.json();
        setServices(json.services || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setName("");
    setDurationMinutes(30);
    setPrice(300);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: ServiceItem) => {
    setEditingId(s.id);
    setName(s.name);
    setDurationMinutes(s.durationMinutes);
    setPrice(s.price);
    setModalOpen(true);
  };

  const handleToggleActive = async (s: ServiceItem) => {
    try {
      // A2 spec: "Deactivate instead of delete so history stays intact"
      const res = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, isActive: !s.isActive }),
      });
      if (res.ok) fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetch("/api/admin/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name, durationMinutes, price }),
        });
      } else {
        await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, durationMinutes, price }),
        });
      }
      setModalOpen(false);
      fetchServices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1F] flex flex-col font-sans">
      <AdminNav />

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-primary">Services Manager (A2)</h1>
            <p className="text-xs text-muted">
              Add, edit, and deactivate salon services. Deactivation keeps past visit histories intact.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-[#182e4c] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Service</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E1DC] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5] border-b border-[#E4E1DC] text-xs font-bold text-muted uppercase">
                <tr>
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DC]">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-base text-[#1B1B1F]">
                      {s.name}
                    </td>

                    <td className="py-3 px-4 text-xs font-semibold text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        {s.durationMinutes} mins
                      </span>
                    </td>

                    <td className="py-3 px-4 text-sm font-black text-primary">
                      ₹{s.price}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          s.isActive
                            ? "bg-[#D9EAD3] text-[#2D6A1F]"
                            : "bg-[#E8E8E8] text-[#555555]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.isActive ? "bg-[#2D6A1F]" : "bg-[#555555]"
                          }`}
                        />
                        {s.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 rounded-lg border border-[#E4E1DC] text-muted hover:text-primary transition-colors"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleActive(s)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            s.isActive
                              ? "border-[#8B1A1A]/30 text-[#8B1A1A] hover:bg-[#F4CCCC]/30"
                              : "border-[#2D6A1F]/30 text-[#2D6A1F] hover:bg-[#D9EAD3]/30"
                          }`}
                        >
                          {s.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E4E1DC] shadow-2xl space-y-5">
            <h3 className="font-bold text-xl text-primary">
              {editingId ? "Edit Service" : "Add Service"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Haircut & Styling"
                  className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1.5">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E4E1DC] font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#182e4c] text-white font-bold text-sm shadow-sm"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
