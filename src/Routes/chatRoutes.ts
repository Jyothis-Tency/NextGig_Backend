import { Router } from "express";
import ChatController from "../Controllers/chatController";
import ChatServices from "../Services/chatServices";
import ChatRepository from "../Repository/chatRepository";
import ChatModel from "../Models/chatModel";
import UserModel from "../Models/userModel";
import CompanyModel from "../Models/companyModel";

const chatRoutes = Router();

const chatRepository = new ChatRepository(ChatModel, UserModel, CompanyModel);
const chatService = new ChatServices(chatRepository);
const chatController = new ChatController(chatService);

chatRoutes
  .get("/user-history", chatController.fetchUserChatHistory)
  .get("/company-history", chatController.fetchCompanyChatHistory)
  .post("/send", chatController.sendMessage)
  .post("/create", chatController.createChat);

export default chatRoutes;
