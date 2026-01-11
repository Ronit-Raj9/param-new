-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ACADEMIC', 'STUDENT', 'VERIFIER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'LEAVE_OF_ABSENCE', 'REPEAT_YEAR', 'DROPPED_OUT', 'EARLY_EXIT', 'GRADUATED');

-- CreateEnum
CREATE TYPE "CurriculumStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('MANDATORY', 'ELECTIVE', 'MOOC', 'COLLOQUIUM', 'PROJECT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED', 'ISSUED', 'WITHHELD');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('CURRICULUM', 'SEMESTER_RESULT', 'DEGREE_PROPOSAL', 'CORRECTION');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CredentialType" AS ENUM ('SEMESTER', 'DEGREE', 'CERTIFICATE');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('PENDING', 'ISSUED', 'REVOKED', 'REPLACED');

-- CreateEnum
CREATE TYPE "DegreeProposalStatus" AS ENUM ('DRAFT', 'PENDING_ACADEMIC', 'PENDING_ADMIN', 'APPROVED', 'REJECTED', 'ISSUED');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('CSV_PARSE_STUDENTS', 'CSV_PARSE_RESULTS', 'PDF_GENERATE_SEMESTER', 'PDF_GENERATE_DEGREE', 'BLOCKCHAIN_MINT_SEMESTER', 'BLOCKCHAIN_MINT_DEGREE', 'BLOCKCHAIN_REVOKE', 'EMAIL_SEND');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'USER_ACTIVATED', 'PASSWORD_RESET', 'USER_CREATED', 'USER_UPDATED', 'USER_ROLE_CHANGED', 'USER_DEACTIVATED', 'STUDENT_CREATED', 'STUDENT_UPDATED', 'STUDENT_STATUS_CHANGED', 'STUDENTS_BULK_UPLOADED', 'CURRICULUM_CREATED', 'CURRICULUM_UPDATED', 'CURRICULUM_APPROVED', 'CURRICULUM_ARCHIVED', 'RESULTS_UPLOADED', 'RESULT_UPDATED', 'RESULT_SUBMITTED_FOR_REVIEW', 'RESULT_APPROVED', 'RESULT_REJECTED', 'CREDENTIAL_MINTED', 'CREDENTIAL_REVOKED', 'CREDENTIAL_REPLACED', 'DEGREE_PROPOSED', 'DEGREE_APPROVED', 'DEGREE_REJECTED', 'DEGREE_ISSUED', 'CORRECTION_REQUESTED', 'CORRECTION_APPROVED', 'CORRECTION_REJECTED', 'SETTINGS_UPDATED', 'EXPORT_GENERATED', 'OVERRIDE_USED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "privyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "phone" TEXT,
    "avatarUrl" TEXT,
    "activatedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrollmentNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "curriculumId" TEXT,
    "batch" TEXT NOT NULL,
    "admissionYear" INTEGER NOT NULL,
    "expectedGradYear" INTEGER NOT NULL,
    "currentSemester" INTEGER NOT NULL DEFAULT 1,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "cgpa" DOUBLE PRECISION,
    "status" "StudentStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "statusReason" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT,
    "address" TEXT,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "degreeType" TEXT NOT NULL,
    "durationYears" INTEGER NOT NULL DEFAULT 4,
    "totalSemesters" INTEGER NOT NULL DEFAULT 8,
    "totalCredits" INTEGER NOT NULL DEFAULT 160,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curricula" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CurriculumStatus" NOT NULL DEFAULT 'DRAFT',
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "documentHash" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_semesters" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "semesterNumber" INTEGER NOT NULL,
    "minCredits" INTEGER NOT NULL DEFAULT 0,
    "maxCredits" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "curriculumSemesterId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "lectureHours" INTEGER NOT NULL DEFAULT 3,
    "tutorialHours" INTEGER NOT NULL DEFAULT 1,
    "practicalHours" INTEGER NOT NULL DEFAULT 0,
    "type" "CourseType" NOT NULL DEFAULT 'MANDATORY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semester_results" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "sgpa" DOUBLE PRECISION,
    "cgpa" DOUBLE PRECISION,
    "totalCredits" INTEGER NOT NULL DEFAULT 0,
    "earnedCredits" INTEGER NOT NULL DEFAULT 0,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNote" TEXT,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "overriddenBy" TEXT,
    "pdfUrl" TEXT,
    "documentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semester_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_results" (
    "id" TEXT NOT NULL,
    "semesterResultId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoints" DOUBLE PRECISION NOT NULL,
    "credits" INTEGER NOT NULL,
    "earnedCredits" INTEGER NOT NULL,
    "internalMarks" DOUBLE PRECISION,
    "externalMarks" DOUBLE PRECISION,
    "totalMarks" DOUBLE PRECISION,
    "attendance" DOUBLE PRECISION,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "previousVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "CredentialType" NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'PENDING',
    "semesterResultId" TEXT,
    "degreeProposalId" TEXT,
    "documentHash" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "tokenId" TEXT,
    "contractAddress" TEXT,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "chainId" INTEGER,
    "metadata" JSONB,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "replacedById" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "approverId" TEXT,
    "approverRole" "Role",
    "note" TEXT,
    "decidedAt" TIMESTAMP(3),
    "step" INTEGER NOT NULL DEFAULT 1,
    "requiredRole" "Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "degree_proposals" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "expectedYear" INTEGER NOT NULL,
    "notes" TEXT,
    "totalCredits" INTEGER NOT NULL,
    "cgpa" DOUBLE PRECISION NOT NULL,
    "hasBacklogs" BOOLEAN NOT NULL DEFAULT false,
    "validationPassed" BOOLEAN NOT NULL DEFAULT false,
    "validationErrors" JSONB,
    "status" "DegreeProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "academicApproverId" TEXT,
    "academicApprovedAt" TIMESTAMP(3),
    "academicNote" TEXT,
    "adminApproverId" TEXT,
    "adminApprovedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "degree_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correction_requests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "supportingDocs" TEXT[],
    "status" "CorrectionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "originalCredentialId" TEXT,
    "newCredentialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "queueName" TEXT,
    "bullJobId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorId" TEXT,
    "actorRole" "Role",
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_settings" (
    "id" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "requiredLevels" INTEGER NOT NULL DEFAULT 2,
    "levelNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'ABV-IIITM Gwalior',
    "shortName" TEXT NOT NULL DEFAULT 'IIITM',
    "fullName" TEXT NOT NULL DEFAULT 'ABV-Indian Institute of Information Technology and Management Gwalior',
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "chainId" INTEGER NOT NULL DEFAULT 11155111,
    "rpcUrl" TEXT,
    "contractSemester" TEXT,
    "contractDegree" TEXT,
    "degreeSoulbound" BOOLEAN NOT NULL DEFAULT true,
    "allowCorrections" BOOLEAN NOT NULL DEFAULT true,
    "requireCreditValidation" BOOLEAN NOT NULL DEFAULT true,
    "gradingSystem" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "college_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_scales" (
    "id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoints" DOUBLE PRECISION NOT NULL,
    "minMarks" DOUBLE PRECISION,
    "maxMarks" DOUBLE PRECISION,
    "description" TEXT,
    "isPassing" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_scales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_privyId_key" ON "users"("privyId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_privyId_idx" ON "users"("privyId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_enrollmentNumber_key" ON "students"("enrollmentNumber");

-- CreateIndex
CREATE INDEX "students_enrollmentNumber_idx" ON "students"("enrollmentNumber");

-- CreateIndex
CREATE INDEX "students_programId_idx" ON "students"("programId");

-- CreateIndex
CREATE INDEX "students_batch_idx" ON "students"("batch");

-- CreateIndex
CREATE INDEX "students_status_idx" ON "students"("status");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE INDEX "curricula_status_idx" ON "curricula"("status");

-- CreateIndex
CREATE UNIQUE INDEX "curricula_programId_version_batch_key" ON "curricula"("programId", "version", "batch");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_semesters_curriculumId_semesterNumber_key" ON "curriculum_semesters"("curriculumId", "semesterNumber");

-- CreateIndex
CREATE INDEX "courses_code_idx" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_curriculumSemesterId_code_key" ON "courses"("curriculumSemesterId", "code");

-- CreateIndex
CREATE INDEX "semester_results_status_idx" ON "semester_results"("status");

-- CreateIndex
CREATE INDEX "semester_results_semester_idx" ON "semester_results"("semester");

-- CreateIndex
CREATE UNIQUE INDEX "semester_results_studentId_semester_academicYear_key" ON "semester_results"("studentId", "semester", "academicYear");

-- CreateIndex
CREATE INDEX "course_results_studentId_courseId_isActive_idx" ON "course_results"("studentId", "courseId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_semesterResultId_key" ON "credentials"("semesterResultId");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_degreeProposalId_key" ON "credentials"("degreeProposalId");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_replacedById_key" ON "credentials"("replacedById");

-- CreateIndex
CREATE INDEX "credentials_studentId_idx" ON "credentials"("studentId");

-- CreateIndex
CREATE INDEX "credentials_tokenId_idx" ON "credentials"("tokenId");

-- CreateIndex
CREATE INDEX "credentials_documentHash_idx" ON "credentials"("documentHash");

-- CreateIndex
CREATE INDEX "credentials_status_idx" ON "credentials"("status");

-- CreateIndex
CREATE INDEX "approvals_entityType_entityId_idx" ON "approvals"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "approvals_status_idx" ON "approvals"("status");

-- CreateIndex
CREATE INDEX "degree_proposals_studentId_idx" ON "degree_proposals"("studentId");

-- CreateIndex
CREATE INDEX "degree_proposals_status_idx" ON "degree_proposals"("status");

-- CreateIndex
CREATE INDEX "correction_requests_studentId_idx" ON "correction_requests"("studentId");

-- CreateIndex
CREATE INDEX "correction_requests_status_idx" ON "correction_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_token_idx" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_credentialId_idx" ON "share_links"("credentialId");

-- CreateIndex
CREATE INDEX "jobs_type_status_idx" ON "jobs"("type", "status");

-- CreateIndex
CREATE INDEX "jobs_bullJobId_idx" ON "jobs"("bullJobId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "approval_settings_type_key" ON "approval_settings"("type");

-- CreateIndex
CREATE UNIQUE INDEX "grade_scales_grade_key" ON "grade_scales"("grade");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curricula" ADD CONSTRAINT "curricula_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_semesters" ADD CONSTRAINT "curriculum_semesters_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_curriculumSemesterId_fkey" FOREIGN KEY ("curriculumSemesterId") REFERENCES "curriculum_semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semester_results" ADD CONSTRAINT "semester_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_results" ADD CONSTRAINT "course_results_semesterResultId_fkey" FOREIGN KEY ("semesterResultId") REFERENCES "semester_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_results" ADD CONSTRAINT "course_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_results" ADD CONSTRAINT "course_results_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_semesterResultId_fkey" FOREIGN KEY ("semesterResultId") REFERENCES "semester_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_degreeProposalId_fkey" FOREIGN KEY ("degreeProposalId") REFERENCES "degree_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "degree_proposals" ADD CONSTRAINT "degree_proposals_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "credentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
