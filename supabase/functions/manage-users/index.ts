import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type UserRole = "admin" | "editor";

type ManageUsersBody = {
  action: "list" | "create" | "update" | "resetPassword" | "setActive" | "delete";
  email?: string;
  password?: string;
  role?: UserRole;
  userId?: string;
  active?: boolean;
  page?: number;
  perPage?: number;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mapUser(user: {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  created_at: string;
  last_sign_in_at?: string;
  banned_until?: string;
  email_confirmed_at?: string;
}) {
  const role =
    user.app_metadata?.role === "admin" || user.app_metadata?.role === "editor"
      ? user.app_metadata.role
      : "editor";

  const bannedUntil = user.banned_until ? new Date(user.banned_until) : null;
  const isBanned = Boolean(bannedUntil && bannedUntil.getTime() > Date.now());

  return {
    id: user.id,
    email: user.email ?? "",
    role,
    active: !isBanned,
    banned_until: user.banned_until ?? null,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return jsonResponse({ error: "Configuración de Supabase incompleta" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "No autorizado" }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await userClient.auth.getUser();

    if (callerError || !caller) {
      return jsonResponse({ error: "Sesión inválida" }, 401);
    }

    if (caller.app_metadata?.role !== "admin") {
      return jsonResponse(
        { error: "Solo los administradores pueden gestionar usuarios" },
        403,
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const body = (await req.json()) as ManageUsersBody;

    switch (body.action) {
      case "list": {
        const page = body.page && body.page > 0 ? body.page : 1;
        const perPage = body.perPage && body.perPage > 0 ? Math.min(body.perPage, 100) : 50;
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
        if (error) {
          return jsonResponse({ error: error.message }, 400);
        }
        return jsonResponse({
          users: (data.users ?? []).map(mapUser),
          total: data.total ?? data.users?.length ?? 0,
        });
      }

      case "create": {
        if (!body.email || !body.password) {
          return jsonResponse({ error: "Email y contraseña son obligatorios" }, 400);
        }
        if (body.password.length < 6) {
          return jsonResponse({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
        }
        const role: UserRole = body.role === "admin" ? "admin" : "editor";
        const { data, error } = await adminClient.auth.admin.createUser({
          email: body.email.trim().toLowerCase(),
          password: body.password,
          email_confirm: true,
          app_metadata: { role },
        });
        if (error) {
          return jsonResponse({ error: error.message }, 400);
        }
        return jsonResponse({ user: mapUser(data.user) }, 201);
      }

      case "update": {
        if (!body.userId) {
          return jsonResponse({ error: "userId es obligatorio" }, 400);
        }
        const updates: {
          email?: string;
          app_metadata?: { role: UserRole };
        } = {};
        if (body.email) {
          updates.email = body.email.trim().toLowerCase();
        }
        if (body.role === "admin" || body.role === "editor") {
          updates.app_metadata = { role: body.role };
        }
        if (!updates.email && !updates.app_metadata) {
          return jsonResponse({ error: "Nada que actualizar" }, 400);
        }
        const { data, error } = await adminClient.auth.admin.updateUserById(
          body.userId,
          updates,
        );
        if (error) {
          return jsonResponse({ error: error.message }, 400);
        }
        return jsonResponse({ user: mapUser(data.user) });
      }

      case "resetPassword": {
        if (!body.userId || !body.password) {
          return jsonResponse({ error: "userId y password son obligatorios" }, 400);
        }
        if (body.password.length < 6) {
          return jsonResponse({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
        }
        const { data, error } = await adminClient.auth.admin.updateUserById(body.userId, {
          password: body.password,
        });
        if (error) {
          return jsonResponse({ error: error.message }, 400);
        }
        return jsonResponse({ user: mapUser(data.user) });
      }

      case "setActive": {
        if (!body.userId || typeof body.active !== "boolean") {
          return jsonResponse({ error: "userId y active son obligatorios" }, 400);
        }
        if (body.userId === caller.id && body.active === false) {
          return jsonResponse({ error: "No puedes desactivar tu propia cuenta" }, 400);
        }
        const { data, error } = await adminClient.auth.admin.updateUserById(body.userId, {
          ban_duration: body.active ? "none" : "876000h",
        });
        if (error) {
          return jsonResponse({ error: error.message }, 400);
        }
        return jsonResponse({ user: mapUser(data.user) });
      }

      case "delete": {
        if (!body.userId) {
          return jsonResponse({ error: "userId es obligatorio" }, 400);
        }
        if (body.userId === caller.id) {
          return jsonResponse({ error: "No puedes eliminar tu propia cuenta" }, 400);
        }
        const { error } = await adminClient.auth.admin.deleteUser(body.userId);
        if (error) {
          return jsonResponse({ error: error.message }, 400);
        }
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Acción no válida" }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return jsonResponse({ error: message }, 500);
  }
});
