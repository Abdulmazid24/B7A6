export interface ICreateDepartmentPayload {
  code: string;
  name: string;
  description?: string;
}

export interface IUpdateDepartmentPayload {
  code?: string;
  name?: string;
  description?: string;
}

export interface IDepartmentFilterParams {
  search?: string;
}
