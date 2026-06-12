"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";

const getStoredUserName = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("clinicalass_username") || "";
};

export function AvatarButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const storedName = useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("storage", notify);
      return () => window.removeEventListener("storage", notify);
    },
    getStoredUserName,
    () => "",
  );
  const { session } = useAuth();
  const userName = storedName || session?.firstName || "";
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // On the homepage, delay appearance until all animations finish (~4.5s)
  useEffect(() => {
    if (pathname === "/") {
      if (userName) {
        const timer = setTimeout(() => setVisible(true), 4500);
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(true);
    }
  }, [pathname, userName]);

  // Listen for onboarding completion to reset timer on first visit
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "clinicalass_onboarded" && e.newValue === "true" && pathname === "/" && userName) {
        // Onboarding just completed, reset the timer
        setVisible(false);
        const timer = setTimeout(() => setVisible(true), 3500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pathname, userName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Hide button on the homepage name-prompt overlay during first visit
  if (!userName && pathname === "/") return null;

  const initial = userName ? userName.charAt(0).toUpperCase() : "\u{1F464}";

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed right-4 top-4 z-50"
    >
      <div className="relative" ref={dropdownRef}>
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-glow transition hover:scale-105 hover:shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-sm font-semibold">{initial}</span>
          <motion.span
            className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-[220px] overflow-hidden rounded-2xl border border-border/60 bg-surface/80 backdrop-blur-xl shadow-2xl"
            >
              <div className="p-3">
                <p className="text-xs text-muted">
                  Hey, {userName || "there"} {"👋"}
                </p>
              </div>
              <div className="border-t border-border/40" />
              <div className="p-1">
                <Link
                  href="/library"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/10 hover:text-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{"📚"} Library</span>
                  <span className="text-muted">{"→"}</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/10 hover:text-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{"⚙️"} Settings</span>
                  <span className="text-muted">{"→"}</span>
                </Link>
                <Link
                  href="/privacy-policy"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/10 hover:text-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{"🔒"} Privacy Policy</span>
                  <span className="text-muted">{"→"}</span>
                </Link>
                <Link
                  href="/about-developer"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/10 hover:text-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{"🧑‍💻"} Meet the Developer</span>
                  <span className="text-muted">{"→"}</span>
                </Link>
              </div>
              <div className="border-t border-border/40" />
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("clinicalass_username");
                    setIsOpen(false);
                    window.location.reload();
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-xs text-muted transition hover:bg-accent/10 hover:text-accent"
                >
                  {"🚪"} Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}