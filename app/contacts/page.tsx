"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { Navigation } from "../components/Navigation";
import { Card } from "../components/Card";
import { ContactStageBadge } from "../components/ContactStageBadge";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Default hard-coded views
const DEFAULT_VIEWS = [
  { id: "all", name: "All Contacts", filtersJson: JSON.stringify({}) },
  { 
    id: "active", 
    name: "Active Pipeline", 
    filtersJson: JSON.stringify({ 
      stage: "QUALIFIED_ACTIVE" 
    }) 
  },
  { 
    id: "proposals", 
    name: "In Proposal", 
    filtersJson: JSON.stringify({ 
      stage: "PROPOSAL_IN_PROGRESS" 
    }) 
  },
  { 
    id: "core-investors", 
    name: "CORE Investors", 
    filtersJson: JSON.stringify({ 
      vehicle: "CORE",
      type: "INVESTOR_CASH"
    }) 
  },
];

function ContactsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  // Filter states initialized from URL
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") || "");
  const [stageFilter, setStageFilter] = useState(searchParams.get("stage") || "");
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get("owner") || "");
  const [vehicleFilter, setVehicleFilter] = useState(searchParams.get("vehicle") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "lastTouchAt_desc");
  
  // Saved views state
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [showViewMenu, setShowViewMenu] = useState(false);
  
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize filters from URL on mount
  useEffect(() => {
    const q = searchParams.get("q");
    const stage = searchParams.get("stage");
    const owner = searchParams.get("owner");
    const vehicle = searchParams.get("vehicle");
    const type = searchParams.get("type");
    const sort = searchParams.get("sort");
    
    if (q) setSearch(q);
    if (stage) setStageFilter(stage);
    if (owner) setOwnerFilter(owner);
    if (vehicle) setVehicleFilter(vehicle);
    if (type) setTypeFilter(type);
    if (sort) setSortBy(sort);
  }, []);

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

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (stageFilter) params.set("stage", stageFilter);
    if (ownerFilter) params.set("owner", ownerFilter);
    if (vehicleFilter) params.set("vehicle", vehicleFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (sortBy && sortBy !== "lastTouchAt_desc") params.set("sort", sortBy);
    
    const newUrl = params.toString() ? `/contacts?${params}` : "/contacts";
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, stageFilter, ownerFilter, vehicleFilter, typeFilter, sortBy, router]);

  useEffect(() => {
    fetchUsers();
    fetchSavedViews();
  }, []);

  useEffect(() => {
    fetchContacts(true);
  }, [debouncedSearch, stageFilter, ownerFilter, vehicleFilter, typeFilter, sortBy]);

  const fetchUsers = async () => {
    const response = await fetch("/api/users");
    const data = await response.json();
    setUsers(data);
  };

  const fetchSavedViews = async () => {
    try {
      const response = await fetch("/api/contacts/views");
      if (response.ok) {
        const data = await response.json();
        setSavedViews(data);
      }
    } catch (error) {
      console.error("Error fetching saved views:", error);
    }
  };

  const fetchContacts = async (reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    const params = new URLSearchParams();
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (stageFilter) params.append("stage", stageFilter);
    if (ownerFilter) params.append("ownerUserId", ownerFilter);
    if (vehicleFilter) params.append("vehicle", vehicleFilter);
    if (typeFilter) params.append("contactType", typeFilter);
    if (sortBy) params.append("sort", sortBy);
    if (!reset && nextCursor) params.append("cursor", nextCursor);

    const response = await fetch(`/api/contacts?${params}`);
    const data = await response.json();
    
    if (reset) {
      setContacts(data.items || []);
    } else {
      setContacts(prev => [...prev, ...(data.items || [])]);
    }
    
    setNextCursor(data.nextCursor);
    setHasNextPage(data.hasNextPage);
    setLoading(false);
    setLoadingMore(false);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStageFilter("");
    setOwnerFilter("");
    setVehicleFilter("");
    setTypeFilter("");
    setSortBy("lastTouchAt_desc");
    setSelectedView(null);
  };

  const handleSelectView = (viewId: string) => {
    const view = [...DEFAULT_VIEWS, ...savedViews].find(v => v.id === viewId);
    if (view) {
      const filters = JSON.parse(view.filtersJson);
      setSearch(filters.q || "");
      setDebouncedSearch(filters.q || "");
      setStageFilter(filters.stage || "");
      setOwnerFilter(filters.owner || "");
      setVehicleFilter(filters.vehicle || "");
      setTypeFilter(filters.type || "");
      setSortBy(filters.sort || "lastTouchAt_desc");
      setSelectedView(viewId);
      setShowViewMenu(false);
    }
  };

  const handleSaveView = async () => {
    if (!newViewName.trim()) return;
    
    // Build filters object, only including non-empty values
    const filters: Record<string, string> = {};
    if (debouncedSearch) filters.q = debouncedSearch;
    if (stageFilter) filters.stage = stageFilter;
    if (ownerFilter) filters.owner = ownerFilter;
    if (vehicleFilter) filters.vehicle = vehicleFilter;
    if (typeFilter) filters.type = typeFilter;
    if (sortBy && sortBy !== "lastTouchAt_desc") filters.sort = sortBy;
    
    const filtersJson = JSON.stringify(filters);
    
    try {
      const response = await fetch("/api/contacts/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newViewName, filtersJson }),
      });
      
      if (response.ok) {
        await fetchSavedViews();
        setNewViewName("");
        setShowSaveDialog(false);
      }
    } catch (error) {
      console.error("Error saving view:", error);
    }
  };

  const handleDeleteView = async (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this saved view?")) return;
    
    try {
      const response = await fetch(`/api/contacts/views/${viewId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        await fetchSavedViews();
        if (selectedView === viewId) {
          setSelectedView(null);
        }
      }
    } catch (error) {
      console.error("Error deleting view:", error);
    }
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
    { value: "lastTouchAt_desc", label: "Last Touch (Recent)" },
    { value: "lastTouchAt_asc", label: "Last Touch (Oldest)" },
    { value: "displayName_asc", label: "Name (A-Z)" },
    { value: "displayName_desc", label: "Name (Z-A)" },
    { value: "createdAt_desc", label: "Created (Recent)" },
    { value: "createdAt_asc", label: "Created (Oldest)" },
  ];

  const userOptions = [
    { value: "", label: "All Owners" },
    ...users.map((u) => ({ value: u.id, label: u.displayName || u.email })),
  ];

  const allViews = [...DEFAULT_VIEWS, ...savedViews];
  const currentViewName = selectedView 
    ? allViews.find(v => v.id === selectedView)?.name 
    : "Select a view...";

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

        {/* Saved Views Section */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewMenu(!showViewMenu);
                }}
                className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currentViewName}
              </button>
              
              {showViewMenu && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  <div className="py-1">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Default Views
                    </div>
                    {DEFAULT_VIEWS.map((view) => (
                      <button
                        key={view.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectView(view.id);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        {view.name}
                      </button>
                    ))}
                    
                    {savedViews.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-t mt-2">
                          My Saved Views
                        </div>
                        {savedViews.map((view) => (
                          <div
                            key={view.id}
                            className="flex items-center justify-between px-4 py-2 hover:bg-gray-100"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectView(view.id);
                              }}
                              className="flex-1 text-left"
                            >
                              {view.name}
                            </button>
                            <button
                              onClick={(e) => handleDeleteView(view.id, e)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setShowSaveDialog(true);
              }}
              className="whitespace-nowrap"
            >
              Save View
            </Button>
          </div>
        </Card>

        {/* Save View Dialog */}
        {showSaveDialog && (
          <Card className="mb-6 bg-blue-50">
            <div className="space-y-4">
              <h3 className="font-semibold">Save Current View</h3>
              <Input
                placeholder="View name..."
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSaveView()}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveView}>
                  Save
                </Button>
                <Button onClick={() => {
                  setShowSaveDialog(false);
                  setNewViewName("");
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Filters Section */}
        <Card className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              <Select
                options={sortOptions}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
              
              {/* Load More Button */}
              {hasNextPage && (
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => fetchContacts(false)}
                    disabled={loadingMore}
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
