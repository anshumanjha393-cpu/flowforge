import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../api/client";

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  const [activeTab, setActiveTab] = useState<"support" | "bug">("support");

  // Support Form State
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);

  // Bug Form State
  const [bugTitle, setBugTitle] = useState("");
  const [bugSteps, setBugSteps] = useState("");
  const [bugSeverity, setBugSeverity] = useState("MEDIUM");
  const [bugDescription, setBugDescription] = useState("");
  const [bugLoading, setBugLoading] = useState(false);

  if (!isOpen) return null;

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all support fields.");
      return;
    }

    setSupportLoading(true);
    try {
      await api.post("/support/ticket", { subject, message });
      toast.success("Support ticket submitted successfully!");
      setSubject("");
      setMessage("");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to submit support ticket.");
    } finally {
      setSupportLoading(false);
    }
  };

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !bugSteps.trim() || !bugDescription.trim()) {
      toast.error("Please fill in all required bug fields.");
      return;
    }

    setBugLoading(true);
    try {
      await api.post("/support/bug", {
        title: bugTitle,
        steps: bugSteps,
        severity: bugSeverity,
        description: bugDescription,
      });
      toast.success("Bug report submitted successfully!");
      setBugTitle("");
      setBugSteps("");
      setBugSeverity("MEDIUM");
      setBugDescription("");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to submit bug report.");
    } finally {
      setBugLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-[#e4e6eb] bg-white p-6 shadow-2xl transition-all dark:border-[#2a2c38] dark:bg-[#15171f]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4e6eb] pb-4 dark:border-[#2a2c38]">
          <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">Help & Support</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#757684] hover:bg-[#f1f5f9] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:bg-[#1e202b] dark:hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex border-b border-[#e4e6eb] dark:border-[#2a2c38]">
          <button
            onClick={() => setActiveTab("support")}
            className={`flex-1 pb-2.5 text-sm font-semibold transition-colors ${
              activeTab === "support"
                ? "border-b-2 border-[#00288e] text-[#00288e] dark:border-[#b8c4ff] dark:text-[#b8c4ff]"
                : "text-[#757684] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:text-white"
            }`}
          >
            Contact Support
          </button>
          <button
            onClick={() => setActiveTab("bug")}
            className={`flex-1 pb-2.5 text-sm font-semibold transition-colors ${
              activeTab === "bug"
                ? "border-b-2 border-[#00288e] text-[#00288e] dark:border-[#b8c4ff] dark:text-[#b8c4ff]"
                : "text-[#757684] hover:text-[#1a1b22] dark:text-[#a8aab8] dark:hover:text-white"
            }`}
          >
            Report a Bug
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-5">
          {activeTab === "support" ? (
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div>
                <label htmlFor="support-subject" className="mb-1.5 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">Subject</label>
                <input
                  id="support-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we help you?"
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 text-sm text-[#1a1b22] placeholder-[#757684] outline-none transition-colors focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/10 dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:placeholder-[#5a5c68] dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div>
                <label htmlFor="support-message" className="mb-1.5 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">Message</label>
                <textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or provide feedback..."
                  rows={4}
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 text-sm text-[#1a1b22] placeholder-[#757684] outline-none transition-colors focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/10 dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:placeholder-[#5a5c68] dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={supportLoading}
                className="w-full rounded-lg bg-[#00288e] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#001e70] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#3b52d9] dark:hover:bg-[#2d42b8]"
              >
                {supportLoading ? "Submitting..." : "Send Message"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleBugSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label htmlFor="bug-title" className="mb-1.5 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">Bug Title</label>
                  <input
                    id="bug-title"
                    type="text"
                    value={bugTitle}
                    onChange={(e) => setBugTitle(e.target.value)}
                    placeholder="Short description of the bug"
                    className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 text-sm text-[#1a1b22] placeholder-[#757684] outline-none transition-colors focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/10 dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:placeholder-[#5a5c68] dark:focus:border-[#b8c4ff]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="bug-severity" className="mb-1.5 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">Severity</label>
                  <select
                    id="bug-severity"
                    value={bugSeverity}
                    onChange={(e) => setBugSeverity(e.target.value)}
                    className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 text-sm text-[#1a1b22] outline-none transition-colors focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/10 dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:focus:border-[#b8c4ff]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="bug-steps" className="mb-1.5 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">Steps to Reproduce</label>
                <textarea
                  id="bug-steps"
                  value={bugSteps}
                  onChange={(e) => setBugSteps(e.target.value)}
                  placeholder="1. Go to page...&#10;2. Click on...&#10;3. See error..."
                  rows={3}
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 text-sm text-[#1a1b22] placeholder-[#757684] outline-none transition-colors focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/10 dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:placeholder-[#5a5c68] dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <div>
                <label htmlFor="bug-desc" className="mb-1.5 block text-xs font-semibold text-[#1a1b22] dark:text-[#f1f0fa]">Actual Behavior & Details</label>
                <textarea
                  id="bug-desc"
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  placeholder="What went wrong? Any error messages?"
                  rows={2}
                  className="w-full rounded-lg border border-[#e4e6eb] bg-white px-3.5 py-2.5 text-sm text-[#1a1b22] placeholder-[#757684] outline-none transition-colors focus:border-[#00288e] focus:ring-2 focus:ring-[#00288e]/10 dark:border-[#2a2c38] dark:bg-[#0f1117] dark:text-white dark:placeholder-[#5a5c68] dark:focus:border-[#b8c4ff]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={bugLoading}
                className="w-full rounded-lg bg-[#00288e] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#001e70] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#3b52d9] dark:hover:bg-[#2d42b8]"
              >
                {bugLoading ? "Submitting..." : "Report Bug"}
              </button>
            </form>
          )}
        </div>

        {/* Footer legal references */}
        <div className="mt-5 border-t border-[#e4e6eb] pt-3 text-center text-[10px] text-[#757684] dark:border-[#2a2c38] dark:text-[#a8aab8]">
          For details, review our{" "}
          <Link to="/privacy" onClick={onClose} className="font-semibold hover:underline">Privacy Policy</Link>
          {" "}and{" "}
          <Link to="/terms" onClick={onClose} className="font-semibold hover:underline">Terms of Service</Link>.
        </div>
      </div>
    </div>
  );
}
