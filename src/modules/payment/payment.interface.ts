export interface ICreateCheckoutSessionPayload {
  tuitionFeeId: string;
}

export interface IPaymentFilterParams {
  status?: string;
  studentId?: string;
}

export interface ICheckoutSessionResult {
  paymentId: string;
  sessionId: string;
  checkoutUrl: string | null;
}
