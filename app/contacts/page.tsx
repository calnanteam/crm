"use client";

import { useState, useEffect, useRef } from "react";
import { Navigation } from "../components/Navigation";
import { Card } from "../components/Card";
import { ContactStageBadge } from "../components/ContactStageBadge";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input by 250ms
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [debouncedSearch, stageFilter, ownerFilter, vehicleFilter, typeFilter]);

  const fetchUsers = async () => {
    const response = await fetch("/api/users");
    const data = await response.json();
    setUsers(data);
  };

  const fetchContacts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    // Note: API currently supports search by name and email only
    // Phone and company search requires API enhancement (blocked: requires API support)
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (stageFilter) params.append("stage", stageFilter);
    if (ownerFilter) params.append("ownerUserId", ownerFilter);
    if (vehicleFilter) params.append("vehicle", vehicleFilter);
    if (typeFilter) params.append("contactType", typeFilter);

    const response = await fetch(`/api/contacts?${params}`);
    const data = await response.json();
    setContacts(data);
    setLoading(false);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStageFilter("");
    setOwnerFilter("");
    setVehicleFilter("");
    setTypeFilter("");
  };

  const formatRelativeTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const stageOptions = [
    { value: "", label: "All Stages" },
    { value: "NEW_LEAD", label: "New Lead" },
    { value: "QUALIFIED_ACTIVE", label: "Qualified Active" },
    { value: "PROPOSAL_TO_BE_DEVELOPED", label: "Proposal: To Be Developed" },
    { value: "PROPOSAL_IN_PROGRESS", label: "Proposal: In Progress" },
    { value: "PROPOSAL_SENT", label: "Proposal Sent" },
    { value: "CLOSED_CONVERTED", label: "Closed Converted" },
    { value: "DORMANT", label: "Dormant" },
    { value: "LOST", label: "Lost" },
  ];

  const vehicleOptions = [
    { value: "", label: "All Vehicles" },
    { value: "CORE", label: "CORE" },
    { value: "CAST3", label: "Cast3" },
  ];

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "INVESTOR_CASH", label: "Investor (Cash)" },
    { value: "ROLL_IN_OWNER", label: "Roll-In Owner" },
    { value: "REALTOR", label: "Realtor" },
    { value: "PROFESSIONAL", label: "Professional" },
    { value: "PARTNER", label: "Partner" },
  ];

  const userOptions = [
    { value: "", label: "All Owners" },
    ...users.map((u) => ({ value: u.id, label: u.displayName || u.email })),
  ];

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <Button onClick={() => router.push("/contacts/new")}>
            New Contact
          </Button>
        </div>

        <Card className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Search by name, email, phone, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                options={stageOptions}
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
              />
              <Select
                options={userOptions}
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
              />
              <Select
                options={vehicleOptions}
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
              />
              <Select
                options={typeOptions}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
            {(search || stageFilter || ownerFilter || vehicleFilter || typeFilter) && (
              <div className="flex justify-end">
                <Button
                  onClick={handleClearFilters}
                  className="text-sm"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          {loading ? (
            <p>Loading...</p>
          ) : contacts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No contacts found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Touch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className={`cursor-pointer transition-all duration-150 ${
                        hoveredRowId === contact.id
                          ? "bg-gray-50 shadow-md border-l-4 border-l-blue-500"
                          : "hover:bg-gray-50"
                      }`}
                      onMouseEnter={() => setHoveredRowId(contact.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {contact.displayName ||
                            `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
                            "Unknown"}
                        </div>
                        {contact.phone && (
                          <div className="text-xs text-gray-400">{contact.phone}</div>
                        )}
                        {contact.organization?.name && (
                          <div className="text-xs text-gray-400">{contact.organization.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{contact.email || "-"}</div>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ContactStageBadge stage={contact.stage} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.owner?.displayName || contact.owner?.email || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.vehicle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.lastTouchAt ? (
                          <span>Touch • {formatRelativeTime(contact.lastTouchAt)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {hoveredRowId === contact.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/contacts/${contact.id}`);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
                          >
                            Open
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
