import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

type NoteWebhook = {
  type?: string;
  table?: string;
  schema?: string;
  record?: { id?: string; texto?: string };
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });

function endpointPermitido(endpoint: string) {
  try {
    const url = new URL(endpoint);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:"
      && (host === "fcm.googleapis.com"
        || host === "web.push.apple.com"
        || host.endsWith(".push.services.mozilla.com")
        || host.endsWith(".notify.windows.com"));
  } catch {
    return false;
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("AINOS_WEBHOOK_SECRET") || "";
  const provided = request.headers.get("x-ainos-webhook-secret") || "";
  if (!secret || provided.length !== secret.length || provided !== secret) {
    return json({ error: "unauthorized" }, 401);
  }

  let payload: NoteWebhook;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (payload.type !== "INSERT" || payload.table !== "ainos_notes" || payload.schema !== "public") {
    return json({ ignored: true });
  }
  const note = payload.record;
  if (!note?.id || typeof note.texto !== "string") return json({ error: "invalid_note" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublic = Deno.env.get("AINOS_VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("AINOS_VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("AINOS_VAPID_SUBJECT") || "mailto:ainos-watch@example.com";
  if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate) {
    console.error("Missing push function secrets.");
    return json({ error: "server_not_configured" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: subscriptions, error } = await supabase
    .from("ainos_push_subscriptions")
    .select("endpoint,p256dh,auth");
  if (error) {
    console.error("Could not read push subscriptions:", error.message);
    return json({ error: "subscriptions_unavailable" }, 500);
  }
  if (!subscriptions?.length) return json({ sent: 0, expired: 0 });

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const siteUrl = "https://ainos-counter.vercel.app/";
  const body = note.texto.replace(/\s+/g, " ").trim().slice(0, 150);
  const message = JSON.stringify({
    title: "Nova ocorrência do Ainos",
    body: body || "Uma nova ocorrência foi registrada.",
    tag: "ainos-note-" + note.id,
    url: siteUrl + "?nota=" + encodeURIComponent(note.id)
  });

  let sent = 0;
  let expired = 0;
  const results = await Promise.allSettled(subscriptions.map(async (item) => {
    if (!endpointPermitido(item.endpoint)) {
      console.warn("Ignored unsupported push endpoint.");
      return;
    }
    try {
      await webpush.sendNotification({
        endpoint: item.endpoint,
        keys: { p256dh: item.p256dh, auth: item.auth }
      }, message, { TTL: 60 * 60 * 24 * 7 });
      sent++;
    } catch (pushError) {
      const status = (pushError as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("ainos_push_subscriptions").delete().eq("endpoint", item.endpoint);
        expired++;
      } else {
        console.error("Push delivery failed:", status || "unknown");
      }
    }
  }));
  const failed = results.filter((result) => result.status === "rejected").length;
  return json({ sent, expired, failed });
});
