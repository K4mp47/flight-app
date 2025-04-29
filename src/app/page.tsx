"use client";
import { MainForm } from "@/components/MainForm";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div>
      <div className="relative">
        <img
          src="/banner.svg"
          alt="Logo"
          className="sticky object-cover w-full h-80"
        />
        <div className="absolute bottom-0 left-0 w-full h-30 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </div>
      <div className="text-6xl font-bold text-center uppercase mt-40">
        Book your{" "}
        <span className="relative">
          flight
          <svg
            viewBox="0 0 572 146"
            fill="none"
            className="absolute -left-2 -right-2 -top-2 bottom-0 translate-y-1 scale-125"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              transition={{
                duration: 1.25,
                ease: "easeInOut",
              }}
              d="M284.586 2C213.708 33.7816 12.164 14.3541 2.47308 86.7512C-4.21208 136.693 59.1266 146.53 245.376 143.504C431.628 140.477 632.596 141.378 551.522 76.157C460.28 2.7567 194.101 48.915 105.877 2"
              stroke="#FACC15"
              strokeWidth="3"
            />
          </svg>
        </span>
      </div>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] mt-96">
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <MainForm />
        </main>
      </div>
    </div>
  );
}
