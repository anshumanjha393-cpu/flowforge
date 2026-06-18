import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f6fa] px-4 dark:bg-[#0b0d12]">
      <div className="text-center">
        <p className="font-display text-8xl font-bold text-[#00288e] dark:text-[#b8c4ff]">
          404
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold text-[#1a1b22] dark:text-white">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm text-[#757684] dark:text-[#a8aab8]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#00288e] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 dark:bg-[#3b52d9]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
