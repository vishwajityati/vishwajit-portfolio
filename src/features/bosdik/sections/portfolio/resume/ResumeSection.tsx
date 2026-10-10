"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, FileText } from "lucide-react";
import { upload } from "@vercel/blob/client";

import type { PortfolioContent } from "@/types";
import { SectionIntro } from "@/features/bosdik/sections/shared/SectionIntro";

import "./ResumeSection.css";

const MAX_RESUME_SIZE = 10 * 1024 * 1024;

export function ResumeSection({
  content,
  onChange,
}: {
  content: PortfolioContent;
  onChange: (content: PortfolioContent) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const handleChooseResume = () => {
    if (uploading) return;

    fileInputRef.current?.click();
  };

  const handleResumeChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadMessage("");

    if (file.type !== "application/pdf") {
      setUploadMessage("Please select a PDF file.");
      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      setUploadMessage("Resume must be 10 MB or smaller.");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("Uploading résumé...");

      const blob = await upload(
        `portfolio/resume/${crypto.randomUUID()}.pdf`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/upload/token",
        },
      );

      onChange({
        ...content,
        resumeUrl: blob.url,
      });

      setUploadMessage(
        "Résumé uploaded. Click Save changes to publish it.",
      );
    } catch (error) {
      console.error("Résumé upload failed:", error);

      setUploadMessage(
        "Résumé upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <SectionIntro
        step="RESUME"
        title="Keep your résumé current."
        description="Upload your résumé as a PDF and use the preview link to check the published file."
      />

      <div className="resume-section">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleResumeChange}
          hidden
        />

        <div className="resume-upload-card">
          <div className="resume-upload-icon">
            <FileText size={20} />
          </div>

          <div className="resume-upload-info">
            <span className="resume-upload-label">
              RESUME PDF
            </span>

            <h3>
              {content.resumeUrl
                ? "Resume Uploaded"
                : "Upload your resume"}
            </h3>

            <p>
              Select a PDF file from your computer. Maximum file size
              is 10 MB.
            </p>

            <span className="resume-upload-format">
              PDF · MAX 10 MB
            </span>
          </div>

          <button
            type="button"
            className="button button-quiet resume-upload-button"
            onClick={handleChooseResume}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Choose PDF"}
          </button>
        </div>

        {uploadMessage && (
          <p className="resume-upload-message">
            {uploadMessage}
          </p>
        )}

        <a
          className="button button-quiet admin-preview-link"
          href={content.resumeUrl || "/resume"}
          target={content.resumeUrl ? "_blank" : undefined}
          rel={content.resumeUrl ? "noreferrer" : undefined}
        >
          <FileText size={15} />
          Preview resume
          <ArrowUpRight size={14} />
        </a>
      </div>
    </>
  );
}
