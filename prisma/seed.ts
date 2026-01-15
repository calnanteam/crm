/**
 * Prisma Database Seed Script
 * 
 * This script seeds the database with sample data for the CRM:
 * - Users
 * - Organizations
 * - Contacts
 * - Tasks
 * - Activities
 * 
 * Run with: npm run prisma:seed
 */

import { PrismaClient, ContactType, RelationshipStage, VehicleFlag, TaskStatus, TaskPriority, ActivityType, CapitalPotentialBand, EquityRollInBand } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (optional - comment out if you want to preserve existing data)
  console.log('Clearing existing data...');
  await prisma.activity.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✓ Existing data cleared\n');

  // Seed Users
  console.log('Seeding users...');
  
  const md = await prisma.user.create({
    data: {
      email: 'md@calnan.com',
      displayName: 'Managing Director',
      isActive: true,
    },
  });
  console.log('  ✓ Created MD user');

  const vpBd = await prisma.user.create({
    data: {
      email: 'vpbd@calnan.com',
      displayName: 'VP Business Development',
      isActive: true,
    },
  });
  console.log('  ✓ Created VP BD user');

  const bda1 = await prisma.user.create({
    data: {
      email: 'bda1@calnan.com',
      displayName: 'BDA One',
      isActive: true,
    },
  });
  console.log('  ✓ Created BDA user\n');

  // Seed Organizations
  console.log('Seeding organizations...');
  
  const org1 = await prisma.organization.create({
    data: {
      name: 'Acme Real Estate Holdings',
      website: 'https://acme-realestate.example.com',
      notes: 'Large regional property owner',
    },
  });
  
  const org2 = await prisma.organization.create({
    data: {
      name: 'Tech Ventures Inc',
      website: 'https://techventures.example.com',
      notes: 'Tech-focused investment firm',
    },
  });
  
  console.log(`✓ Seeded 2 organizations\n`);

  // Seed Contacts
  console.log('Seeding contacts...');
  
  const contact1 = await prisma.contact.create({
    data: {
      firstName: 'John',
      lastName: 'Investor',
      displayName: 'John Investor',
      email: 'john@example.com',
      phone: '+1-555-0100',
      city: 'Calgary',
      region: 'AB',
      types: [ContactType.INVESTOR_CASH],
      vehicle: VehicleFlag.CORE,
      stage: RelationshipStage.QUALIFIED_ACTIVE,
      ownerUserId: bda1.id,
      capitalPotential: CapitalPotentialBand.BAND_500K_1M,
      howWeMet: 'Conference introduction',
      notes: 'Very interested in CORE fund',
      organizationId: org2.id,
      nextTouchAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      lastTouchAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  });
  
  const contact2 = await prisma.contact.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Property',
      displayName: 'Sarah Property',
      email: 'sarah@example.com',
      phone: '+1-555-0101',
      city: 'Edmonton',
      region: 'AB',
      types: [ContactType.ROLL_IN_OWNER],
      vehicle: VehicleFlag.CORE,
      stage: RelationshipStage.PROPOSAL_TO_BE_DEVELOPED,
      ownerUserId: bda1.id,
      proposalOwnerUserId: md.id,
      equityRollInPotential: EquityRollInBand.BAND_1M_2M,
      rollInPropertyLocation: 'Downtown Calgary mixed-use',
      howWeMet: 'Referral from broker',
      notes: 'Interested in rolling in 3 properties',
      organizationId: org1.id,
      nextTouchAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      lastTouchAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  });
  
  const contact3 = await prisma.contact.create({
    data: {
      firstName: 'Mike',
      lastName: 'Broker',
      displayName: 'Mike Broker',
      email: 'mike@example.com',
      phone: '+1-555-0102',
      city: 'Calgary',
      region: 'AB',
      types: [ContactType.REALTOR],
      vehicle: VehicleFlag.CORE,
      stage: RelationshipStage.CONNECTED_CONVERSATION,
      ownerUserId: vpBd.id,
      howWeMet: 'Industry event',
      notes: 'Well connected in Calgary market',
    },
  });
  
  console.log(`✓ Seeded 3 contacts\n`);

  // Seed Tasks
  console.log('Seeding tasks...');
  
  await prisma.task.create({
    data: {
      title: 'Follow up on CORE investment interest',
      description: 'Schedule call to discuss investment timeline and amount',
      status: TaskStatus.OPEN,
      priority: TaskPriority.HIGH,
      dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      assignedToUserId: bda1.id,
      contactId: contact1.id,
    },
  });
  
  await prisma.task.create({
    data: {
      title: 'Develop proposal for roll-in',
      description: 'Create detailed proposal for property roll-in transaction',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      assignedToUserId: md.id,
      contactId: contact2.id,
    },
  });
  
  await prisma.task.create({
    data: {
      title: 'Send market update email',
      description: 'Send quarterly market update to broker network',
      status: TaskStatus.OPEN,
      priority: TaskPriority.MEDIUM,
      dueAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      assignedToUserId: vpBd.id,
      contactId: contact3.id,
    },
  });
  
  console.log(`✓ Seeded 3 tasks\n`);

  // Seed Activities
  console.log('Seeding activities...');
  
  await prisma.activity.create({
    data: {
      type: ActivityType.NOTE,
      subject: 'Initial contact made',
      body: 'Had a great conversation about CORE fund structure and investment minimums.',
      contactId: contact1.id,
      actorUserId: bda1.id,
      source: 'manual',
    },
  });
  
  await prisma.activity.create({
    data: {
      type: ActivityType.MEETING,
      subject: 'Discovery meeting',
      body: 'Met to discuss property portfolio and potential roll-in structure. Very positive meeting.',
      contactId: contact2.id,
      actorUserId: bda1.id,
      occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      source: 'manual',
    },
  });
  
  await prisma.activity.create({
    data: {
      type: ActivityType.STATUS_CHANGE,
      subject: 'Stage changed to Proposal To Be Developed',
      body: 'Contact moved to proposal stage after successful discovery meeting.',
      contactId: contact2.id,
      actorUserId: bda1.id,
      occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      source: 'system',
    },
  });
  
  await prisma.activity.create({
    data: {
      type: ActivityType.CALL,
      subject: 'Quick check-in call',
      body: 'Discussed upcoming market opportunities and agreed to stay in touch.',
      contactId: contact3.id,
      actorUserId: vpBd.id,
      occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      source: 'manual',
    },
  });
  
  console.log(`✓ Seeded 4 activities\n`);

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
