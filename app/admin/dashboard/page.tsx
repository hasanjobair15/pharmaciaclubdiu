async function checkUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.replace("/admin");
    return;
  }

  const userEmail =
    user.email?.trim().toLowerCase();

  if (
    userEmail !==
    "jobair2311091015@diu.edu.bd"
  ) {
    await supabase.auth.signOut();

    router.replace("/admin");
    return;
  }

  setEmail(user.email || "");
  setLoading(false);
}
