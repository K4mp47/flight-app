"use client";
import { MainForm } from "@/components/MainForm";
import { MainNavBar } from "@/components/MainNavBar";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {

  // check if the user is a company user
  const [companyuser, setCompanyuser] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCompanyuser(payload.role === 'Airline-Admin');
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRole();
  }, []);

  return (
    <div className="min-h-screen text-white" suppressHydrationWarning={true}>
      <MainNavBar companyuser={companyuser} />
      <div className="relative">
        <Image
          src="/banner.svg"
          alt="Logo"
          width={1920}
          height={1080}
          className="w-full h-40 sm:h-60 md:h-80 object-cover"
        />
        <div className="absolute bottom-0 left-0 w-full h-30 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
      </div>

      <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center uppercase mt-12 sm:mt-20 md:mt-32 px-4">
        Book your{" "}
        <span className="relative inline-block">
          flight
          <svg
            viewBox="0 0 572 146"
            fill="none"
            className="absolute -left-2 -right-2 -top-2 bottom-0 translate-y-1 scale-125"
            aria-hidden="true"
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
        <p className="text-xl sm:text-2xl md:text-2xl lg:text-3xl text-gray-400 mt-8 lowercase w-full text-center">
          Enter your trip details below to search for flights
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <main>
          <MainForm />
        </main>
      </div>
    </div>
  );
}
