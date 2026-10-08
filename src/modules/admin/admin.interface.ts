export interface IAdminOverviewStats {
  totalStudents: number;
  totalFaculty: number;
  totalAdmins: number;
  totalDepartments: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenueCollected: number;
  totalOutstandingDue: number;
}

export interface IAdminActiveSemester {
  id: string;
  name: string;
  code: string;
  year: number;
  isRegistrationOpen: boolean;
}

export interface IAdminDashboardResponse {
  overview: IAdminOverviewStats;
  activeSemester: IAdminActiveSemester | null;
  recentActivity: {
    recentEnrollments: unknown[];
    recentPayments: unknown[];
  };
}
