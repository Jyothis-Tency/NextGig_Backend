import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import {
  ICleanUserData,
  IUser,
  IJobPost,
  ICompany,
  IJobApplication,
  RazorpayOrder,
  RazorpayOrderReceipt,
  ISubscriptionDetails,
} from "../Interfaces/common_interface";
import { IUserRepository } from "../Interfaces/user_repository_interface";
import { ICompanyRepository } from "../Interfaces/company_repository_interface";
import { IUserServices } from "../Interfaces/user_service_interface";
import redisClient from "../Utils/redisUtils";
import otpSender from "../Utils/otpUtils";
import { createToken, createRefreshToken } from "../Config/jwtConfig";
import FileService from "../Utils/fileUploadUtils";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import Razorpay from "razorpay";
import razorpayInstance from "../Config/razorpayConfig";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { Server } from "socket.io";

class UserServices implements IUserServices {
  private userRepository: IUserRepository;
  private companyRepository: ICompanyRepository;
  private userData: IUser | null = null;
  private jobPosts: IJobPost | null = null;
  private OTP: string | null = null;
  private OTP_expiringTime: Date | null = null;
  private fileService: FileService;
  private io: Server;

  constructor(
    userRepository: IUserRepository,
    companyRepository: ICompanyRepository,
    io: Server
  ) {
    this.userRepository = userRepository;
    this.companyRepository = companyRepository;
    this.fileService = new FileService();
    this.io = io;
  }

  loginUser = async (
    email: string,
    password: string
  ): Promise<{
    userData: ICleanUserData;
    accessToken: string;
    refreshToken: string;
  }> => {
    try {
      let user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new CustomError("Email not found", HttpStatusCode.NOT_FOUND);
      }
      if (user.isBlocked) {
        throw new CustomError(
          "User is blocked by admin",
          HttpStatusCode.FORBIDDEN
        );
      }

      const comparedPassword = await bcrypt.compare(
        password,
        user.password as string
      );
      if (!comparedPassword) {
        throw new CustomError("Invalid password", HttpStatusCode.UNAUTHORIZED);
      }

      const accessToken = createToken(user.user_id, "user");
      const refreshToken = createRefreshToken(user.user_id, "user");
      const userData = {
        user_id: user?.user_id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        phone: user?.phone,
        isBlocked: user?.isBlocked,
      };

      return { userData, accessToken, refreshToken };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in login: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  registerUser = async (userData: IUser): Promise<boolean> => {
    try {
      const alreadyExists = await this.userRepository.findByEmail(
        userData.email
      );
      if (alreadyExists) {
        throw new CustomError("Email already exists", HttpStatusCode.CONFLICT);
      }

      await redisClient.setEx(
        `${userData.email}:data`,
        300,
        JSON.stringify(userData)
      );
      this.userData = userData;
      const otpSended = await otpSender(userData.email);
      if (!otpSended) {
        throw new CustomError("Failed to send OTP", HttpStatusCode.BAD_REQUEST);
      }
      return true;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user registration: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  otpVerification = async (
    email: string,
    receivedOTP: string
  ): Promise<boolean> => {
    try {
      const getOTP = await redisClient.get(`${email}:otp`);
      const getData = await redisClient.get(`${email}:data`);
      const userData: IUser | null = getData ? JSON.parse(getData) : null;

      if (!getOTP) {
        throw new CustomError(
          "OTP expired or doesn't exist",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (getOTP !== receivedOTP) {
        throw new CustomError("Incorrect OTP", HttpStatusCode.BAD_REQUEST);
      }
      if (!userData) {
        throw new CustomError("User data not found", HttpStatusCode.NOT_FOUND);
      }

      const hashedPassword = await bcrypt.hash(userData.password as string, 10);
      userData.password = hashedPassword;
      const uuidCode = uuidv4();
      const hash = crypto.createHash("sha256").update(uuidCode).digest("hex");
      const objectIdHex = hash.substring(0, 24);
      const obId = new ObjectId(objectIdHex);
      userData.user_id = obId;

      const registeredUser = await this.userRepository.register(userData);
      if (!registeredUser) {
        throw new CustomError(
          "Failed to register user",
          HttpStatusCode.BAD_REQUEST
        );
      }

      await redisClient.del(`${email}:data`);
      await redisClient.del(`${email}:otp`);
      return true;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in OTP verification: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  resentOtp = async (email: string): Promise<boolean> => {
    try {
      await redisClient.del(email);
      const otpSended = await otpSender(email);
      if (!otpSended) {
        throw new CustomError(
          "Failed to resend OTP",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return true;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in resending OTP: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  forgotPasswordEmail = async (email: string): Promise<boolean> => {
    try {
      let userData = await this.userRepository.findByEmail(email);
      if (!userData) {
        throw new CustomError("Email not found", HttpStatusCode.NOT_FOUND);
      }

      const otpSended = await otpSender(userData.email);
      if (!otpSended) {
        throw new CustomError("Failed to send OTP", HttpStatusCode.BAD_REQUEST);
      }
      return true;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in forgot password email: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  forgotPasswordOTP = async (
    email: string,
    receivedOTP: string
  ): Promise<Boolean> => {
    try {
      const getOTP = await redisClient.get(email);
      if (!getOTP) {
        throw new CustomError(
          "OTP expired or doesn't exist",
          HttpStatusCode.BAD_REQUEST
        );
      }
      if (getOTP !== receivedOTP) {
        throw new CustomError("Incorrect OTP", HttpStatusCode.BAD_REQUEST);
      }
      await redisClient.del(email);
      return true;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in forgot password OTP verification: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  forgotPasswordReset = async (
    email: string,
    password: string
  ): Promise<Boolean> => {
    try {
      const hashedPassword = await bcrypt.hash(password as string, 10);
      const updatedUserData = await this.userRepository.updatePassword(
        email,
        hashedPassword
      );

      if (!updatedUserData) {
        throw new CustomError(
          "Failed to update password",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return true;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in password reset: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllJobPosts = async (): Promise<{
    jobPosts: IJobPost[];
    companies: ICompany[];
  }> => {
    try {
      const jobPosts = await this.companyRepository.getAllJobs();
      if (!jobPosts || jobPosts.length === 0) {
        throw new CustomError("No job posts found", HttpStatusCode.NOT_FOUND);
      }

      const companyIds = Array.from(
        new Set(jobPosts.map((job) => job.company_id))
      );
      const companies = await this.userRepository.getAllCompaniesByIds(
        companyIds
      );
      if (!companies || companies.length === 0) {
        throw new CustomError("No companies found", HttpStatusCode.NOT_FOUND);
      }

      return { jobPosts, companies };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error fetching job posts: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getUserProfile = async (user_id: string): Promise<any> => {
    try {
      const userProfile = await this.userRepository.getUserById(user_id);
      if (!userProfile) {
        throw new CustomError("User not found", HttpStatusCode.NOT_FOUND);
      }

      let imgBuffer = null;
      if (userProfile.profileImage) {
        imgBuffer = await this.fileService.getFile(userProfile.profileImage);
      }
      return { userProfile, imgBuffer };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error fetching user profile: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  editUserDetailsService = async (
    user_id: string,
    userData: Partial<IUser>
  ): Promise<boolean> => {
    try {
      const result = await this.userRepository.putUserById(user_id, userData);
      if (!result) {
        throw new CustomError(
          "Failed to update user details",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return true;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error updating user details: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  newJobApplication = async (
    applicationData: IJobApplication,
    resumeFile: any
  ): Promise<IJobApplication> => {
    try {
      const resumeUrl = await this.fileService.uploadFile(resumeFile);
      if (!resumeUrl) {
        throw new CustomError(
          "Failed to upload resume",
          HttpStatusCode.BAD_REQUEST
        );
      }

      applicationData.resume = resumeUrl;
      const result = await this.userRepository.postJobApplication(
        applicationData
      );
      if (!result) {
        throw new CustomError(
          "Failed to save job application",
          HttpStatusCode.BAD_REQUEST
        );
      }

      this.io.emit("jobApplicationSubmitted", {
        message: "You have received new job application",
        applicationData: result,
      });

      return result;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in job application: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updateProfileImg = async (user_id: string, image: any): Promise<boolean> => {
    try {
      const resumeUrl = await this.fileService.uploadFile(image);
      if (!resumeUrl) {
        throw new CustomError(
          "Failed to upload image",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const result = await this.userRepository.postProfileImg(
        user_id,
        resumeUrl
      );
      if (!result) {
        throw new CustomError(
          "Failed to update profile image",
          HttpStatusCode.BAD_REQUEST
        );
      }
      return result;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in profile image update: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createOrder = async (
    planId: string,
    userId: string
  ): Promise<RazorpayOrder> => {
    try {
      const plan = await this.userRepository.getSubscriptionPlanById(planId);
      if (!plan) {
        throw new CustomError(
          "Subscription plan not found",
          HttpStatusCode.NOT_FOUND
        );
      }

      const order = await razorpayInstance.orders.create({
        amount: plan.price * 100,
        currency: "INR",
        receipt: `rec_${userId.slice(-6)}_${planId.slice(
          -6
        )}_${Date.now()}` as RazorpayOrderReceipt["receipt_id"],
      });

      return {
        id: order.id,
        entity: order.entity,
        amount: order.amount,
        amount_paid: order.amount_paid,
        amount_due: order.amount_due,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        attempts: order.attempts,
        created_at: order.created_at,
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error creating order: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  verifyPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    userId: string,
    planId: string
  ): Promise<ISubscriptionDetails> => {
    try {
      console.log("verifyPayment");
      
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        throw new CustomError(
          "Invalid payment signature",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const plan = await this.userRepository.getSubscriptionPlanById(planId);
      if (!plan) {
        throw new CustomError(
          "Subscription plan not found",
          HttpStatusCode.NOT_FOUND
        );
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.duration);

      const deactivateResult =
        await this.userRepository.deactivateUserSubscriptions(userId);
      // if (!deactivateResult.modifiedCount) {
      //   throw new CustomError(
      //     "Failed to deactivate existing subscriptions",
      //     HttpStatusCode.BAD_REQUEST
      //   );
      // }

      const subscriptionDetails: ISubscriptionDetails = {
        user_id: new ObjectId(userId),
        plan_id: new ObjectId(planId),
        planName: plan.name,
        startDate,
        endDate,
        price: plan.price,
        features: plan.features,
        paymentId: razorpayPaymentId,
        status: "active",
        isCurrent: true,
        createdAt: new Date(),
      };

      const createNewSubscription =
        await this.userRepository.createSubscription(subscriptionDetails);
      if (!createNewSubscription) {
        throw new CustomError(
          "Failed to create subscription",
          HttpStatusCode.BAD_REQUEST
        );
      }

      return createNewSubscription;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error verifying payment: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getSubscriptionHistory = async (
    user_id: string
  ): Promise<ISubscriptionDetails[]> => {
    try {
      const result = await this.userRepository.getSubscriptionHistory(user_id);
      if (!result || result.length === 0) {
        throw new CustomError(
          "No subscription history found",
          HttpStatusCode.NOT_FOUND
        );
      }
      return result;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error fetching subscription history: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getCurrentSubscriptionDetail = async (
    user_id: string
  ): Promise<ISubscriptionDetails | null> => {
    try {
      const result = await this.userRepository.getCurrentSubscriptionDetails(
        user_id
      );
      if (!result) {
        throw new CustomError(
          "No active subscription found",
          HttpStatusCode.NOT_FOUND
        );
      }
      return result;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error fetching current subscription: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getJobApplicationsByUserId = async (
    user_id: string
  ): Promise<IJobApplication[]> => {
    try {
      const applications = await this.userRepository.getJobApplicationsByUserId(
        user_id
      );
      console.log(applications);
      // if (!applications || applications.length === 0) {
      //   throw new CustomError(
      //     "No job applications found for this user",
      //     HttpStatusCode.NOT_FOUND
      //   );
      // }
      return applications;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error fetching job applications: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default UserServices;
