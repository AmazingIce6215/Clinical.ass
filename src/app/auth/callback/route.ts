import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return Response.redirect(new URL(next, requestUrl.origin), 307);
  }

  const signInUrl = new URL("/sign-in", requestUrl.origin);
  signInUrl.searchParams.set("error", "This sign-in or recovery link is invalid or has expired. Please request a new one.");
  return Response.redirect(signInUrl, 307);
}
