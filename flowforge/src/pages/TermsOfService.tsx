import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6fa] text-[#1a1b22] dark:bg-[#0b0d12] dark:text-[#f1f0fa]">
      <header className="border-b border-[#e4e6eb] bg-white px-8 py-6 dark:border-[#2a2c38] dark:bg-[#15171f]">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="font-display text-xl font-bold tracking-tight text-[#00288e] dark:text-[#b8c4ff]">FlowForge</p>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 rounded-lg border border-[#e4e6eb] bg-white px-4 py-2 text-sm font-semibold text-[#1a1b22] transition-colors hover:bg-gray-50 dark:border-[#2a2c38] dark:bg-[#15171f] dark:text-white dark:hover:bg-[#1e202b]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-[#e4e6eb] bg-white p-8 shadow-sm dark:border-[#2a2c38] dark:bg-[#15171f]">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#1a1b22] dark:text-white">Terms of Service</h1>
          <p className="mt-2 text-xs text-[#757684] dark:text-[#a8aab8]">Last updated: June 20, 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#4a4b57] dark:text-[#c5c6d0]">
            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">1. Acceptance of Terms</h2>
              <p className="mt-2">
                By accessing or using the FlowForge workspace planning and collaboration software, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you must refrain from using our services.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">2. User Accounts & Responsibilities</h2>
              <p className="mt-2">
                To access features of FlowForge, you must create a workspace account. You are solely responsible for maintaining the confidentiality of your credentials, ensuring session token integrity, and monitoring any activities performed under your profile.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">3. Acceptable Use Policy</h2>
              <p className="mt-2">
                You agree not to abuse the system resources, inject harmful code, bypass security controls, upload malicious file attachments, or violate regional laws. Any violations will result in temporary suspension or permanent termination of access.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">4. Intellectual Property</h2>
              <p className="mt-2">
                All source code, assets, UI layouts, brand identities, and proprietary designs representing FlowForge remain the exclusive property of FlowForge Inc. User-created task data and workspace logs remain the property of the respective workspace owners.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">5. Limitation of Liability</h2>
              <p className="mt-2">
                FlowForge is provided "as is" without warranties of any kind. We shall not be liable for system downtime, data corruption, loss of profits, or any direct/indirect damages arising from the use or inability to use our platform.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">6. Changes to Terms</h2>
              <p className="mt-2">
                We reserves the right to modify these Terms of Service at any time. We will post notification updates when revisions occur. Your continued use of FlowForge signifies your acceptance of the updated terms.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#e4e6eb] px-8 py-6 text-center text-xs text-[#757684] dark:border-[#2a2c38] dark:text-[#a8aab8]">
        <p>&copy; 2026 FlowForge Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
