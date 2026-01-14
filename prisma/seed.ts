/**
 * Prisma Database Seed Script
 * 
 * This script seeds the database with placeholder data for:
 * - brain_rules: Dynamic rules for the Calnan Brain
 * - brain_projects: Active projects that provide context
 * 
 * Run with: npm run prisma:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (optional - comment out if you want to preserve existing data)
  console.log('Clearing existing data...');
  await prisma.brainRule.deleteMany({});
  await prisma.brainProject.deleteMany({});
  console.log('✓ Existing data cleared\n');

  // Seed Brain Rules
  console.log('Seeding brain_rules...');
  
  const brainRules = [
    {
      ruleText: 'Always maintain a professional yet approachable tone in all communications. Be concise but not curt.',
      category: 'Communication Style',
      active: true,
      createdBy: 'system',
    },
    {
      ruleText: 'Never commit to meeting times without explicit confirmation. Always propose 2-3 options and ask for preference.',
      category: 'Scheduling',
      active: true,
      createdBy: 'system',
    },
    {
      ruleText: 'When discussing financial matters or investments, always include appropriate disclaimers and suggest involving relevant advisors.',
      category: 'Financial Communications',
      active: true,
      createdBy: 'system',
    },
    {
      ruleText: 'For urgent matters or requests requiring immediate attention, flag for human review rather than making autonomous decisions.',
      category: 'Escalation',
      active: true,
      createdBy: 'system',
    },
    {
      ruleText: 'Maintain strict confidentiality about ongoing deals, negotiations, and sensitive business information. When in doubt, err on the side of caution.',
      category: 'Confidentiality',
      active: true,
      createdBy: 'system',
    },
  ];

  for (const rule of brainRules) {
    const created = await prisma.brainRule.create({
      data: rule,
    });
    console.log(`  ✓ Created rule: ${created.category}`);
  }

  console.log(`✓ Seeded ${brainRules.length} brain rules\n`);

  // Seed Brain Projects
  console.log('Seeding brain_projects...');

  const brainProjects = [
    {
      projectName: 'TechVentures Portfolio Review',
      keyFacts: `- Q1 2026 portfolio review in progress
- Focus on SaaS companies with ARR > $1M
- Looking for exit opportunities for 3 mature investments
- Actively seeking co-investment partners for Series B rounds
- Investment thesis: B2B infrastructure and developer tools`,
      active: true,
    },
    {
      projectName: 'Downtown Commercial Property Development',
      keyFacts: `- 50,000 sq ft mixed-use development project
- Located in downtown core, prime location
- Partners: ABC Development Group, XYZ Architects
- Timeline: Groundbreaking Q2 2026, completion Q4 2027
- Seeking additional investors for $5M tranche`,
      active: true,
    },
    {
      projectName: 'AI Advisory Board Engagement',
      keyFacts: `- Board member for emerging AI startup (NDA-protected name)
- Monthly board meetings, first Tuesday of each month
- Focus areas: Go-to-market strategy, enterprise sales, fundraising
- Company recently closed $10M Series A
- Preparing for Series B in 12-18 months`,
      active: true,
    },
    {
      projectName: 'Real Estate Market Analysis - Calgary Region',
      keyFacts: `- Comprehensive market analysis for Calgary commercial real estate
- Focus: Office, retail, and industrial sectors
- Deliverable: White paper for institutional investors
- Deadline: End of Q1 2026
- Collaborating with market research firm and local brokers`,
      active: true,
    },
  ];

  for (const project of brainProjects) {
    const created = await prisma.brainProject.create({
      data: project,
    });
    console.log(`  ✓ Created project: ${created.projectName}`);
  }

  console.log(`✓ Seeded ${brainProjects.length} brain projects\n`);

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
