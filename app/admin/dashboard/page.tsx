"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "diupc@diu.edu.bd";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin");
        return;
      }

      const userEmail = user.email?.trim().toLowerCase();

      if (userEmail !== ADMIN_EMAIL.toLowerCase()) {
        await supabase.auth.signOut();
        router.replace("/admin");
        return;
      }

      setEmail(user.email || ADMIN_EMAIL);
      setLoading(false);
    } catch (error) {
      console.error("Admin authentication error:", error);

      await supabase.auth.signOut();
      router.replace("/admin");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin");
  }

  // ...rest of your existing dashboard UI
}
