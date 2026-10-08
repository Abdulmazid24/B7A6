export interface ICreateCoursePayload {
  code: string;
  title: string;
  credits: number;
  description?: string;
  departmentId: string;
  prerequisiteIds?: string[];
}

export interface IUpdateCoursePayload {
  code?: string;
  title?: string;
  credits?: number;
  description?: string;
  departmentId?: string;
  prerequisiteIds?: string[];
}

export interface ICourseFilterParams {
  departmentId?: string;
  search?: string;
}
