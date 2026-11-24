"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useLanguage } from "@/components/LanguageContext";
import { Star, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";

export default function CustomerFeedback({
  params,
}: {
  params: { entryId: string };
}) {
  const { entryId } = params;
  const { t } = useLanguage();

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/queue/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);
      localStorage.removeItem("active_token_id");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error submitting feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Header />

      <main className="flex-1 max-w-md sm:max-w-lg w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col justify-between">
        <div className="space-y-6">
          {submitted ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#E4E1DC] shadow-sm text-center space-y-4 my-6">
              <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 text-[#2D6A1F] mx-auto" />
              <h2 className="text-xl sm:text-2xl font-bold text-primary">
                {t("thank_you")}
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                {t("feedback_recorded")}
              </p>
              <div className="pt-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-[#182e4c] text-white font-bold py-3 px-6 rounded-xl text-sm"
                >
                  <span>{t("back_to_home")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#E4E1DC] shadow-sm space-y-5">
              <div className="text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-primary">
                  {t("rate_experience")}
                </h1>
                <p className="text-xs sm:text-sm text-muted mt-1">
                  {t("rate_subtitle")}
                </p>
              </div>

              {errorMsg && (
                <div className="bg-[#F4CCCC] border border-[#8B1A1A]/30 p-3 rounded-xl flex items-center gap-2 text-sm text-[#8B1A1A]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1-5 Star Interactive Selector */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 sm:p-1.5 transition-transform hover:scale-110 active:scale-95 focus:outline-none min-w-[36px] min-h-[36px] flex items-center justify-center"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        className={`w-8 h-8 sm:w-10 sm:h-10 ${
                          star <= rating
                            ? "text-accent fill-accent"
                            : "text-[#E4E1DC] stroke-[1.5]"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="text-center font-bold text-base text-primary">
                  {rating === 5 && t("rating_5")}
                  {rating === 4 && t("rating_4")}
                  {rating === 3 && t("rating_3")}
                  {rating === 2 && t("rating_2")}
                  {rating === 1 && t("rating_1")}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    {t("optional_comments")}
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t("comments_placeholder")}
                    className="w-full bg-[#FAF8F5] border border-[#E4E1DC] focus:border-primary rounded-xl p-3 text-sm text-[#1B1B1F] outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[48px] bg-primary hover:bg-[#182e4c] text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-base shadow-sm transition-all active:scale-[0.98]"
                >
                  <span>{loading ? "Submitting..." : t("submit_feedback")}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
