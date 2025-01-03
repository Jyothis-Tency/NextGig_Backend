import {
  ICleanUserData,
  IUser,
  IJobPost,
  ICompany,
  IJobApplication,
  RazorpayOrder,
  ISubscriptionDetails,
} from "./common_interface";

export interface IUserServices {
  registerUser(userData: IUser): Promise<boolean>;
  otpVerification(email: string, receivedOTP: string): Promise<Boolean>;
  resentOtp(email: string): Promise<boolean>;
  loginUser(
    email: string,
    password: string
  ): Promise<{
    userData: ICleanUserData;
    accessToken: string;
    refreshToken: string;
  }>;
  forgotPasswordEmail(email: string): Promise<boolean>;
  forgotPasswordOTP(email: string, receivedOTP: string): Promise<Boolean>;
  forgotPasswordReset(email: string, password: string): Promise<Boolean>;
  getAllJobPosts(): Promise<{ jobPosts: IJobPost[]; companies: ICompany[] }>;
  // getAllJobPostService(): Promise<any>;
  // getAllCompanyService(): Promise<any>;
  getUserProfile(userId: string): Promise<any>;
  editUserDetailsService(
    user_id: string,
    userData: Partial<IUser>
  ): Promise<boolean>;
  newJobApplication(
    applicationData: IJobApplication,
    resumeFile: any
  ): Promise<IJobApplication>;
  updateProfileImg(user_id: string, image: any): Promise<boolean>;
  createOrder(planId: string, userId: string): Promise<RazorpayOrder>;
  verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string,
    planId: string
  ): Promise<ISubscriptionDetails>;
  getSubscriptionHistory(user_id: string): Promise<ISubscriptionDetails[]>;
  getCurrentSubscriptionDetail(
    user_id: string
  ): Promise<ISubscriptionDetails | null>;
  getJobApplicationsByUserId(
    user_id: string
  ): Promise<IJobApplication[]>
}
