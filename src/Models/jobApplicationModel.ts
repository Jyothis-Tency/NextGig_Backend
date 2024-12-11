import mongoose, { Schema } from "mongoose";
import { IJobApplication } from "../Interfaces/common_interface";

const jobApplication = new Schema<IJobApplication>(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    seeker_id: {
      type: String,
      ref: "Seeker",
      required: true,
    },
    company_id: {
      type: String,
      ref: "Company",
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    resume: {
      type: String, // URL to the resume file
    },
    coverLetter: {
      type: String, // Optional cover letter text
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Viewed", "Shortlisted", "Rejected", "Hired"],
      default: "Pending",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const JobApplication = mongoose.model<IJobApplication>(
  "JobApplication",
  jobApplication
);

export default JobApplication;