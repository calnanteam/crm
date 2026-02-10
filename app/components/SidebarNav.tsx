"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { 
    href: "/dashboard", 
    label: "Dashboard"
  },
  { 
    href: "/contacts", 
    label: "Contacts"
  },
  { 
    href: "/pipeline", 
    label: "Pipeline"
  },
  { 
    href: "/tasks", 
    label: "Tasks"
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col h-screen fixed left-0 top-0 z-50">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Calnan CRM</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? "bg-blue-50 text-blue-700 shadow-sm" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User/Logout */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
