"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Navigation } from "../components/Navigation";
import { Card } from "../components/Card";
import { ContactStageBadge } from "../components/ContactStageBadge";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = 'force-dynamic';

function ContactsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("lastTouchAt_desc");
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  // Initialize filters from URL on mount
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const q = searchParams.get("q") || "";
      const stage = searchParams.get("stage") || "";
      const owner = searchParams.get("owner") || "";
      const type = searchParams.get("type") || "";
      const vehicle = searchParams.get("vehicle") || "";
      const sort = searchParams.get("sort") || "lastTouchAt_desc";
      
      setSearch(q);
      setStageFilter(stage);
      setOwnerFilter(owner);
      setTypeFilter(type);
      setVehicleFilter(vehicle);
      setSortFilter(sort);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Debounce search and update URL
  useEffect(() => {
    if (!initializedRef.current) return;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      updateURLAndFetch();
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search]);

  // Update URL and fetch when filters change
  useEffect(() => {
    if (!initializedRef.current) return;
    updateURLAndFetch();
  }, [stageFilter, ownerFilter, vehicleFilter, typeFilter, sortFilter]);

  const fetchUsers = async () => {
    const response = await fetch("/api/users");
    const data = await response.json();
    setUsers(data);
  };

  const updateURLAndFetch = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (stageFilter) params.set("stage", stageFilter);
    if (ownerFilter) params.set("owner", ownerFilter);
    if (vehicleFilter) params.set("vehicle", vehicleFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (sortFilter && sortFilter !== "lastTouchAt_desc") params.set("sort", sortFilter);

    // Update URL without reload
    const newUrl = params.toString() ? `?${params.toString()}` : "/contacts";
    router.replace(newUrl, { scroll: false });

    // Fetch first page
    fetchContacts();
  };

  const fetchContacts = async (cursor?: string) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setContacts([]);
      setNextCursor(null);
    }

    const params = new URLSearchParams();
    params.set("limit", "25");
    if (search) params.set("q", search);
    if (stageFilter) params.set("stage", stageFilter);
    if (ownerFilter) params.set("ownerUserId", ownerFilter);
    if (vehicleFilter) params.set("vehicle", vehicleFilter);
    if (typeFilter) params.set("contactType", typeFilter);
    if (sortFilter) params.set("sort", sortFilter);
    if (cursor) params.set("cursor", cursor);

    try {
      const response = await fetch(`/api/contacts?${params}`);
      const data = await response.json();
      
      if (cursor) {
        // Append to existing contacts
        setContacts((prev) => [...prev, ...data.items]);
      } else {
        // Replace contacts
        setContacts(data.items);
      }
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchContacts(nextCursor);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStageFilter("");
    setOwnerFilter("");
    setVehicleFilter("");
    setTypeFilter("");
    setSortFilter("lastTouchAt_desc");
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

  const sortOptions = [
    { value: "lastTouchAt_desc", label: "Last Activity (Recent)" },
    { value: "lastTouchAt_asc", label: "Last Activity (Oldest)" },
    { value: "createdAt_desc", label: "Date Created (Newest)" },
    { value: "createdAt_asc", label: "Date Created (Oldest)" },
    { value: "name_asc", label: "Name (A-Z)" },
    { value: "name_desc", label: "Name (Z-A)" },
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
            {/* Search Input */}
            <div>
              <Input
                placeholder="Search by name, email, phone, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <Select
                options={sortOptions}
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value)}
              />
            </div>

            {(search || stageFilter || ownerFilter || vehicleFilter || typeFilter || sortFilter !== "lastTouchAt_desc") && (
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
            <>
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
                        Last Activity
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
                          ? "bg-blue-50 shadow-md border-l-4 border-l-blue-500"
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
                          <span className="text-gray-600">
                            {formatRelativeTime(contact.lastTouchAt)}
                          </span>
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
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium shadow-sm"
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
              
              {nextCursor && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-2"
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactsPageContent />
    </Suspense>
  );
}
