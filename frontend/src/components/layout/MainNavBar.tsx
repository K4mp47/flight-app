import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

interface MainNavBarProps {
  companyuser: boolean;
}

import React, { useEffect, useState } from "react";

export function MainNavBar({ companyuser }: MainNavBarProps) {
  const [visible, setVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setVisible(false);
      } else {
        setVisible(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-2 w-full z-40 left-0 justify-center flex px-2 sm:px-4">
      <NavigationMenu
        className={`transition-opacity bg-card rounded-2xl mt-2 duration-300 px-3 sm:px-4 py-2 flex justify-center w-full max-w-xs sm:max-w-md ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <NavigationMenuList className="flex justify-center w-full flex-wrap gap-1 sm:gap-2">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/login" className="font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">Login</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/profile" className="font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">Profile</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          {companyuser && (
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/dashboard" className="font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">Dashboard</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}