"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "../../components/Navigation";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { TextArea } from "../../components/TextArea";
import { Button } from "../../components/Button";

export default function NewContactPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    email: "",
    phone: "",
    city: "",
    region: "",
    country: "Canada",
    types: [] as string[],
    vehicle: "CORE",
    stage: "NEW_LEAD",
    ownerUserId: "",
    capitalPotential: "UNKNOWN",
    equityRollInPotential: "UNKNOWN",
    rollInPropertyLocation: "",
    howWeMet: "",
    notes: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const response = await fetch("/api/users");
    const data = await response.json();
    setUsers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const contact = await response.json();
        router.push(`/contacts/${contact.id}`);
      }
    } catch (error) {
      console.error("Error creating contact:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, types: [...formData.types, type] });
    } else {
      setFormData({ ...formData, types: formData.types.filter((t) => t !== type) });
    }
  };

  const userOptions = [
    { value: "", label: "Select Owner" },
    ...users.map((u) => ({ value: u.id, label: u.displayName || u.email })),
  ];

  const vehicleOptions = [
    { value: "CORE", label: "CORE" },
    { value: "CAST3", label: "Cast3" },
  ];

  const stageOptions = [
    { value: "NEW_LEAD", label: "New Lead" },
    { value: "FIRST_OUTREACH_SENT", label: "First Outreach Sent" },
    { value: "CONNECTED_CONVERSATION", label: "Connected Conversation" },
    { value: "QUALIFIED_ACTIVE", label: "Qualified Active" },
  ];

  const capitalOptions = [
    { value: "UNKNOWN", label: "Unknown" },
    { value: "UNDER_100K", label: "Under $100K" },
    { value: "BAND_100K_250K", label: "$100K - $250K" },
    { value: "BAND_250K_500K", label: "$250K - $500K" },
    { value: "BAND_500K_1M", label: "$500K - $1M" },
    { value: "BAND_1M_2M", label: "$1M - $2M" },
    { value: "BAND_2M_5M", label: "$2M - $5M" },
    { value: "BAND_5M_PLUS", label: "$5M+" },
    { value: "BAND_10M_PLUS", label: "$10M+" },
  ];

  const equityOptions = [
    { value: "UNKNOWN", label: "Unknown" },
    { value: "UNDER_250K", label: "Under $250K" },
    { value: "BAND_250K_500K", label: "$250K - $500K" },
    { value: "BAND_500K_1M", label: "$500K - $1M" },
    { value: "BAND_1M_2M", label: "$1M - $2M" },
    { value: "BAND_2M_5M", label: "$2M - $5M" },
    { value: "BAND_5M_PLUS", label: "$5M+" },
    { value: "BAND_10M_PLUS", label: "$10M+" },
  ];

  return (
    <>
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">New Contact</h1>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>

            <Input
              label="Display Name"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Optional - overrides first/last name"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <Input
                label="Region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g., AB, BC, SK"
              />
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Types
              </label>
              <div className="space-y-2">
                {["INVESTOR_CASH", "ROLL_IN_OWNER", "REALTOR", "PROFESSIONAL", "PARTNER"].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.types.includes(type)}
                      onChange={(e) => handleTypeChange(type, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">
                      {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Vehicle"
                options={vehicleOptions}
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
              />
              <Select
                label="Initial Stage"
                options={stageOptions}
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              />
            </div>

            <Select
              label="Owner"
              options={userOptions}
              value={formData.ownerUserId}
              onChange={(e) => setFormData({ ...formData, ownerUserId: e.target.value })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Capital Potential"
                options={capitalOptions}
                value={formData.capitalPotential}
                onChange={(e) => setFormData({ ...formData, capitalPotential: e.target.value })}
              />
              <Select
                label="Equity Roll-In Potential"
                options={equityOptions}
                value={formData.equityRollInPotential}
                onChange={(e) => setFormData({ ...formData, equityRollInPotential: e.target.value })}
              />
            </div>

            <Input
              label="Roll-In Property Location"
              value={formData.rollInPropertyLocation}
              onChange={(e) => setFormData({ ...formData, rollInPropertyLocation: e.target.value })}
              placeholder="Optional"
            />

            <TextArea
              label="How We Met"
              value={formData.howWeMet}
              onChange={(e) => setFormData({ ...formData, howWeMet: e.target.value })}
              rows={3}
              placeholder="Optional"
            />

            <TextArea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Optional"
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/contacts")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Contact"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
