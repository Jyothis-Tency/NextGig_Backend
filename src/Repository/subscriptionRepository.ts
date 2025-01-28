import { Model } from "mongoose";
import { ISubscriptionRepository } from "../Interfaces/subscription_repository_interface";
import {
  ISubscriptionDetails,
  ISubscriptionPlan,
  ISubscriptionHistory,
} from "../Interfaces/common_interface";
import CustomError from "../Utils/customError";
import HttpStatusCode from "../Enums/httpStatusCodes";
import { UpdateResult } from "mongodb";

class SubscriptionRepository implements ISubscriptionRepository {
  private subscriptionPlan: Model<ISubscriptionPlan>;
  private subscriptionDetails: Model<ISubscriptionDetails>;
  private subscriptionHistory: Model<ISubscriptionHistory>;

  constructor(
    subscriptionPlan: Model<ISubscriptionPlan>,
    subscriptionDetails: Model<ISubscriptionDetails>,
    subscriptionHistory: Model<ISubscriptionHistory>
  ) {
    this.subscriptionPlan = subscriptionPlan;
    this.subscriptionDetails = subscriptionDetails;
    this.subscriptionHistory = subscriptionHistory;
  }

  findSubscriptionPlanById = async (
    planId: string
  ): Promise<ISubscriptionPlan | null> => {
    try {
      return await this.subscriptionPlan.findById(planId);
    } catch (error) {
      throw new CustomError(
        "Error fetching subscription plan by ID",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createSubscriptionDetails = async (
    details: ISubscriptionDetails
  ): Promise<ISubscriptionDetails> => {
    try {
      return await this.subscriptionDetails.create(details);
    } catch (error: any) {
      throw new CustomError(
        "Error creating subscription details",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  updateSubscriptionStatus = async (
    matchCriteria: Record<string, any>,
    updateValues: Record<string, any>
  ): Promise<UpdateResult> => {
    try {
      return await this.subscriptionDetails.updateMany(
        matchCriteria,
        updateValues,
        { upsert: false } // This is to prevent creating a new document if it doesn't exist
      );
    } catch (error) {
      throw new CustomError(
        "Error updating subscription status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  createSubscriptionHistory = async (
    details: ISubscriptionHistory
  ): Promise<ISubscriptionHistory> => {
    try {
      const historyDetails = {
        user_id: details.user_id,
        plan_id: details.plan_id,
        planName: details.planName,
        createdType: details.createdType,
        period: details.period,
        startDate: details.startDate,
        endDate: details.endDate,
        price: details.price,
      };
      return await this.subscriptionHistory.create(historyDetails);
    } catch (error) {
      throw new CustomError(
        "Error creating subscription history",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  findSubscription = async (
    subscriptionId: string
  ): Promise<ISubscriptionDetails | null> => {
    try {
      return await this.subscriptionDetails.findOne({
        subscriptionId: subscriptionId,
      });
    } catch (error) {
      throw new CustomError(
        "Error fetching current subscription by user ID",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  findAllSubscriptions = async (): Promise<ISubscriptionDetails[]> => {
    try {
      return await this.subscriptionDetails.find();
    } catch (error) {
      throw new CustomError(
        "Error fetching all subscriptions",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };

  toggleSubscriptionPlanBlock = async (
    plan_id: string,
    isBlocked: boolean
  ): Promise<boolean> => {
    try {
      await this.subscriptionPlan.updateOne(
        { _id: plan_id },
        { $set: { isBlocked } }
      );
      return true;
    } catch (error) {
      throw new CustomError(
        "Error fetching chat history",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export default SubscriptionRepository;
