"use client";

import { useAuth } from "@/components/ahnara/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AhnaraLoader } from "@/components/ahnara/AhnaraLoader";

export function RoleGuard({ 
  children, 
  allowedRoles,
  fallbackRoute = "/login"
}: { 
  children: React.ReactNode; 
  allowedRoles: string[];
  fallbackRoute?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const rolesKey = allowedRoles.join(",");

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(fallbackRoute);
      } else {
        const userRoleUpper = (user.role || "").toUpperCase();
        const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());
        
        if (!allowedRolesUpper.includes(userRoleUpper)) {
          // Redirect to appropriate dashboard based on role
          if (userRoleUpper === "ADMIN" || userRoleUpper === "OPS") {
            router.push("/admin/dashboard");
          } else if (userRoleUpper === "PRODUCER") {
            router.push("/producer/dashboard");
          } else {
            router.push("/login");
          }
        }
      }
    }
  }, [user, loading, rolesKey, router, fallbackRoute]);

  if (loading) return <AhnaraLoader fullScreen size="lg" />;

  const userRoleUpper = (user?.role || "").toUpperCase();
  const allowedRolesUpper = allowedRoles.map(r => r.toUpperCase());

  if (!user || !allowedRolesUpper.includes(userRoleUpper)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
