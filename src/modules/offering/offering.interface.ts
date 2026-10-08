export interface ICreateOfferingPayload {
  courseId: string;
  semesterId: string;
  initialSections?: Array<{
    sectionNumber: number;
    capacity: number;
    roomNumber?: string;
    schedule?: string;
    facultyId?: string;
  }>;
}

export interface ICreateSectionPayload {
  sectionNumber: number;
  capacity: number;
  roomNumber?: string;
  schedule?: string;
  facultyId?: string;
}

export interface IUpdateSectionPayload {
  capacity?: number;
  roomNumber?: string;
  schedule?: string;
  facultyId?: string | null;
}

export interface IOfferingFilterParams {
  semesterId?: string;
  courseId?: string;
  facultyId?: string;
  search?: string;
}
