import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PROVISION_EMAIL = "roishape2026@gmail.com";
const PROVISION_PASSWORD = "DESTRAVA2026@";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    const cleanEmail = (email || "").trim().toLowerCase();

    if (cleanEmail !== PROVISION_EMAIL || password !== PROVISION_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "Credenciais inválidas." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Try to sign in first — account may already exist
    const { data: signInData, error: signInError } = await supabaseAdmin.auth
      .signInWithPassword({ email: PROVISION_EMAIL, password: PROVISION_PASSWORD });

    if (!signInError && signInData.user) {
      // Ensure the profile role is admin
      await supabaseAdmin.from("profiles")
        .update({ role: "admin", plan_type: "pro", subscription_status: "active" })
        .eq("id", signInData.user.id);

      return new Response(
        JSON.stringify({ access_token: signInData.session?.access_token, refresh_token: signInData.session?.refresh_token }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Account doesn't exist yet — create it
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: PROVISION_EMAIL,
      password: PROVISION_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: "Master ROI Shape" },
    });

    if (signUpError) {
      return new Response(
        JSON.stringify({ error: "Falha ao provisionar conta admin." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Set the profile to admin
    await supabaseAdmin.from("profiles")
      .upsert({
        id: signUpData.user.id,
        email: PROVISION_EMAIL,
        display_name: "Master ROI Shape",
        role: "admin",
        plan_type: "pro",
        subscription_status: "active",
      });

    // Now sign in to get a session token
    const { data: newSignIn, error: newSignInError } = await supabaseAdmin.auth
      .signInWithPassword({ email: PROVISION_EMAIL, password: PROVISION_PASSWORD });

    if (newSignInError || !newSignIn.session) {
      return new Response(
        JSON.stringify({ error: "Conta criada, mas falha ao gerar sessão. Tente fazer login novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ access_token: newSignIn.session.access_token, refresh_token: newSignIn.session.refresh_token }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
