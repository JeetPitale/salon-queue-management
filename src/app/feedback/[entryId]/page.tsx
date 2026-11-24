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

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 flex flex-col justify-between">
        <div className="space-y-6">
          {submitted ? (
            <div className="bg-white rounded-2xl p-8 border border-[#E4E1DC] shadow-sm text-center space-y-4 my-8">
              <CheckCircle className="w-16 h-16 text-[#2D6A1F] mx-auto" />
              <h2 className="text-2xl font-bold text-primary">
                {t("thank_you")}
              </h2>
              <p className="text-sm text-muted">
                {t("feedback_recorded")}
              </p>
              <div className="pt-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-[#182e4c] text-white font-bold py-3 px-6 rounded-xl text-sm"
                >
                  <span>Back to Home</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-[#E4E1DC] shadow-sm space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-primary">
                  {t("rate_experience")}
                </h1>
                <p className="text-sm text-muted mt-1">
                  How was your service with us today?
                </p>
              </div>

              {errorMsg && (
                <div className="bg-[#F4CCCC] border border-[#8B1A1A]/30 p-3 rounded-xl flex items-center gap-2 text-sm text-[#8B1A1A]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1-5 Star Interactive Selector */}
                <div className="flex items-center justify-center gap-3 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1.5 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= rating
                            ? "text-accent fill-accent"
                            : "text-[#E4E1DC] stroke-[1.5]"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="text-center font-bold text-base text-primary">
                  {rating === 5 && "Excellent! ⭐⭐⭐⭐⭐"}
                  {rating === 4 && "Very Good! ⭐⭐⭐⭐"}
                  {rating === 3 && "Good ⭐⭐⭐"}
                  {rating === 2 && "Fair ⭐⭐"}
                  {rating === 1 && "Poor ⭐"}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Optional Comments
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked or how we can improve..."
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
