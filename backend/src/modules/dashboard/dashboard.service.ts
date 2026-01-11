import { prisma } from "../../config/database.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("dashboard-service");

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboardStats() {
  const [
    totalStudents,
    activeStudents,
    resultsPublished,
    credentialsIssued,
    pendingResults,
    pendingDegrees,
    pendingCorrections,
    recentActivity,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.semesterResult.count({ where: { status: "ISSUED" } }),
    prisma.credential.count({ where: { status: "ISSUED" } }),
    prisma.approval.count({ 
      where: { 
        type: "SEMESTER_RESULT", 
        status: "PENDING" 
      } 
    }),
    prisma.approval.count({ 
      where: { 
        type: "DEGREE_PROPOSAL", 
        status: "PENDING" 
      } 
    }),
    prisma.approval.count({ 
      where: { 
        type: "CORRECTION", 
        status: "PENDING" 
      } 
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
  ]);

  // Get active share links count
  const activeShares = await prisma.shareLink.count({
    where: {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
      revokedAt: null,
    },
  });

  return {
    stats: {
      totalStudents,
      activeStudents,
      resultsPublished,
      credentialsIssued,
      activeShares,
    },
    pendingActions: {
      results: pendingResults,
      degrees: pendingDegrees,
      corrections: pendingCorrections,
    },
    recentActivity,
  };
}

/**
 * Get student dashboard data
 */
export async function getStudentDashboard(userId: string) {
  const student = await prisma.student.findFirst({
    where: { userId },
    include: {
      program: true,
      user: {
        select: { id: true, name: true, email: true, role: true, status: true },
      },
    },
  });

  if (!student) {
    return null;
  }

  // Get latest semester result
  const latestResult = await prisma.semesterResult.findFirst({
    where: { 
      studentId: student.id,
      status: "ISSUED",
    },
    orderBy: { semester: "desc" },
    include: {
      courseResults: {
        include: { course: true },
      },
      credential: true,
    },
  });

  // Get degree credential if issued
  const degreeCredential = await prisma.credential.findFirst({
    where: {
      studentId: student.id,
      type: "DEGREE",
      status: "ISSUED",
    },
  });

  // Get all credentials
  const credentials = await prisma.credential.findMany({
    where: {
      studentId: student.id,
      status: "ISSUED",
    },
    orderBy: { issuedAt: "desc" },
  });

  // Get active share links count
  const shareLinksCount = await prisma.shareLink.count({
    where: {
      studentId: student.id,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
      revokedAt: null,
    },
  });

  return {
    profile: {
      id: student.id,
      enrollmentNumber: student.enrollmentNumber,
      name: student.name,
      email: student.email,
      program: student.program.name,
      batch: student.batch,
      currentSemester: student.currentSemester,
      cgpa: student.cgpa,
      totalCredits: student.totalCredits,
      status: student.status,
      walletAddress: student.walletAddress,
    },
    latestResult: latestResult ? {
      id: latestResult.id,
      semester: latestResult.semester,
      academicYear: latestResult.academicYear,
      sgpa: latestResult.sgpa,
      credits: latestResult.totalCredits,
      status: latestResult.status,
      publishedAt: latestResult.approvedAt,
      isMinted: !!latestResult.credential?.tokenId,
      txHash: latestResult.credential?.txHash,
    } : null,
    degreeStatus: degreeCredential ? {
      issued: true,
      type: "Degree",
      isMinted: !!degreeCredential.tokenId,
      txHash: degreeCredential.txHash,
    } : {
      issued: false,
      expectedDate: null,
      type: "Degree",
    },
    credentials,
    shareLinksCount,
    announcements: [], // Placeholder for announcements feature
  };
}

/**
 * Get quick stats for header/overview
 */
export async function getQuickStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    todayLogins,
    pendingApprovals,
    issuedToday,
  ] = await Promise.all([
    prisma.auditLog.count({
      where: {
        action: "USER_LOGIN",
        createdAt: { gte: today },
      },
    }),
    prisma.approval.count({
      where: { status: "PENDING" },
    }),
    prisma.credential.count({
      where: {
        issuedAt: { gte: today },
      },
    }),
  ]);

  return {
    todayLogins,
    pendingApprovals,
    issuedToday,
  };
}
