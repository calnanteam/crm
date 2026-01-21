import { Navigation } from "../components/Navigation";
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
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Contacts</p>
              <p className="text-3xl font-bold text-blue-600">{totalContacts}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Open Tasks</p>
              <p className="text-3xl font-bold text-orange-600">{totalTasks}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Qualified Active</p>
              <p className="text-3xl font-bold text-green-600">{stageMap.QUALIFIED_ACTIVE || 0}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card title="My Tasks">
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No open tasks</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task: any) => (
                  <TaskListItem key={task.id} task={task} />
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href="/tasks" className="text-sm text-blue-600 hover:underline">
                View all tasks →
              </Link>
            </div>
          </Card>

          <Card title="Contacts by Stage">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium">New Leads</span>
                <span className="text-sm text-gray-600">{stageMap.NEW_LEAD || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium">Qualified Active</span>
                <span className="text-sm text-gray-600">{stageMap.QUALIFIED_ACTIVE || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium">Proposal Stages</span>
                <span className="text-sm text-gray-600">
                  {(stageMap.PROPOSAL_TO_BE_DEVELOPED || 0) +
                    (stageMap.PROPOSAL_IN_PROGRESS || 0) +
                    (stageMap.PROPOSAL_READY_FOR_FORMATTING || 0) +
                    (stageMap.PROPOSAL_SENT || 0)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium">Closed Converted</span>
                <span className="text-sm text-gray-600">{stageMap.CLOSED_CONVERTED || 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-medium">Dormant / Lost</span>
                <span className="text-sm text-gray-600">
                  {(stageMap.DORMANT || 0) + (stageMap.LOST || 0)}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/contacts" className="text-sm text-blue-600 hover:underline">
                View all contacts →
              </Link>
            </div>
          </Card>
        </div>

        {/* Overdue Follow-Ups Section */}
        {overdueContacts.length > 0 && (
          <div className="mt-8">
            <Card title="⚠️ Overdue Follow-Ups">
              <p className="text-sm text-gray-600 mb-4">
                Active contacts that need attention (nextTouchAt has passed)
              </p>
              <div className="space-y-3">
                {overdueContacts.map((contact: any) => {
                  const daysOverdue = contact.nextTouchAt 
                    ? Math.floor((today.getTime() - new Date(contact.nextTouchAt).getTime()) / (1000 * 60 * 60 * 24))
                    : 0;
                  
                  return (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex-1">
                        <Link 
                          href={`/contacts/${contact.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {contact.displayName || `${contact.firstName} ${contact.lastName}`}
                        </Link>
                        <p className="text-xs text-gray-600 mt-1">
                          Owner: {contact.owner?.displayName || contact.owner?.email || "Unassigned"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
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
          </div>
        )}
      </div>
    </>
  );
}
