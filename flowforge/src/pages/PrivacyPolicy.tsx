import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const handleBack = () => {
    // Go back in history or default to login
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
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#1a1b22] dark:text-white">Privacy Policy</h1>
          <p className="mt-2 text-xs text-[#757684] dark:text-[#a8aab8]">Last updated: June 20, 2026</p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#4a4b57] dark:text-[#c5c6d0]">
            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">1. Introduction</h2>
              <p className="mt-2">
                Welcome to FlowForge. We value your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our project management platform.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">2. Information We Collect</h2>
              <p className="mt-2">
                We collect personal information that you provide directly to us when registering, such as your email address and profile credentials. When you interact with our services, we also collect workspace data, task details, and telemetry logs.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">3. How We Use Your Information</h2>
              <p className="mt-2">
                We use the collected information to operate, maintain, and improve the FlowForge platform. This includes managing authentication, powering collaborative features like real-time updates and notification routing, and ensuring security auditing.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">4. Cookies & Local Storage</h2>
              <p className="mt-2">
                We use cookies and local storage tokens to preserve session states, remember user theme choices, and enhance the security of the application. You can manage your cookie preferences at any time using our Cookie Consent banner settings.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">5. Data Retention & Deletion</h2>
              <p className="mt-2">
                We retain your data for as long as your account is active. If you request account closure, we will securely delete your personal identifiers from our production systems, subject to legal compliance requirements.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-[#1a1b22] dark:text-white">6. Contact Us</h2>
              <p className="mt-2">
                If you have questions about this Privacy Policy or wish to exercise your data rights, please contact our support team via the Help and Support portal inside the application.
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
