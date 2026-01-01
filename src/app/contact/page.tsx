"use client";

import React, { useState } from "react";

// Mark as dynamic to prevent static generation timeout
export const dynamic = 'force-dynamic';

function Page() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [feedback, setFeedback] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    // Validate message length client-side
    if (formData.message.trim().length < 10) {
      setStatus("error");
      setFeedback("❌ Message is too short. Please add at least 10 characters.");
      return;
    }

    try {
      // Send to /api/contact endpoint (Jan 1 2026)
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        }),
      });

      let result: any = null;
      const ct = response.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        try {
          result = await response.json();
        } catch (_e) {
          // ignore parse errors; we'll handle via status below
        }
      }

      if (response.ok && (result?.success ?? true)) {
        setStatus("success");
        setFeedback("✅ Message sent! Check your email for confirmation.");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
        const msg =
          result?.error ||
          (await response.text()).slice(0, 300) ||
          "❌ Failed to send. Please try again.";
        setFeedback(msg);
      }
    } catch (error) {
      console.error("Contact form error", error);
      setStatus("error");
      setFeedback("❌ Failed to send. Please try again.");
    }
  };

  return (
    <section>
      <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
        <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-center text-zinc-200">
          Contact Me
        </h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label
              htmlFor="fullName"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="name"
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light"
              placeholder="Your full name"
              value={formData.name}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="message"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
            >
              Your message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              minLength={10}
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg shadow-sm border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="Leave a comment..."
              value={formData.message}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, message: event.target.value }))
              }
              required
            ></textarea>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "loading"}
              className="py-3 px-5 text-sm font-medium text-center text-white rounded-lg bg-primary-700 sm:w-fit hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending..." : "Send message"}
            </button>
            {feedback && (
              <p className="text-sm text-zinc-300">{feedback}</p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

export default Page;
