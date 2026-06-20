import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("flowforge_cookie_consent");
    if (!consent) {
      // Delay showing the banner slightly for a premium, non-intrusive feel
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("flowforge_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("flowforge_cookie_consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[9999] mx-auto max-w-xl animate-fade-in-up md:left-auto md:right-6">
      <div className="rounded-xl border border-[#e4e6eb] bg-white/95 p-5 shadow-2xl backdrop-blur-md dark:border-[#2a2c38] dark:bg-[#15171f]/95 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#dde1ff] text-[#00288e] dark:bg-[#1e40af]/30 dark:text-[#b8c4ff]">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M12 2a10 10 0 1 0 10 10c0-1-.8-2-1.8-2h-.4c-.9 0-1.6-.7-1.6-1.6v-.4c0-1-.8-1.8-1.8-1.8h-.4c-.9 0-1.6-.7-1.6-1.6v-.4c0-1-.8-1.8-1.8-1.8h-.6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.5" cy="11.5" r="1.5" fill="currentColor"/>
                <circle cx="12.5" cy="15.5" r="1.5" fill="currentColor"/>
                <circle cx="15.5" cy="11.5" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-[#1a1b22] dark:text-white">Cookie Consent</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#757684] dark:text-[#a8aab8]">
                We use cookies to improve your workspace experience, keep you signed in, and understand platform interactions. By continuing, you agree to our usage. Read our{" "}
                <Link to="/privacy" className="font-semibold text-[#00288e] hover:underline dark:text-[#b8c4ff]">Privacy Policy</Link>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 text-xs">
            <button
              onClick={handleDecline}
              className="rounded-lg border border-[#e4e6eb] bg-transparent px-4 py-2 font-semibold text-[#757684] transition-colors hover:bg-gray-50 dark:border-[#2a2c38] dark:text-[#a8aab8] dark:hover:bg-[#1e202b]"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="rounded-lg bg-[#00288e] px-4 py-2 font-semibold text-white transition-colors hover:opacity-90 dark:bg-[#3b52d9]"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
