import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create Programs
  const btechIT = await prisma.program.upsert({
    where: { code: "BT-IT" },
    update: {},
    create: {
      code: "BT-IT",
      name: "Bachelor of Technology in Information Technology",
      shortName: "B.Tech IT",
      degreeType: "Bachelor of Technology",
      durationYears: 4,
      totalSemesters: 8,
      totalCredits: 160,
    },
  });

  const btechIPM = await prisma.program.upsert({
    where: { code: "IPM-MBA" },
    update: {},
    create: {
      code: "IPM-MBA",
      name: "Integrated Program in Management",
      shortName: "IPM",
      degreeType: "Master of Business Administration",
      durationYears: 5,
      totalSemesters: 10,
      totalCredits: 200,
    },
  });

  const mtech = await prisma.program.upsert({
    where: { code: "MT-CS" },
    update: {},
    create: {
      code: "MT-CS",
      name: "Master of Technology in Computer Science",
      shortName: "M.Tech CS",
      degreeType: "Master of Technology",
      durationYears: 2,
      totalSemesters: 4,
      totalCredits: 64,
    },
  });
  console.log("✅ Programs created");

  // Create Curriculum for B.Tech IT
  const curriculum2024 = await prisma.curriculum.upsert({
    where: {
      programId_version_batch: {
        programId: btechIT.id,
        version: "2024",
        batch: "2024-2028",
      },
    },
    update: {},
    create: {
      programId: btechIT.id,
      version: "2024",
      batch: "2024-2028",
      name: "B.Tech IT Curriculum 2024",
      totalCredits: 160,
      status: "ACTIVE",
    },
  });
  console.log("✅ Curriculum created");

  // Create Semester structure
  const semesters = [];
  for (let i = 1; i <= 8; i++) {
    const semester = await prisma.curriculumSemester.upsert({
      where: {
        curriculumId_semesterNumber: {
          curriculumId: curriculum2024.id,
          semesterNumber: i,
        },
      },
      update: {},
      create: {
        curriculumId: curriculum2024.id,
        semesterNumber: i,
        minCredits: 16,
        maxCredits: 24,
      },
    });
    semesters.push(semester);
  }
  console.log("✅ Semesters created");

  // Create Sample Courses for Semester 1
  const courses = [
    { code: "MA101", name: "Mathematics I", credits: 4, type: "MANDATORY" as const },
    { code: "CS101", name: "Introduction to Programming", credits: 4, type: "MANDATORY" as const },
    { code: "CS102", name: "Programming Lab", credits: 2, type: "MANDATORY" as const },
    { code: "PH101", name: "Physics", credits: 3, type: "MANDATORY" as const },
    { code: "EE101", name: "Basic Electrical Engineering", credits: 3, type: "MANDATORY" as const },
    { code: "HS101", name: "Communication Skills", credits: 2, type: "MANDATORY" as const },
  ];

  const sem1 = semesters[0];
  if (sem1) {
    for (const course of courses) {
      await prisma.course.upsert({
        where: {
          curriculumSemesterId_code: {
            curriculumSemesterId: sem1.id,
            code: course.code,
          },
        },
        update: {},
        create: {
          curriculumSemesterId: sem1.id,
          code: course.code,
          name: course.name,
          credits: course.credits,
          type: course.type,
        },
      });
    }
    console.log("✅ Courses created for Semester 1");
  }

  // Create more courses for Semester 2
  const semester2Courses = [
    { code: "MA102", name: "Mathematics II", credits: 4, type: "MANDATORY" as const },
    { code: "CS201", name: "Data Structures", credits: 4, type: "MANDATORY" as const },
    { code: "CS202", name: "Data Structures Lab", credits: 2, type: "MANDATORY" as const },
    { code: "CS203", name: "Digital Logic Design", credits: 3, type: "MANDATORY" as const },
    { code: "EC101", name: "Electronics", credits: 3, type: "MANDATORY" as const },
    { code: "HS102", name: "Technical Writing", credits: 2, type: "MANDATORY" as const },
  ];

  const sem2 = semesters[1];
  if (sem2) {
    for (const course of semester2Courses) {
      await prisma.course.upsert({
        where: {
          curriculumSemesterId_code: {
            curriculumSemesterId: sem2.id,
            code: course.code,
          },
        },
        update: {},
        create: {
          curriculumSemesterId: sem2.id,
          code: course.code,
          name: course.name,
          credits: course.credits,
          type: course.type,
        },
      });
    }
    console.log("✅ Courses created for Semester 2");
  }

  // Create grade scale
  const grades = [
    { grade: "A+", gradePoints: 10.0, minMarks: 90, description: "Outstanding", displayOrder: 1 },
    { grade: "A", gradePoints: 9.0, minMarks: 80, description: "Excellent", displayOrder: 2 },
    { grade: "B+", gradePoints: 8.0, minMarks: 70, description: "Very Good", displayOrder: 3 },
    { grade: "B", gradePoints: 7.0, minMarks: 60, description: "Good", displayOrder: 4 },
    { grade: "C+", gradePoints: 6.0, minMarks: 50, description: "Average", displayOrder: 5 },
    { grade: "C", gradePoints: 5.0, minMarks: 45, description: "Below Average", displayOrder: 6 },
    { grade: "D", gradePoints: 4.0, minMarks: 40, description: "Pass", displayOrder: 7 },
    { grade: "F", gradePoints: 0.0, minMarks: 0, description: "Fail", displayOrder: 8, isPassing: false },
  ];

  for (const g of grades) {
    await prisma.gradeScale.upsert({
      where: { grade: g.grade },
      update: {},
      create: {
        grade: g.grade,
        gradePoints: g.gradePoints,
        minMarks: g.minMarks,
        description: g.description,
        displayOrder: g.displayOrder,
        isPassing: g.isPassing ?? true,
      },
    });
  }
  console.log("✅ Grade scale created");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\nSeeded data:");
  console.log("  - 3 Programs (B.Tech IT, IPM, M.Tech CS)");
  console.log("  - 1 Curriculum (B.Tech IT 2024)");
  console.log("  - 8 Semesters");
  console.log("  - 12 Courses (6 per semester for Sem 1 & 2)");
  console.log("  - 8 Grade scale entries");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
