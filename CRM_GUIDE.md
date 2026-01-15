# Calnan CRM - Implementation Guide

## Overview

This is an internal Business Development CRM for Calnan Real Estate Group (CREG) and the CORE Investment Fund. It is a relationship-centric system designed to track investors, roll-in clients, and business development activities.

## Architecture

- **Framework:** Next.js 16 with App Router
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS 4
- **Authentication:** Simple cookie-based auth (APP_PASSWORD)
- **Deployment:** Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd crm
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `APP_PASSWORD`: Password for app access

4. Run database migrations
```bash
npm run prisma:migrate
```

5. Seed the database (optional)
```bash
npm run prisma:seed
```

6. Start development server
```bash
npm run dev
```

Visit http://localhost:3000 and log in with your APP_PASSWORD.

## Database Schema

The Prisma schema is FROZEN and should NOT be modified. Key models:

- **User**: System users (MD, VP BD, BDAs)
- **Contact**: Central relationship model (investors, roll-in clients, realtors, partners)
- **Task**: Action items assigned to users
- **Activity**: Timeline of interactions and status changes
- **Organization**: Companies associated with contacts

### Contact Types
- INVESTOR_CASH: Investors providing capital
- ROLL_IN_OWNER: Property owners rolling equity in
- REALTOR: Real estate brokers
- PROFESSIONAL: Professionals (lawyers, accountants, etc.)
- PARTNER: Business partners

### Relationship Stages
Pipeline stages from lead to conversion:
- NEW_LEAD
- FIRST_OUTREACH_SENT
- CONNECTED_CONVERSATION
- QUESTIONNAIRE_SENT/RECEIVED
- QUALIFIED_ACTIVE
- PROPOSAL_TO_BE_DEVELOPED
- PROPOSAL_IN_PROGRESS
- PROPOSAL_READY_FOR_FORMATTING
- PROPOSAL_SENT
- ACTIVE_NEGOTIATION
- SOFT_COMMITTED
- CLOSED_CONVERTED
- DORMANT
- LOST

### Vehicle Flags
- CORE: CORE Investment Fund
- CAST3: Cast3 (future)

## Application Structure

```
app/
├── api/                    # API Routes
│   ├── activities/        # Activity timeline CRUD
│   ├── contacts/          # Contact CRUD with filters
│   ├── tasks/             # Task CRUD
│   ├── users/             # User list
│   └── auth/              # Login/logout
├── components/            # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── TextArea.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Navigation.tsx
│   ├── ContactStageBadge.tsx
│   ├── ActivityTimelineItem.tsx
│   └── TaskListItem.tsx
├── contacts/              # Contact pages
│   ├── page.tsx          # Contact list with filters
│   ├── new/page.tsx      # Create contact
│   └── [id]/
│       ├── page.tsx      # Contact detail (Golden Record)
│       └── edit/page.tsx # Edit contact
├── dashboard/
│   └── page.tsx          # Dashboard with tasks and stats
├── tasks/
│   └── page.tsx          # Task list
├── login/
│   └── page.tsx          # Login page
├── layout.tsx            # Root layout
└── globals.css           # Global styles

lib/
├── prisma.ts             # Prisma client singleton
└── auth.ts               # Auth utilities

prisma/
├── schema.prisma         # Database schema (FROZEN)
├── prisma.config.ts      # Prisma 7 config
└── seed.ts               # Sample data seeder
```

## Key Features

### 1. Dashboard
- Quick stats (total contacts, open tasks, qualified active)
- My Tasks section (prioritized by urgency and due date)
- Contacts by Stage breakdown

### 2. Contact Management

#### Contact List (`/contacts`)
- Searchable by name/email
- Filterable by:
  - Stage
  - Owner (assigned user)
  - Vehicle (CORE/Cast3)
  - Contact Type
- Click any row to view contact detail

#### Contact Detail (`/contacts/[id]`) - "Golden Record"
The complete view of a relationship:

**Header Section:**
- Name and contact info
- Type badges
- Stage badge (color-coded)
- Vehicle flag (CORE/Cast3)

**Overview Section:**
- Email, phone, location
- Owner (assigned BDA/VP BD)
- Capital potential bands
- Equity roll-in potential bands
- How we met
- Notes

**Proposal Status Section** (when in proposal stages):
- Current proposal stage
- Proposal owner (typically MD)
- Visual indicator of proposal progress

**Next Touch Tracking:**
- Last touch date
- Next touch date (editable)
- Ensures momentum discipline

**Activity Timeline:**
- Chronological list of all activities
- Icons for each activity type
- Manual notes, calls, meetings
- Automated entries (stage changes, task creation)
- Actor attribution

**Tasks:**
- Open tasks with checkboxes to complete
- Completed tasks section
- Linked to contact

**Actions:**
- Add Note
- Add Task
- Change Stage
- Edit Contact

### 3. Task Management

#### Tasks Page (`/tasks`)
- All tasks across contacts
- Filterable by status and priority
- Shows contact association
- Create new tasks

#### Task Features:
- Title and description
- Status: OPEN, IN_PROGRESS, DONE, CANCELLED
- Priority: LOW, MEDIUM, HIGH, URGENT
- Due date
- Assigned to specific user
- Linked to contact

### 4. Proposal Workflow

The proposal workflow is central to roll-in conversions:

1. **Proposal To Be Developed**
   - Contact enters this stage
   - System auto-assigns proposal owner (defaults to MD)
   - Visible on contact detail page

2. **Proposal In Progress**
   - MD develops the proposal
   - Status tracked on contact page

3. **Proposal Ready for Formatting**
   - Draft complete
   - BDA/VP BD handles formatting

4. **Proposal Sent**
   - Delivered to client
   - Activity automatically logged
   - Visible in timeline

All proposal stage changes are tracked in the activity timeline.

### 5. Activity Timeline

Activities are the audit trail of the relationship:

**Activity Types:**
- NOTE: Manual notes
- CALL: Phone conversations
- MEETING: In-person or virtual meetings
- EMAIL_LOGGED: Emails (via BCC in future)
- TEXT_LOGGED: Text messages
- DOCUMENT_SENT: Documents sent
- DOCUMENT_RECEIVED: Documents received
- STATUS_CHANGE: Stage changes (auto-created)
- TASK_CREATED: Task creation (auto-created)
- TASK_COMPLETED: Task completion (auto-created)

**Activity Features:**
- Chronological order (newest first)
- Actor attribution (who did it)
- Occurred date/time
- Subject and body text
- Icon-based visual system

### 6. Role-Based Visibility (Structure Ready)

The application structure supports role-based access:

- **BDAs**: See and manage their own contacts
- **VP BD**: See all BD contacts, can reassign
- **MD**: Full visibility, proposal ownership

*Note: Full implementation in Phase 2 (TODO comments in code)*

## API Routes

### Contacts API (`/api/contacts`)

**GET /api/contacts**
Query params:
- `stage`: Filter by relationship stage
- `ownerUserId`: Filter by owner
- `vehicle`: Filter by CORE/Cast3
- `contactType`: Filter by contact type
- `search`: Search by name/email

Returns: Array of contacts with includes (owner, proposalOwner, organization)

**POST /api/contacts**
Body: Contact object
Returns: Created contact (201)

**GET /api/contacts/:id**
Returns: Contact with tasks and activities

**PATCH /api/contacts/:id**
Body: Partial contact object
Special handling:
- Stage changes auto-create STATUS_CHANGE activity
- Entering proposal stages auto-assigns proposal owner
- Updates lastTouchAt on certain activity types

**DELETE /api/contacts/:id**
Returns: 204 on success

### Tasks API (`/api/tasks`)

**GET /api/tasks**
Query params:
- `status`: Filter by status
- `priority`: Filter by priority
- `assignedToUserId`: Filter by assignee

Returns: Array of tasks with contact and assignedTo

**POST /api/tasks**
Body: Task object
Auto-creates TASK_CREATED activity

**PATCH /api/tasks/:id**
Body: Partial task object
Auto-creates TASK_COMPLETED activity when status changes to DONE

**DELETE /api/tasks/:id**
Returns: 204 on success

### Activities API (`/api/activities`)

**GET /api/activities**
Query param: `contactId` (required)
Returns: Activities for contact with actor

**POST /api/activities**
Body: Activity object
Updates contact.lastTouchAt for CALL, MEETING, EMAIL_LOGGED

### Users API (`/api/users`)

**GET /api/users**
Returns: Array of active users

## UI Components

### ContactStageBadge
Color-coded stage badges:
- Gray: New leads
- Blue: Qualified/active
- Yellow: Proposal stages
- Green: Closed/converted
- Red: Dormant/lost

### ActivityTimelineItem
Timeline entry with:
- Icon for activity type
- Timestamp
- Subject and body
- Actor attribution

### TaskListItem
Task display with:
- Checkbox to complete
- Title and description
- Due date with urgency indicator
- Priority badge
- Link to contact

### Form Components
- Button: Primary, secondary, danger variants
- Input: Text input with label
- Select: Dropdown with label
- TextArea: Multi-line text with label
- Modal: Overlay dialog with ESC key support

## Capital Potential Bands

For investors and roll-in owners, track potential capital:

**Capital Potential (Cash):**
- UNDER_100K
- BAND_100K_250K
- BAND_250K_500K
- BAND_500K_1M
- BAND_1M_2M
- BAND_2M_5M
- BAND_5M_PLUS
- BAND_10M_PLUS
- UNKNOWN

**Equity Roll-In Potential:**
- UNDER_250K
- BAND_250K_500K
- BAND_500K_1M
- BAND_1M_2M
- BAND_2M_5M
- BAND_5M_PLUS
- BAND_10M_PLUS
- UNKNOWN

## Future Enhancements (TODO Comments in Code)

### Phase 2: Email & Calendar Integration

**Email BCC Logging:**
- Set up BCC address for CRM
- Emails auto-log to contact timeline
- Parse sender/recipient to match contacts
- Unmatched emails go to inbox for manual linking

**Calendar Integration:**
- Sync from Microsoft Graph
- Auto-create MEETING activities
- Show upcoming meetings on dashboard
- Link meetings to contacts

**Unmatched Activity Inbox:**
- Review emails that didn't auto-match
- Link to existing contact
- Create new contact from unmatched email

### Phase 3: Advanced Features
- Email templates
- Document storage
- Reporting & analytics
- Export functionality
- Mobile app

## Development

### Running Tests
```bash
# No tests yet - add as needed
npm test
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

### Database Management
```bash
# Generate Prisma client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Seed database
npm run prisma:seed
```

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel:
   - `DATABASE_URL`
   - `APP_PASSWORD`
4. Deploy

### Database Setup

Use any PostgreSQL provider:
- Vercel Postgres
- Supabase
- Railway
- Heroku Postgres
- AWS RDS

Ensure connection string format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### Post-Deployment

1. Run migrations:
```bash
npx prisma migrate deploy
```

2. Seed initial data:
```bash
npm run prisma:seed
```

## Security Notes

- **Password Auth**: Simple APP_PASSWORD for MVP. Consider OAuth/SSO for production.
- **Secrets**: Never commit .env file. Use environment variables.
- **Database**: Ensure PostgreSQL has SSL enabled for production.
- **CORS**: Configure API routes for production domain.

## Support & Maintenance

### Common Issues

**Build Fails:**
- Check Node.js version (18+)
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Database Connection:**
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Ensure network access to database

**Prisma Issues:**
- Regenerate client: `npm run prisma:generate`
- Check schema is valid: `npx prisma validate`

## License

Internal use only - Calnan Real Estate Group

## Contact

For questions or support, contact the development team.
