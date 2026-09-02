import { supabase } from "../lib/supabase";

export default async function SupabaseTest() {
  const { error } = await supabase.from("test_connection").select("*");

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">Supabase Connection Test</h1>

      <p className="mt-4">
        {error
          ? `Connection reached Supabase. Message: ${error.message}`
          : "Supabase connection is working!"}
      </p>
    </main>
  );
}