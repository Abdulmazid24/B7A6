export const RESPONSE_MESSAGES = {
  // Auth
  REGISTER_SUCCESS: "User registered successfully",
  LOGIN_SUCCESS: "User logged in successfully",
  GOOGLE_LOGIN_SUCCESS: "Google authentication successful",
  TOKEN_REFRESH_SUCCESS: "Access token refreshed successfully",
  PASSWORD_CHANGE_SUCCESS: "Password updated successfully",
  LOGOUT_SUCCESS: "Logged out successfully",

  // Profile & User
  PROFILE_FETCH_SUCCESS: "Profile retrieved successfully",
  PROFILE_UPDATE_SUCCESS: "Profile updated successfully",
  USERS_FETCH_SUCCESS: "Users retrieved successfully",
  USER_ROLE_STATUS_UPDATE_SUCCESS: "User role/status updated successfully",
  USER_DELETE_SUCCESS: "User account deactivated successfully",

  // Department
  DEPARTMENT_CREATE_SUCCESS: "Department created successfully",
  DEPARTMENTS_FETCH_SUCCESS: "Departments retrieved successfully",
  DEPARTMENT_FETCH_SUCCESS: "Department details retrieved successfully",
  DEPARTMENT_UPDATE_SUCCESS: "Department updated successfully",
  DEPARTMENT_DELETE_SUCCESS: "Department soft-deleted successfully",

  // Semester
  SEMESTER_CREATE_SUCCESS: "Academic Semester created successfully",
  SEMESTERS_FETCH_SUCCESS: "Semesters retrieved successfully",
  SEMESTER_FETCH_SUCCESS: "Semester details retrieved successfully",
  SEMESTER_UPDATE_SUCCESS: "Semester updated successfully",
  SEMESTER_DELETE_SUCCESS: "Semester soft-deleted successfully",

  // Course
  COURSE_CREATE_SUCCESS: "Course created successfully with prerequisites",
  COURSES_FETCH_SUCCESS: "Courses retrieved successfully",
  COURSE_FETCH_SUCCESS: "Course details retrieved successfully",
  COURSE_UPDATE_SUCCESS: "Course updated successfully",
  COURSE_DELETE_SUCCESS: "Course soft-deleted successfully",

  // Course Offering & Sections
  OFFERING_CREATE_SUCCESS: "Course offering created successfully",
  SECTION_CREATE_SUCCESS: "Section added to offering successfully",
  OFFERINGS_FETCH_SUCCESS: "Course offerings retrieved successfully",
  OFFERING_FETCH_SUCCESS: "Offering details retrieved successfully",
  SECTION_UPDATE_SUCCESS: "Section updated successfully",
  OFFERING_DELETE_SUCCESS: "Course offering deleted successfully",

  // Enrollment
  COURSE_REGISTER_SUCCESS: "Course registered successfully",
  COURSE_WITHDRAW_SUCCESS: "Course withdrawn successfully",
  MY_COURSES_FETCH_SUCCESS: "Enrolled courses retrieved successfully",
  SECTION_ROSTER_FETCH_SUCCESS: "Section student roster retrieved successfully",

  // Grades
  GRADE_SUBMIT_SUCCESS: "Student marks and grades updated successfully",
  SECTION_GRADES_FETCH_SUCCESS: "Section grades retrieved successfully",
  TRANSCRIPT_FETCH_SUCCESS: "Academic transcript retrieved successfully",

  // Payments
  CHECKOUT_SESSION_CREATE_SUCCESS: "Stripe checkout session created successfully",
  PAYMENT_VERIFY_SUCCESS: "Payment status verified successfully",
  INVOICES_FETCH_SUCCESS: "Student tuition invoices and receipts retrieved successfully",
  PAYMENTS_FETCH_SUCCESS: "All university payments retrieved successfully",

  // Admin & System
  DASHBOARD_STATS_SUCCESS: "Admin dashboard analytics and statistics retrieved successfully",
  AUDIT_LOGS_FETCH_SUCCESS: "Audit logs retrieved successfully",
  HEALTH_CHECK_SUCCESS: "University Management System API is healthy and operational",
} as const;
