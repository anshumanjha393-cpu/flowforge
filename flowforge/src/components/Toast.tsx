import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--color-surface, #ffffff)",
          border: "1px solid var(--color-outline-variant, #e2e8f0)",
          color: "var(--color-on-surface, #1a1b22)",
        },
      }}
    />
  );
}
