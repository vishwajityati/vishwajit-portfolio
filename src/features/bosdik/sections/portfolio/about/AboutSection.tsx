"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

import type { PortfolioContent } from "@/types";
import { BosdikTextList } from "@/features/bosdik/sections/shared/BosdikTextList";
import { SectionIntro } from "@/features/bosdik/sections/shared/SectionIntro";

import "./AboutSection.css";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export function AboutSection({
  content,
  onChange,
}: {
  content: PortfolioContent;
  onChange: (content: PortfolioContent) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const handleChoosePhoto = () => {
    if (uploading) return;

    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setUploadMessage("");

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setUploadMessage(
        "Please select a JPG, PNG, WEBP, or AVIF image.",
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadMessage("Profile photo must be 5 MB or smaller.");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("Uploading photo...");

      const extension =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const pathname = `portfolio/photo/${crypto.randomUUID()}.${extension}`;

      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload/token",
      });

      onChange({
        ...content,
        photoUrl: blob.url,
      });

      setUploadMessage(
        "Photo uploaded. Click Save changes to publish it.",
      );
    } catch (error) {
      console.error("Profile photo upload failed:", error);

      setUploadMessage(
        "Photo upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <SectionIntro
        step="02 / ABOUT"
        title="Tell your story."
        description="Add short paragraphs about your background, interests, and what you enjoy building."
      />

      <div className="about-section">
        <section className="about-photo-card">
          <div className="about-photo-header">
            <div>
              <span className="about-photo-label">
                PROFILE PHOTO
              </span>

              <h3>About section image</h3>

              <p>
                This image will be displayed in the About section of
                your public portfolio.
              </p>
            </div>

            {content.photoUrl && (
              <span className="about-photo-status">
                PHOTO SET
              </span>
            )}
          </div>

          <div className="about-photo-content">
            <div className="about-photo-preview">
              {content.photoUrl ? (
                <img
                  src={content.photoUrl}
                  alt="Current profile"
                />
              ) : (
                <span>NO PHOTO</span>
              )}
            </div>

            <div className="about-photo-info">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handlePhotoChange}
                hidden
              />

              <button
                type="button"
                className="about-photo-button"
                onClick={handleChoosePhoto}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Choose photo"}
              </button>

              <p className="about-photo-note">
                {uploadMessage ||
                  "Choose a profile photo from your computer."}
              </p>

              <span className="about-photo-placeholder">
                JPG, PNG, WEBP or AVIF · Max 5 MB
              </span>
            </div>
          </div>
        </section>

        <BosdikTextList
          title="About paragraphs"
          items={content.about}
          addLabel="Add paragraph"
          placeholder="Write a paragraph about yourself"
          onChange={(about) => onChange({ ...content, about })}
          multiline
        />
      </div>
    </>
  );
}
