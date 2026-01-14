/**
 * Calnan Brain - Context Assembly Module
 * 
 * This module handles the assembly of the "Calnan Brain" context for AI email processing.
 * The Brain consists of:
 *   1. Static Brain: Files stored in /brain/ directory (core.md, role-specific files)
 *   2. Dynamic Brain: Rules and projects stored in PostgreSQL database
 * 
 * Brain Injection Order:
 *   1. System rules (handled by caller)
 *   2. Calnan Brain core (core.md)
 *   3. Role-specific block (optional, e.g., investor.md, broker.md)
 *   4. Active brain rules from database
 *   5. Active brain projects from database
 *   6. Email content (handled by caller)
 *   7. Output instructions (handled by caller)
 * 
 * @module lib/brain
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from './prisma';

/**
 * Type definitions for Brain data structures
 */
export interface BrainRule {
  id: string;
  ruleText: string;
  category: string;
  active: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface BrainProject {
  id: string;
  projectName: string;
  keyFacts: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrainContext {
  core: string;
  role?: string;
  rules: BrainRule[];
  projects: BrainProject[];
  assembledContext: string;
}

/**
 * Reads the core brain file (core.md)
 * 
 * @returns Promise<string> - Content of core.md
 * @throws Error if core.md cannot be read
 */
export async function readCoreBrain(): Promise<string> {
  try {
    const corePath = join(process.cwd(), 'brain', 'core.md');
    const content = await readFile(corePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading core brain file:', error);
    throw new Error('Failed to read core brain file (brain/core.md)');
  }
}

/**
 * Reads a role-specific brain file if it exists
 * 
 * @param role - Role name (e.g., 'investor', 'broker')
 * @returns Promise<string | null> - Content of role file, or null if not found
 */
export async function readRoleBrain(role: string): Promise<string | null> {
  try {
    const rolePath = join(process.cwd(), 'brain', 'roles', `${role.toLowerCase()}.md`);
    const content = await readFile(rolePath, 'utf-8');
    return content;
  } catch (error) {
    // Role file not found or unreadable - this is acceptable
    console.log(`Role file for "${role}" not found or unreadable. Continuing without role-specific context.`);
    return null;
  }
}

/**
 * Fetches all active brain rules from the database
 * 
 * @returns Promise<BrainRule[]> - Array of active brain rules
 */
export async function fetchActiveBrainRules(): Promise<BrainRule[]> {
  try {
    const rules = await prisma.brainRule.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return rules;
  } catch (error) {
    console.error('Error fetching brain rules from database:', error);
    throw new Error('Failed to fetch brain rules from database');
  }
}

/**
 * Fetches all active brain projects from the database
 * 
 * @returns Promise<BrainProject[]> - Array of active brain projects
 */
export async function fetchActiveBrainProjects(): Promise<BrainProject[]> {
  try {
    const projects = await prisma.brainProject.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return projects;
  } catch (error) {
    console.error('Error fetching brain projects from database:', error);
    throw new Error('Failed to fetch brain projects from database');
  }
}

/**
 * Assembles the complete Calnan Brain context for AI injection
 * 
 * This is the main function that orchestrates reading static files and fetching
 * dynamic data from the database, then assembles them in the correct order.
 * 
 * @param role - Optional role name (e.g., 'investor', 'broker')
 * @returns Promise<BrainContext> - Complete brain context with assembled string
 * 
 * @example
 * ```typescript
 * // Without role
 * const context = await assembleBrainContext();
 * 
 * // With role
 * const context = await assembleBrainContext('investor');
 * 
 * // Use the assembled context
 * const prompt = `${systemRules}\n\n${context.assembledContext}\n\n${emailContent}\n\n${outputInstructions}`;
 * ```
 */
export async function assembleBrainContext(role?: string): Promise<BrainContext> {
  try {
    // 1. Read core brain file
    const core = await readCoreBrain();

    // 2. Read role-specific brain file (if role provided)
    let roleContent: string | null = null;
    if (role) {
      roleContent = await readRoleBrain(role);
    }

    // 3. Fetch active brain rules from database
    const rules = await fetchActiveBrainRules();

    // 4. Fetch active brain projects from database
    const projects = await fetchActiveBrainProjects();

    // 5. Assemble the complete context in the required order
    const sections: string[] = [];

    // Add core brain
    sections.push('=== CALNAN BRAIN: CORE IDENTITY & RULES ===');
    sections.push(core);
    sections.push('');

    // Add role-specific context if available
    if (roleContent) {
      sections.push(`=== CALNAN BRAIN: ${role?.toUpperCase()} ROLE CONTEXT ===`);
      sections.push(roleContent);
      sections.push('');
    }

    // Add dynamic brain rules
    if (rules.length > 0) {
      sections.push('=== CALNAN BRAIN: DYNAMIC RULES (from database) ===');
      rules.forEach((rule, index) => {
        sections.push(`\n[Rule ${index + 1}] Category: ${rule.category}`);
        sections.push(rule.ruleText);
      });
      sections.push('');
    }

    // Add active projects
    if (projects.length > 0) {
      sections.push('=== CALNAN BRAIN: ACTIVE PROJECTS (from database) ===');
      projects.forEach((project, index) => {
        sections.push(`\n[Project ${index + 1}] ${project.projectName}`);
        sections.push(project.keyFacts);
      });
      sections.push('');
    }

    const assembledContext = sections.join('\n');

    return {
      core,
      role: roleContent || undefined,
      rules,
      projects,
      assembledContext,
    };
  } catch (error) {
    console.error('Error assembling brain context:', error);
    throw error;
  }
}

/**
 * Convenience function to get just the assembled context string
 * 
 * @param role - Optional role name
 * @returns Promise<string> - Assembled context string ready for AI injection
 */
export async function getBrainContextString(role?: string): Promise<string> {
  const context = await assembleBrainContext(role);
  return context.assembledContext;
}
