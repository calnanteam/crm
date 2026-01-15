/**
 * Prisma Database Seed Script
 * 
 * This script seeds the database with placeholder data for the CRM:
 * - Users
 * - Contacts
 * - Tasks
 * - Proposals
 * - Activities
 * 
 * Run with: npm run prisma:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create a default user
  console.log('Seeding users...');
  const user = await prisma.user.upsert({
    where: { email: 'matt@calnan.co' },
    update: {},
    create: {
      email: 'matt@calnan.co',
      displayName: 'Matt Calnan',
      isActive: true,
    },
  });
  console.log(`✓ Created user: ${user.email}\n`);

  // Create sample contacts
  console.log('Seeding contacts...');
  const contact1 = await prisma.contact.create({
    data: {
      firstName: 'John',
      lastName: 'Investor',
      displayName: 'John Investor',
      email: 'john@example.com',
      phone: '403-555-0001',
      city: 'Calgary',
      region: 'AB',
      types: ['INVESTOR_CASH'],
      stage: 'QUALIFIED_ACTIVE',
      ownerUserId: user.id,
      capitalPotential: 'BAND_500K_1M',
    },
  });
  
  const contact2 = await prisma.contact.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Property',
      displayName: 'Sarah Property',
      email: 'sarah@example.com',
      phone: '403-555-0002',
      city: 'Edmonton',
      region: 'AB',
      types: ['ROLL_IN_OWNER'],
      stage: 'PROPOSAL_IN_PROGRESS',
      ownerUserId: user.id,
      proposalOwnerUserId: user.id,
      equityRollInPotential: 'BAND_1M_2M',
      rollInPropertyLocation: 'Downtown Edmonton',
    },
  });

  console.log(`✓ Seeded 2 contacts\n`);

  // Create sample tasks
  console.log('Seeding tasks...');
  await prisma.task.create({
    data: {
      title: 'Follow up on investment interest',
      description: 'Discuss CORE fund investment opportunity',
      status: 'OPEN',
      priority: 'HIGH',
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      contactId: contact1.id,
      assignedToUserId: user.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Review property details',
      description: 'Get property valuation and due diligence docs',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      contactId: contact2.id,
      assignedToUserId: user.id,
    },
  });

  console.log(`✓ Seeded 2 tasks\n`);

  // Create a sample proposal for contact2
  console.log('Seeding proposals...');
  await prisma.proposal.create({
    data: {
      contactId: contact2.id,
      status: 'DRAFT',
      notes: 'Initial draft for roll-in proposal. Need to finalize valuation.',
      ownerUserId: user.id,
    },
  });

  console.log(`✓ Seeded 1 proposal\n`);

  // Create sample activities
  console.log('Seeding activities...');
  await prisma.activity.create({
    data: {
      type: 'NOTE',
      subject: 'Initial contact made',
      body: 'Had introductory call. Very interested in CORE fund.',
      contactId: contact1.id,
      actorUserId: user.id,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'STATUS_CHANGE',
      subject: 'Moved to PROPOSAL_IN_PROGRESS',
      body: 'Property valuation received. Moving forward with proposal development.',
      contactId: contact2.id,
      actorUserId: user.id,
    },
  });

  console.log(`✓ Seeded 2 activities\n`);

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
