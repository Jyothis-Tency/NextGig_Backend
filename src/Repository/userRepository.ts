import { Model, UpdateResult } from "mongoose";
import { IUserRepository } from "../Interfaces/user_repository_interface";
import {
  IUser,
  IJobPost,
  ICompany,
  IJobApplication,
  ISubscriptionDetails,
  ISubscriptionPlan,
  ISubscriptionHistory,
} from "../Interfaces/common_interface";
import { ObjectId } from "mongodb";
import { Types } from "mongoose";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";

class UserRepository implements IUserRepository {
  private user = Model<IUser>;
  private company = Model<ICompany>;
  private jobApplication = Model<IJobApplication>;
  private subscriptionDetails = Model<ISubscriptionDetails>;
  private subscriptionPlan = Model<ISubscriptionPlan>;
  private jobPost = Model<IJobPost>;
  private subscriptionHistory = Model<ISubscriptionHistory>;

  constructor(
    user: Model<IUser>,
    company: Model<ICompany>,
    jobApplication: Model<IJobApplication>,
    subscriptionDetails: Model<ISubscriptionDetails>,
    subscriptionPlan: Model<ISubscriptionPlan>,
    jobPost: Model<IJobPost>,
    subscriptionHistory: Model<ISubscriptionHistory>
  ) {
    this.user = user;
    this.company = company;
    this.jobApplication = jobApplication;
    this.subscriptionDetails = subscriptionDetails;
    this.subscriptionPlan = subscriptionPlan;
    this.jobPost = jobPost;
    this.subscriptionHistory = subscriptionHistory;
  }

  findByEmail = async (email: string): Promise<IUser | null> => {
    try {
      const user = await this.user.findOne({ email });
      return user;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user findBYEmail: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  findByGoogleId = async (googleId: string): Promise<IUser | null> => {
    try {
      const user = await this.user.findOne({ googleId });
      return user;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user findByGoogleId: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  // login = async (email: string): Promise<IUser> => {
  //   try {
  //     const userDetails = await this.userModel.aggregate([
  //       { $match: { email: email } },
  //     ]);
  //     return userDetails[0];
  //   } catch (error) {
  //     console.log(`Error in login at userRepository : ${error}`);
  //     throw error;
  //   }
  // };

  register = async (userData: Partial<IUser>): Promise<IUser> => {
    try {
      const newUser = await this.user.create(userData);
      return newUser;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user register: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updatePassword = async (
    email: string,
    password: string
  ): Promise<IUser | null> => {
    try {
      const updatedUser = await this.user.findOneAndUpdate(
        { email },
        { $set: { password: password } },
        { new: true }
      );
      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user updatePassword: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getUserById = async (user_id: string): Promise<IUser | null> => {
    try {
      const user = (await this.user
        .findOne({ user_id: user_id })
        .lean()) as IUser | null;
      return user;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getUserById: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  putUserById = async (
    user_id: string,
    userData: Partial<IUser>
  ): Promise<IUser> => {
    try {
      const updatedUser = await this.user.findOneAndUpdate(
        { user_id: user_id },
        { $set: userData },
        { new: true }
      );
      return updatedUser;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user putUserById: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllCompaniesByIds = async (company_id: string[]): Promise<ICompany[]> => {
    try {
      const companies = await this.company.find({
        company_id: { $in: company_id },
      });
      return companies;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getAllCompaniesByIds: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
  postJobApplication = async (
    applicationData: IJobApplication
  ): Promise<IJobApplication> => {
    try {
      const result = await this.jobApplication.create(applicationData);
      await this.jobPost.updateOne(
        { _id: applicationData.job_id },
        { $push: { applicants: applicationData.user_id } }
      );
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user postJobApplication: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  postProfileImg = async (user_id: string, url: string): Promise<boolean> => {
    try {
      const result = await this.user.updateOne(
        { user_id: user_id },
        { $set: { profileImage: url } }
      );
      return result.modifiedCount > 0;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user postProfileImg: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getSubscriptionHistory = async (
    user_id: string
  ): Promise<ISubscriptionDetails[]> => {
    try {
      const subscriptionHistory = await this.subscriptionHistory
        .find({
          user_id: new Types.ObjectId(user_id),
        })
        .sort({ createdAt: -1 });
      return subscriptionHistory;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getSubscriptionHistory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getCurrentSubscriptionDetails = async (
    user_id: string
  ): Promise<ISubscriptionDetails | null> => {
    try {
      const result = await this.subscriptionDetails.findOne({
        user_id: user_id,
        isCurrent: true,
      });
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getCurrentSubscriptionDetails: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getJobApplicationsByUserId = async (
    user_id: string
  ): Promise<IJobApplication[]> => {
    try {
      return await this.jobApplication.find({ user_id: user_id });
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getJobApplicationsByUserId: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  searchByUserName = async (name: string): Promise<IUser[]> => {
    try {
      const result = await this.user.find({
        firstName: { $regex: name, $options: "i" },
      });
      console.log(result);
      return result;
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user searchByUserName: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  getAllUserImages = async (): Promise<String[]> => {
    try {
      const result = await this.user.find({}).select("profileImage");
      return result.map((user) => user.profileImage);
    } catch (error: unknown) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        `Error in user getAllUserImages: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default UserRepository;
