# Calnan Real Estate Group - Internal CRM

A relationship-centric CRM for tracking investors and roll-in clients for the CORE Investment Fund.

## Features

### Core Functionality
- **Contact Management**: Track investors, roll-in owners, realtors, professionals, and partners
- **Relationship Pipeline**: Contact-centric stages from NEW_LEAD to CLOSED_CONVERTED
- **Proposal Workflow**: Dedicated stages with proposal owner tracking
- **Activity Timeline**: Log notes, calls, meetings, emails, and status changes
- **Task Management**: Create, assign, and track tasks with priorities and due dates
- **Next Touch Tracking**: Required for active stages to maintain momentum

### Pages
- **Dashboard**: Overview with stats, my tasks, and contacts by stage
- **Contacts List**: Searchable/filterable table with stage, owner, vehicle, and type filters
- **Contact Detail ("Golden Record")**: Complete contact view with overview, proposal status, activity timeline, and tasks
- **Tasks Page**: Filterable task list by status and priority
- **Contact Forms**: Create and edit contact information

### Business Logic
- **Proposal Stage Automation**: Auto-assigns proposal owner (defaults to MD) when entering proposal stages
- **Stage Change Tracking**: Creates activity record on status changes
- **Last Touch Updates**: Updates lastTouchAt when logging calls, meetings, or emails
- **Vehicle Flags**: CORE vs Cast3 investment vehicle tracking
- **Capital Potential Bands**: Track investor capacity and equity roll-in potential

## Tech Stack
- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS** for styling
- **Prisma 7** with PostgreSQL
- **Cookie-based authentication**

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
DATABASE_URL="postgresql://..."
APP_PASSWORD="your-secure-password"
```

3. Generate Prisma client and run migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. (Optional) Seed the database:
```bash
npm run prisma:seed
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Phase 2 TODO Features
- **Email BCC Logging**: Parse BCC'd emails to auto-create activity records
- **Unmatched Activity Inbox**: Queue for activities that can't be auto-matched to contacts
- **Calendar Integration**: Sync meetings from calendar and auto-create Activity records
- **Role-Based Access**: Full implementation of BDA, VP BD, and MD permissions

## Schema Notes
⚠️ **IMPORTANT**: The Prisma schema at `/prisma/schema.prisma` is FROZEN. Do not modify it.
- NO deals/opportunities/pipelines entities
- NO auto-stage movements
- Contacts are the center of the system
- Proposal stages REQUIRE a proposal owner
- NextTouchAt is required for active stages (enforced at app layer)

## Authentication
Simple password-protected access using cookies. Set `APP_PASSWORD` in environment variables.

## License
Internal use only - Calnan Real Estate Group

