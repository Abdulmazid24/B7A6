export interface ICreateSemesterPayload {
  name: string;
  code: string;
  year: number;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  isRegistrationOpen?: boolean;
}

export interface IUpdateSemesterPayload {
  name?: string;
  code?: string;
  year?: number;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  isRegistrationOpen?: boolean;
}

export interface ISemesterFilterParams {
  isCurrent?: boolean;
  year?: number;
  search?: string;
}
