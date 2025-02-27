import {
  ICleanCompanyData,
  ICompany,
  IJobPost,
  IJobApplication,
  IUser,
} from "./common_interface";

export interface ICompanyServices {
  registerCompany(
    companyData: ICompany,
    certificate?: Express.Multer.File
  ): Promise<boolean>;
  otpVerification(email: string, receivedOTP: string): Promise<boolean>;
  resentOtp(email: string): Promise<boolean>;
  loginCompany(
    email: string,
    password: string
  ): Promise<{
    companyData: ICleanCompanyData;
    accessToken: string;
    refreshToken: string;
  }>;
  forgotPasswordEmail(email: string): Promise<boolean>;
  forgotPasswordOTP(email: string, receivedOTP: string): Promise<boolean>;
  forgotPasswordReset(email: string, password: string): Promise<boolean>;
  getCompanyDetails(
    company_id: string
  ): Promise<{ companyProfile: ICompany; imgBuffer: Buffer | null }>;
  editCompanyDetails(
    company_id: string,
    companyData: Partial<ICompany>
  ): Promise<boolean>;
  createOrUpdateJobPost(jobPostData: IJobPost): Promise<boolean>;
  jobPostsByCompanyId(company_id: string): Promise<IJobPost[]>;
  getJobPostByJobId(_id: string): Promise<IJobPost | null>;
  deleteJobPostById(_id: string): Promise<boolean>;
  getJobApplicationsByCompanyId(company_id: string): Promise<IJobApplication[]>;
  updateProfileImg(
    company_id: string,
    image?: Express.Multer.File
  ): Promise<boolean>;
  getJobApplicationsByJobId(jobId: string): Promise<IJobApplication[]>;
  updateApplicationStatus(
    applicationId: string,
    status: string,
    statusMessage: string,
    offerLetter?: Express.Multer.File
  ): Promise<boolean>;
  getJobApplicationById(applicationId: string): Promise<IJobApplication | null>;

  searchUser(query: string): Promise<IUser[]>;
  setInterviewDetails(
    applicationId: string,
    interviewDetails: { interviewStatus: string; dateTime: Date }
  ): Promise<boolean>;
  getAllUserProfileImages(): Promise<
    {
      user_id: string;
      profileImage: string;
    }[]
  >;
  getUserProfile(
    user_id: string
  ): Promise<{ userProfile: IUser; imgBuffer: Buffer | null }>;
}
