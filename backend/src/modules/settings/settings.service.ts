import { prisma } from "../../config/database.js";
import { createLogger } from "../../utils/logger.js";
import type { CollegeSettings, ApprovalSettings } from "@prisma/client";

const logger = createLogger("settings-service");

export interface SystemSettings {
  college: CollegeSettings | null;
  approvals: ApprovalSettings[];
}

/**
 * Get all system settings
 */
export async function getSettings(): Promise<SystemSettings> {
  const [college, approvals] = await Promise.all([
    prisma.collegeSettings.findFirst(),
    prisma.approvalSettings.findMany(),
  ]);

  return {
    college,
    approvals,
  };
}

/**
 * Get college settings
 */
export async function getCollegeSettings(): Promise<CollegeSettings> {
  let settings = await prisma.collegeSettings.findFirst();
  
  // Create default settings if not exist
  if (!settings) {
    settings = await prisma.collegeSettings.create({
      data: {
        id: "default",
        name: "ABV-IIITM Gwalior",
        shortName: "IIITM",
        fullName: "ABV-Indian Institute of Information Technology and Management Gwalior",
        country: "India",
        chainId: 84532, // Base Sepolia
        degreeSoulbound: true,
        allowCorrections: true,
        requireCreditValidation: true,
      },
    });
  }

  return settings;
}

/**
 * Update college settings
 */
export async function updateCollegeSettings(
  updates: Partial<Omit<CollegeSettings, "id" | "updatedAt">>
): Promise<CollegeSettings> {
  // Ensure default settings exist
  await getCollegeSettings();

  // Handle gradingSystem separately if provided
  const { gradingSystem, ...otherUpdates } = updates as any;
  
  const updateData: any = { ...otherUpdates };
  if (gradingSystem !== undefined) {
    updateData.gradingSystem = gradingSystem === null ? null : gradingSystem;
  }

  const settings = await prisma.collegeSettings.update({
    where: { id: "default" },
    data: updateData,
  });

  logger.info({ updates }, "College settings updated");
  return settings;
}

/**
 * Get approval settings by type
 */
export async function getApprovalSettings(type: string): Promise<ApprovalSettings | null> {
  return prisma.approvalSettings.findUnique({
    where: { type: type as any },
  });
}

/**
 * Update approval settings
 */
export async function updateApprovalSettings(
  type: string,
  updates: Partial<Omit<ApprovalSettings, "id" | "type" | "createdAt" | "updatedAt">>
): Promise<ApprovalSettings> {
  const settings = await prisma.approvalSettings.upsert({
    where: { type: type as any },
    create: {
      type: type as any,
      ...updates,
    },
    update: updates,
  });

  logger.info({ type, updates }, "Approval settings updated");
  return settings;
}
