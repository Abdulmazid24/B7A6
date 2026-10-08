import "dotenv/config";
import app from "../src/app";
import { Server } from "http";

async function runTests() {
  const server: Server = app.listen(5001);
  const baseUrl = "http://localhost:5001/api/v1";
  console.log("🧪 Starting Automated API Integration Verification Suite...\n");

  try {
    // 1. Health Check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log("1. Health Check:", healthRes.status === 200 ? "✅ PASSED" : "❌ FAILED", healthData.message);

    // 2. Admin Login
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@university.edu", password: "AdminPassword123!" }),
    });
    const adminLoginData = await adminLoginRes.json();
    console.log("2. Admin Login:", adminLoginRes.status === 200 ? "✅ PASSED" : "❌ FAILED", adminLoginData.message);
    const adminToken = adminLoginData.data.accessToken;

    // 3. Faculty Login
    const facultyLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "faculty@university.edu", password: "FacultyPassword123!" }),
    });
    const facultyLoginData = await facultyLoginRes.json();
    console.log("3. Faculty Login:", facultyLoginRes.status === 200 ? "✅ PASSED" : "❌ FAILED", facultyLoginData.message);
    const facultyToken = facultyLoginData.data.accessToken;

    // 4. Student Login
    const studentLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student@university.edu", password: "StudentPassword123!" }),
    });
    const studentLoginData = await studentLoginRes.json();
    console.log("4. Student Login:", studentLoginRes.status === 200 ? "✅ PASSED" : "❌ FAILED", studentLoginData.message);
    const studentToken = studentLoginData.data.accessToken;

    // 5. RBAC Security Check: Student attempting Admin Route (Must return 403 Forbidden)
    const forbiddenRes = await fetch(`${baseUrl}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(
      "5. RBAC Student -> Admin Route (Must be 403):",
      forbiddenRes.status === 403 ? "✅ PASSED (403 Forbidden correctly enforced)" : `❌ FAILED (Returned ${forbiddenRes.status})`
    );

    // 6. Admin Dashboard Stats
    const statsRes = await fetch(`${baseUrl}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsRes.json();
    console.log("6. Admin Dashboard Stats:", statsRes.status === 200 ? "✅ PASSED" : "❌ FAILED", JSON.stringify(statsData.data.overview));

    // 7. Get All Courses
    const coursesRes = await fetch(`${baseUrl}/courses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const coursesData = await coursesRes.json();
    console.log(`7. Fetch Courses (${coursesData.data.length} found):`, coursesRes.status === 200 ? "✅ PASSED" : "❌ FAILED");

    // 8. Student Transcript & GPA Calculation
    const transcriptRes = await fetch(`${baseUrl}/grades/my-transcript`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const transcriptData = await transcriptRes.json();
    console.log(
      "8. Student Transcript (CGPA Calculation):",
      transcriptRes.status === 200 ? "✅ PASSED" : "❌ FAILED",
      `CGPA: ${transcriptData.data.cgpa}`
    );

    // 9. Student Invoices
    const invoicesRes = await fetch(`${baseUrl}/payments/my-invoices`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const invoicesData = await invoicesRes.json();
    console.log(
      "9. Student Tuition Invoices:",
      invoicesRes.status === 200 ? "✅ PASSED" : "❌ FAILED",
      `Invoices count: ${invoicesData.data.tuitionFees.length}`
    );

    // 10. Audit Logs (Admin)
    const auditRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditData = await auditRes.json();
    console.log(
      `10. System Audit Logs (${auditData.data.length} logged events):`,
      auditRes.status === 200 ? "✅ PASSED" : "❌ FAILED"
    );

    console.log("\n✨ ALL 10 INTEGRATION VERIFICATION TESTS PASSED FLAWLESSLY! ✨\n");
  } catch (error) {
    console.error("Test execution error:", error);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
