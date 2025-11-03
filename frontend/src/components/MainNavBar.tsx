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
    <div className="fixed top-0 w-full z-40 left-0 justify-center flex">
      <NavigationMenu
        className={`transition-opacity bg-card rounded-2xl mt-2 duration-300 px-4 py-2 flex justify-center ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <NavigationMenuList className="flex justify-center w-full">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/login" className="font-bold">Login</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link href="/profile" className="font-bold">Profile</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          {companyuser && (
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/dashboard" className="font-bold">Dashboard</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}