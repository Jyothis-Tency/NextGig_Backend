import { Request, Response, NextFunction } from "express";
import {
  IJobPost,
  ICompany,
  IJobApplication,
} from "../Interfaces/common_interface";
import { ICompanyServices } from "../Interfaces/company_service_interface";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { log } from "console";

class CompanyController {
  private companyService: ICompanyServices;
  constructor(companyService: ICompanyServices) {
    this.companyService = companyService;
  }

  registerUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyData: ICompany = req.body;
      const certificate = req.file;
      await this.companyService.registerCompany(companyData, certificate);
      res.status(HttpStatusCode.OK).send("OTP send to mail successfully");
    } catch (error) {
      next(error);
    }
  };

  otpVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { receivedOTP, email } = req.body;

      await this.companyService.otpVerification(email, receivedOTP);
      res.status(HttpStatusCode.OK).json({ message: "verified" });
    } catch (error) {
      next(error);
    }
  };

  resentOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;
      await this.companyService.resentOtp(email);
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "OTP resend successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  loginUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const serviceResponse = await this.companyService.loginCompany(
        email,
        password
      );
      res.cookie("RefreshToken", serviceResponse.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      res.cookie("AccessToken", serviceResponse.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
        path: "/",
      });
      res
        .status(HttpStatusCode.OK)
        .json({ status: true, userData: serviceResponse.companyData });
    } catch (error) {
      next(error);
    }
  };

  forgotPasswordEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await this.companyService.forgotPasswordEmail(email);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  forgotPasswordOTP = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, otp } = req.body;
      const result = await this.companyService.forgotPasswordOTP(email, otp);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  forgotPasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const serviceResponse = await this.companyService.forgotPasswordReset(
        email,
        password
      );
      if (serviceResponse) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  getCompanyDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const company_id = req.params.company_id;
      const { companyProfile, imgBuffer } =
        await this.companyService.getCompanyDetails(company_id);
      let imageBase64 = "";
      if (imgBuffer) {
        imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
      }
      res.status(HttpStatusCode.OK).json({
        status: true,
        companyProfile,
        image: imageBase64,
      });
    } catch (error) {
      next(error);
    }
  };

  editCompanyDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const company_id = req.params.company_id;
      const companyData = req.body;
      const result = await this.companyService.editCompanyDetails(
        company_id,
        companyData
      );
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  createOrUpdateJobPost = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const jobPostData = req.body;
      const result = await this.companyService.createOrUpdateJobPost(
        jobPostData
      );
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  jobPostsByCompany = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const company_id = req.params.company_id;
      const result = await this.companyService.jobPostsByCompanyId(company_id);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true, jobPosts: result });
      }
    } catch (error) {
      next(error);
    }
  };

  getJobPostByJobId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const _id = req.params.job_id;
      const result = await this.companyService.getJobPostByJobId(_id);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true, jobPost: result });
      }
    } catch (error) {
      next(error);
    }
  };

  deleteJobPostById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const _id = req.params.job_id;
      const result = await this.companyService.deleteJobPostById(_id);
      if (result) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  getJobApplicationsByCompanyId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const _id = req.params.company_id;
      const result = await this.companyService.getJobApplicationsByCompanyId(
        _id
      );
      if (result) {
        res
          .status(HttpStatusCode.OK)
          .json({ status: true, jobApplications: result });
      }
    } catch (error) {
      next(error);
    }
  };

  updateProfileImgController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const company_id = req.params.company_id;
      const img = req.file;
      const image = await this.companyService.updateProfileImg(company_id, img);
      if (image) {
        res.status(HttpStatusCode.OK).json({ status: true });
      }
    } catch (error) {
      next(error);
    }
  };

  getJobApplicationsByJobId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const jobId = req.params.jobId;
      const jobApplications =
        await this.companyService.getJobApplicationsByJobId(jobId);
      res.status(HttpStatusCode.OK).json({ status: true, jobApplications });
    } catch (error) {
      next(error);
    }
  };

  updateApplicationStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const { status, statusMessage } = req.body;
      await this.companyService.updateApplicationStatus(
        applicationId,
        status,
        statusMessage
      );
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: "Application status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getJobApplicationById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const application = await this.companyService.getJobApplicationById(
        applicationId
      );
      if (!application) {
        res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Application not found" });
      }
      res.status(HttpStatusCode.OK).json({ status: true, application });
    } catch (error) {
      next(error);
    }
  };

  searchUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query;
      const users = await this.companyService.searchUser(query as string);
      res.status(HttpStatusCode.OK).json(users);
    } catch (error) {
      next(error);
    }
  };

  setInterviewDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const { interviewStatus, dateTime, message } = req.body;
      const interviewDetails = { interviewStatus, dateTime, message };
      await this.companyService.setInterviewDetails(
        applicationId,
        interviewDetails
      );
      res.status(HttpStatusCode.OK).json({
        status: true,
        message: "Interview details updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  getAllUserProfileImages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userImages = await this.companyService.getAllUserProfileImages();
      res.status(HttpStatusCode.OK).json(userImages);
    } catch (error) {
      next(error);
    }
  };

  getUserProfileController = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_id = req.params.user_id;
      const { userProfile, imgBuffer } =
        await this.companyService.getUserProfile(user_id);
      let imageBase64 = "";
      if (imgBuffer) {
        imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
      }
      res.status(HttpStatusCode.OK).json({
        status: true,
        userProfile,
        image: imageBase64,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default CompanyController;
