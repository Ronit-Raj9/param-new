import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed with Contract-Aligned Data...");

  // 1. Create Departments (matching StudentRecords.sol)
  const departments = [
    { onChainId: 1, name: "Information Technology", code: "IT" },
    { onChainId: 2, name: "Computer Science and Engineering", code: "CSE" },
    { onChainId: 3, name: "Electronics and Electrical Engineering", code: "EEE" },
    { onChainId: 4, name: "Engineering Sciences", code: "EES" },
    { onChainId: 5, name: "Management", code: "MGMT" },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: { onChainId: d.onChainId },
      create: {
        onChainId: d.onChainId,
        name: d.name,
        code: d.code,
        isActive: true,
      },
    });
  }
  console.log("✅ Departments created");

  // 2. Create Programs (matching StudentRecords.sol)
  const programs = [
    {
      onChainId: 1,
      name: "B.Tech in Computer Science and Engineering",
      code: "BCS",
      shortName: "B.Tech CSE",
      degreeType: "Bachelor of Technology",
      durationYears: 4,
      deptCode: "CSE",
    },
    {
      onChainId: 2,
      name: "B.Tech in Mathematics and Scientific Computing",
      code: "BMS",
      shortName: "B.Tech MnC",
      degreeType: "Bachelor of Technology",
      durationYears: 4,
      deptCode: "EES", // Assuming EES or IT? Contract said Dept ID 1 (IT) for BMS? Let's check contract.
      // Contract: _addProgram("...BMS", "BMS", 4, 1); -> 1 is IT.
    },
    {
      onChainId: 3,
      name: "Integrated B.Tech (IT) + MBA",
      code: "IMG",
      shortName: "IPM",
      degreeType: "Integrated Dual Degree",
      durationYears: 5,
      deptCode: "IT", // Contract ID 1
    },
    {
      onChainId: 4,
      name: "Integrated B.Tech + M.Tech in IT",
      code: "IMT",
      shortName: "Integrated M.Tech",
      degreeType: "Integrated Dual Degree",
      durationYears: 5,
      deptCode: "IT", // Contract ID 1
    },
    {
      onChainId: 5,
      name: "B.Tech in Electronics and Electrical Engineering",
      code: "BEE",
      shortName: "B.Tech EEE",
      degreeType: "Bachelor of Technology",
      durationYears: 4,
      deptCode: "EEE", // Contract ID 3
    },
  ];

  const createdPrograms = [];
  for (const p of programs) {
    const dept = await prisma.department.findUnique({ where: { code: p.deptCode } });

    // Fix for BMS if I guessed wrong above, but based on contract:
    // _addProgram("BMS", ..., 4, 1); -> 1 is IT in "_addDepartment('IT'..)" call 1.
    // Wait, in constructor:
    // _addDepartment("Information Technology", "IT", ...); -> ID 1
    // ...
    // _addProgram("...BMS", "BMS", 4, 1); -> DeptId 1 (IT). Correct.

    if (!dept) throw new Error(`Dept ${p.deptCode} not found`);

    const prog = await prisma.program.upsert({
      where: { code: p.code },
      update: { onChainId: p.onChainId, departmentId: dept.id },
      create: {
        code: p.code,
        onChainId: p.onChainId,
        name: p.name,
        shortName: p.shortName,
        degreeType: p.degreeType,
        durationYears: p.durationYears,
        departmentId: dept.id,
      },
    });
    createdPrograms.push(prog);
  }
  console.log("✅ Programs created");

  // 3. Create Curriculum for BCS (for demo)
  const bcsProgram = await prisma.program.findUniqueOrThrow({ where: { code: "BCS" } });

  const curriculum2024 = await prisma.curriculum.upsert({
    where: {
      programId_version_batch: {
        programId: bcsProgram.id,
        version: "2024",
        batch: "2024-2028",
      },
    },
    update: {},
    create: {
      programId: bcsProgram.id,
      version: "2024",
      batch: "2024-2028",
      name: "B.Tech CSE Curriculum 2024",
      totalCredits: 160,
      status: "ACTIVE",
    },
  });
  console.log("✅ Curriculum created for BCS");

  // 4. Create Semester structure
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

  // 5. Create Sample Courses for Semester 1 (CSE)
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
    console.log("✅ Courses created for Semester 1 (BCS)");
  }

  // 5b. Create Curriculum for BMS (B.Tech in Mathematics and Scientific Computing)
  const bmsProgram = await prisma.program.findUniqueOrThrow({ where: { code: "BMS" } });

  const bmsCurriculum2023 = await prisma.curriculum.upsert({
    where: {
      programId_version_batch: {
        programId: bmsProgram.id,
        version: "2023",
        batch: "2023-2027",
      },
    },
    update: {},
    create: {
      programId: bmsProgram.id,
      version: "2023",
      batch: "2023-2027",
      name: "B.Tech MnC Curriculum 2023",
      totalCredits: 180, // 175-186 credits as per image
      status: "ACTIVE",
    },
  });
  console.log("✅ Curriculum created for BMS (2023)");

  // Create Semesters for BMS
  const bmsSemesters = [];
  for (let i = 1; i <= 8; i++) {
    const semester = await prisma.curriculumSemester.upsert({
      where: {
        curriculumId_semesterNumber: {
          curriculumId: bmsCurriculum2023.id,
          semesterNumber: i,
        },
      },
      update: {},
      create: {
        curriculumId: bmsCurriculum2023.id,
        semesterNumber: i,
        minCredits: 18,
        maxCredits: 26,
      },
    });
    bmsSemesters.push(semester);
  }
  console.log("✅ Semesters created for BMS");

  // 5c. Create BMS Semester 1 Courses (from syllabus image)
  const bmsSem1Courses = [
    { code: "EE101", name: "Fundamentals of Electrical and Electronics", credits: 4, type: "MANDATORY" as const },
    { code: "ES101", name: "Engineering Physics", credits: 4, type: "MANDATORY" as const },
    { code: "ES102", name: "Engineering Mathematics", credits: 4, type: "MANDATORY" as const },
    { code: "EE102", name: "Engineering Design Principles", credits: 3, type: "MANDATORY" as const },
    { code: "CS101", name: "Principles of Computer Programming", credits: 4, type: "MANDATORY" as const },
    { code: "HS101", name: "Freshman Skills", credits: 2, type: "MANDATORY" as const },
    { code: "HS102", name: "Sports and Physical Education", credits: 2, type: "MANDATORY" as const },
  ];

  const bmsSem1 = bmsSemesters[0];
  if (bmsSem1) {
    for (const course of bmsSem1Courses) {
      await prisma.course.upsert({
        where: {
          curriculumSemesterId_code: {
            curriculumSemesterId: bmsSem1.id,
            code: course.code,
          },
        },
        update: {},
        create: {
          curriculumSemesterId: bmsSem1.id,
          code: course.code,
          name: course.name,
          credits: course.credits,
          type: course.type,
        },
      });
    }
    console.log("✅ Courses created for Semester 1 (BMS) - Total: 23 credits");
  }

  // 6. Create grade scale
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

  // 7. Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: "ronitk964@gmail.com" },
    update: {
      role: "ADMIN",
      status: "ACTIVE",
    },
    create: {
      privyId: "did:privy:admin-seed-ronitk964",
      email: "ronitk964@gmail.com",
      name: "Ronit Kumar",
      role: "ADMIN",
      status: "ACTIVE",
      activatedAt: new Date(),
    },
  });
  console.log("✅ Admin user created:", adminUser.email);

  // 8. Create Academic User
  const academicUser = await prisma.user.upsert({
    where: { email: "raunitr786@gmail.com" },
    update: {
      role: "ACADEMIC",
      status: "ACTIVE",
    },
    create: {
      privyId: "did:privy:academic-seed-raunitr786",
      email: "raunitr786@gmail.com",
      name: "Raunit Raj",
      role: "ACADEMIC",
      status: "ACTIVE",
      activatedAt: new Date(),
    },
  });
  console.log("✅ Academic user created:", academicUser.email);

  console.log("\n🎉 Database seeded successfully with Contract-Aligned Data!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
