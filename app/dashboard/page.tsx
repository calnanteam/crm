import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { TaskListItem } from "../components/TaskListItem";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// TODO: Calendar integration - Phase 2
// Sync meetings from calendar and auto-create Activity records
// Show calendar events on dashboard timeline

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // TODO: Get current user from session for role-based filtering
  const tasks = await prisma.task.findMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    include: {
      contact: true,
      assignedTo: true,
    },
    orderBy: [
      { priority: "desc" },
      { dueAt: "asc" },
    ],
    take: 10,
  });

  // Get contacts with overdue follow-ups
  const activeStages = [
    "CONNECTED_CONVERSATION",
    "QUALIFIED_ACTIVE",
    "PROPOSAL_TO_BE_DEVELOPED",
    "PROPOSAL_IN_PROGRESS",
    "PROPOSAL_READY_FOR_FORMATTING",
    "PROPOSAL_SENT",
    "ACTIVE_NEGOTIATION",
    "SOFT_COMMITTED",
  ] as const;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const overdueContacts = await prisma.contact.findMany({
    where: {
      stage: { in: [...activeStages] },
      nextTouchAt: {
        lt: today,
      },
    },
    include: {
      owner: true,
    },
    orderBy: {
      nextTouchAt: "asc",
    },
    take: 10,
  });

  const contactsByStage = await prisma.contact.groupBy({
    by: ["stage"],
    _count: true,
  });

  const stageMap = contactsByStage.reduce((acc: Record<string, number>, item: any) => {
    acc[item.stage] = item._count;
    return acc;
  }, {} as Record<string, number>);

  const totalContacts = await prisma.contact.count();
  const totalTasks = await prisma.task.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } });

  return (
    <AppShell>
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome to Calnan CRM" 
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Total Contacts</p>
            <p className="text-4xl font-bold text-blue-600">{totalContacts}</p>
          </div>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Open Tasks</p>
            <p className="text-4xl font-bold text-orange-600">{totalTasks}</p>
          </div>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Qualified Active</p>
            <p className="text-4xl font-bold text-green-600">{stageMap.QUALIFIED_ACTIVE || 0}</p>
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* My Tasks Card */}
        <Card title="My Tasks" className="hover:shadow-lg transition-shadow">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm mb-2">No open tasks</p>
              <p className="text-gray-500 text-xs">All caught up! Great work.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task: any) => (
                <TaskListItem key={task.id} task={task} />
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link 
              href="/tasks" 
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all tasks →
            </Link>
          </div>
        </Card>

        {/* Contacts by Stage Card */}
        <Card title="Contacts by Stage" className="hover:shadow-lg transition-shadow">
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 px-2 rounded hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">New Leads</span>
              <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                {stageMap.NEW_LEAD || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-2 rounded hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">Qualified Active</span>
              <span className="text-sm font-semibold text-gray-900 bg-green-100 px-3 py-1 rounded-full">
                {stageMap.QUALIFIED_ACTIVE || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-2 rounded hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">Proposal Stages</span>
              <span className="text-sm font-semibold text-gray-900 bg-blue-100 px-3 py-1 rounded-full">
                {(stageMap.PROPOSAL_TO_BE_DEVELOPED || 0) +
                  (stageMap.PROPOSAL_IN_PROGRESS || 0) +
                  (stageMap.PROPOSAL_READY_FOR_FORMATTING || 0) +
                  (stageMap.PROPOSAL_SENT || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-2 rounded hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">Closed Converted</span>
              <span className="text-sm font-semibold text-gray-900 bg-emerald-100 px-3 py-1 rounded-full">
                {stageMap.CLOSED_CONVERTED || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 px-2 rounded hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-700">Dormant / Lost</span>
              <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                {(stageMap.DORMANT || 0) + (stageMap.LOST || 0)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link 
              href="/contacts" 
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all contacts →
            </Link>
          </div>
        </Card>
      </div>

      {/* Overdue Follow-Ups Section */}
      {overdueContacts.length > 0 && (
        <Card title="Overdue Follow-Ups" className="hover:shadow-lg transition-shadow">
          <p className="text-sm text-gray-500 mb-4">
            Active contacts that need attention
          </p>
          <div className="space-y-3">
            {overdueContacts.map((contact: any) => {
              const daysOverdue = contact.nextTouchAt 
                ? Math.floor((today.getTime() - new Date(contact.nextTouchAt).getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              
              return (
                <div key={contact.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                  <div className="flex-1">
                    <Link 
                      href={`/contacts/${contact.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {contact.displayName || `${contact.firstName} ${contact.lastName}`}
                    </Link>
                    <p className="text-xs text-gray-600 mt-1">
                      Owner: {contact.owner?.displayName || contact.owner?.email || "Unassigned"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
                      {daysOverdue === 0 ? "Today" : `${daysOverdue}d overdue`}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Due: {contact.nextTouchAt ? new Date(contact.nextTouchAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </AppShell>
  );
}
