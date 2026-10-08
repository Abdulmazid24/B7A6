import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";

async function main() {
  console.log("🌱 Seeding University Management System database...");

  // 1. Clean existing records safely
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.tuitionFee.deleteMany();
  await prisma.studentGrade.deleteMany();
  await prisma.studentEnrollment.deleteMany();
  await prisma.courseSection.deleteMany();
  await prisma.courseOffering.deleteMany();
  await prisma.coursePrerequisite.deleteMany();
  await prisma.course.deleteMany();
  await prisma.academicSemester.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.academicDepartment.deleteMany();

  // 2. Hash default passwords
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("AdminPassword123!", salt);
  const facultyPasswordHash = await bcrypt.hash("FacultyPassword123!", salt);
  const studentPasswordHash = await bcrypt.hash("StudentPassword123!", salt);

  // 3. Create Academic Departments
  const cseDept = await prisma.academicDepartment.create({
    data: {
      code: "CSE",
      name: "Computer Science & Engineering",
      description: "Department of Computer Science and Engineering",
    },
  });

  const eeeDept = await prisma.academicDepartment.create({
    data: {
      code: "EEE",
      name: "Electrical & Electronic Engineering",
      description: "Department of Electrical and Electronic Engineering",
    },
  });

  const bbaDept = await prisma.academicDepartment.create({
    data: {
      code: "BBA",
      name: "Business Administration",
      description: "School of Business and Entrepreneurship",
    },
  });

  console.log("✅ Seeded Academic Departments");

  // 4. Create Academic Semesters
  const fall2026 = await prisma.academicSemester.create({
    data: {
      code: "FALL2026",
      name: "Fall 2026",
      year: 2026,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-31"),
      isCurrent: true,
      isRegistrationOpen: true,
    },
  });

  const spring2026 = await prisma.academicSemester.create({
    data: {
      code: "SPRING2026",
      name: "Spring 2026",
      year: 2026,
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-05-30"),
      isCurrent: false,
      isRegistrationOpen: false,
    },
  });

  console.log("✅ Seeded Academic Semesters");

  // 5. Create Courses
  const cse101 = await prisma.course.create({
    data: {
      code: "CSE101",
      title: "Introduction to Computer Science",
      credits: 3,
      description: "Foundations of computing, algorithmic thinking, and problem solving",
      departmentId: cseDept.id,
    },
  });

  const cse102 = await prisma.course.create({
    data: {
      code: "CSE102",
      title: "Structured Programming",
      credits: 3,
      description: "Structured programming principles using C/C++",
      departmentId: cseDept.id,
    },
  });

  const cse201 = await prisma.course.create({
    data: {
      code: "CSE201",
      title: "Data Structures and Algorithms",
      credits: 4,
      description: "Arrays, lists, stacks, queues, trees, graphs, sorting, and complexity",
      departmentId: cseDept.id,
    },
  });

  // Link Prerequisites: CSE101 -> CSE102 -> CSE201
  await prisma.coursePrerequisite.create({
    data: {
      courseId: cse102.id,
      prerequisiteId: cse101.id,
    },
  });

  await prisma.coursePrerequisite.create({
    data: {
      courseId: cse201.id,
      prerequisiteId: cse102.id,
    },
  });

  console.log("✅ Seeded Courses & Prerequisites");

  // 6. Create Users for 3 Distinct Roles
  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@university.edu",
      password: adminPasswordHash,
      role: "ADMIN",
      isEmailVerified: true,
      profile: {
        create: {
          firstName: "System",
          lastName: "Administrator",
          phoneNumber: "+8801700000001",
          address: "University Admin Building, Level 4",
        },
      },
    },
  });

  // Faculty User
  const facultyUser = await prisma.user.create({
    data: {
      email: "faculty@university.edu",
      password: facultyPasswordHash,
      role: "FACULTY",
      isEmailVerified: true,
      profile: {
        create: {
          firstName: "Dr. Farhan",
          lastName: "Ahmed",
          phoneNumber: "+8801700000002",
          departmentId: cseDept.id,
          facultyId: "FAC-2026-001",
          designation: "Assistant Professor",
          address: "Faculty Quarters, Block B",
        },
      },
    },
  });

  // Student User 1 (Demo)
  const studentUser = await prisma.user.create({
    data: {
      email: "student@university.edu",
      password: studentPasswordHash,
      role: "STUDENT",
      isEmailVerified: true,
      profile: {
        create: {
          firstName: "Tanvir",
          lastName: "Hossain",
          phoneNumber: "+8801700000003",
          departmentId: cseDept.id,
          studentId: "STU-2026-001",
          address: "Dhaka, Bangladesh",
        },
      },
    },
  });

  // Student User 2 (Demo Peer)
  const studentUser2 = await prisma.user.create({
    data: {
      email: "student2@university.edu",
      password: studentPasswordHash,
      role: "STUDENT",
      isEmailVerified: true,
      profile: {
        create: {
          firstName: "Nafisa",
          lastName: "Kamal",
          phoneNumber: "+8801700000004",
          departmentId: cseDept.id,
          studentId: "STU-2026-002",
          address: "Dhaka, Bangladesh",
        },
      },
    },
  });

  console.log("✅ Seeded Users for All 3 Roles (Admin, Faculty, Student)");

  // 7. Create Course Offering & Sections for Fall 2026
  const offeringCSE101 = await prisma.courseOffering.create({
    data: {
      courseId: cse101.id,
      semesterId: fall2026.id,
    },
  });

  const section1 = await prisma.courseSection.create({
    data: {
      offeringId: offeringCSE101.id,
      sectionNumber: 1,
      capacity: 35,
      enrolledCount: 1,
      roomNumber: "UB-401",
      schedule: "Sun, Tue 10:00 AM - 11:30 AM",
      facultyId: facultyUser.id,
    },
  });

  const section2 = await prisma.courseSection.create({
    data: {
      offeringId: offeringCSE101.id,
      sectionNumber: 2,
      capacity: 30,
      enrolledCount: 0,
      roomNumber: "UB-402",
      schedule: "Mon, Wed 02:00 PM - 03:30 PM",
      facultyId: facultyUser.id,
    },
  });

  console.log("✅ Seeded Course Offerings and Sections");

  // 8. Enroll Student 1 in Section 1
  const enrollment = await prisma.studentEnrollment.create({
    data: {
      studentId: studentUser.id,
      sectionId: section1.id,
      status: "ENROLLED",
    },
  });

  // 9. Create Student Grade Entry
  await prisma.studentGrade.create({
    data: {
      enrollmentId: enrollment.id,
      studentId: studentUser.id,
      sectionId: section1.id,
      facultyId: facultyUser.id,
      midtermMarks: 26.5,
      finalMarks: 44.0,
      assessmentMarks: 18.0,
      totalMarks: 88.5,
      letterGrade: "A+",
      gradePoint: 4.0,
      isPublished: true,
    },
  });

  console.log("✅ Seeded Sample Enrollment and Grades");

  // 10. Create Tuition Fee & Invoice for Fall 2026
  await prisma.tuitionFee.create({
    data: {
      studentId: studentUser.id,
      semesterId: fall2026.id,
      totalAmount: 1500.0,
      paidAmount: 0.0,
      dueAmount: 1500.0,
      status: "UNPAID",
      dueDate: new Date("2026-10-30"),
    },
  });

  console.log("✅ Seeded Tuition Invoices");

  // 11. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: "DATABASE_INITIAL_SEED",
      resource: "SYSTEM",
      details: "Initial database seed completed with baseline departments, courses, and demo users",
    },
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
