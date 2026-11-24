"use client";

import React, { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { Users, Plus, CheckSquare, Square, ShieldCheck } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  username: string;
  role: string;
  status: string;
  skills: { serviceId: string; service: { name: string } }[];
}

interface ServiceItem {
  id: string;
  name: string;
}

export default function StaffSkillsManager() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Staff Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STYLIST");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const fetchStaffData = async () => {
    try {
      const res = await fetch("/api/admin/staff");
      if (res.ok) {
        const json = await res.json();
        setStaff(json.staff || []);
        setServices(json.services || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleToggleSkill = async (staffId: string, serviceId: string) => {
    const member = staff.find((s) => s.id === staffId);
    if (!member) return;

    const currentSkillIds = member.skills.map((sk) => sk.serviceId);
    const updatedSkillIds = currentSkillIds.includes(serviceId)
      ? currentSkillIds.filter((id) => id !== serviceId)
      : [...currentSkillIds, serviceId];

    try {
      // Update skill matrix in database (drives R4 & R5)
      await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: staffId, serviceIds: updatedSkillIds }),
      });
      fetchStaffData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          password,
          role,
          serviceIds: selectedSkills,
        }),
      });
      setAddModalOpen(false);
      setName("");
      setUsername("");
      setPassword("");
      setSelectedSkills([]);
      fetchStaffData();
    } catch (err) {
      console.error(err);
    }
  };

  const stylistsOnly = staff.filter((s) => s.role === "STYLIST");

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B1B1F] flex flex-col font-sans overflow-x-hidden">
      <AdminNav />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-primary">Staff & Skills Manager (A3)</h1>
            <p className="text-xs text-muted">
              Configure staff roles and the Skill Matrix. Ticking skills drives rule R4 (call matching) and R5 (wait estimates).
            </p>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-[#182e4c] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>

        {/* Skill Matrix Table (A3 Spec) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E4E1DC] shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="font-extrabold text-base sm:text-lg text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <span>Stylist Skills Matrix</span>
            </h3>
            <span className="text-[11px] sm:text-xs text-muted">
              Click any checkbox to update qualified services in real time
            </span>
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5] border-b border-[#E4E1DC] text-xs font-bold text-muted uppercase">
                <tr>
                  <th className="py-3 px-4 min-w-[160px]">Stylist</th>
                  {services.map((svc) => (
                    <th key={svc.id} className="py-3 px-3 text-center">
                      {svc.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E1DC]">
                {stylistsOnly.map((st) => {
                  const qualifiedServiceIds = st.skills.map((sk) => sk.serviceId);
                  return (
                    <tr key={st.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-base text-[#1B1B1F]">{st.name}</p>
                        <p className="text-xs text-muted">@{st.username}</p>
                      </td>

                      {services.map((svc) => {
                        const hasSkill = qualifiedServiceIds.includes(svc.id);
                        return (
                          <td key={svc.id} className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleToggleSkill(st.id, svc.id)}
                              className="p-1 rounded-lg hover:bg-black/5 transition-colors inline-flex items-center justify-center"
                              title={`Toggle ${svc.name} for ${st.name}`}
                            >
                              {hasSkill ? (
                                <CheckSquare className="w-5 h-5 text-accent stroke-[2.5]" />
                              ) : (
                                <Square className="w-5 h-5 text-[#E4E1DC]" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Staff Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 border border-[#E4E1DC] shadow-2xl space-y-4 sm:space-y-5 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-xl text-primary">Add Staff Member</h3>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Patel"
                  className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="login username"
                    className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl px-4 py-2.5 text-sm outline-none"
                >
                  <option value="STYLIST">Stylist</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="ADMIN">Admin Manager</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E4E1DC] font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#182e4c] text-white font-bold text-sm shadow-sm"
                >
                  Create Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
