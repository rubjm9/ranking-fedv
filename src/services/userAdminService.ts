import { supabase } from '@/services/supabaseService'

export type AppUserRole = 'admin' | 'editor'

export interface ManagedUser {
  id: string
  email: string
  role: AppUserRole
  active: boolean
  banned_until: string | null
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
}

type ManageUsersAction =
  | { action: 'list'; page?: number; perPage?: number }
  | { action: 'create'; email: string; password: string; role?: AppUserRole }
  | { action: 'update'; userId: string; email?: string; role?: AppUserRole }
  | { action: 'resetPassword'; userId: string; password: string }
  | { action: 'setActive'; userId: string; active: boolean }
  | { action: 'delete'; userId: string }

async function invokeManageUsers<T>(body: ManageUsersAction): Promise<T> {
  if (!supabase) {
    throw new Error('Cliente de Supabase no disponible')
  }

  const { data, error } = await supabase.functions.invoke('manage-users', {
    body,
  })

  if (data?.error) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Error en manage-users')
  }

  if (error) {
    throw new Error(error.message || 'Error al llamar a manage-users')
  }

  return data as T
}

export const userAdminService = {
  list: (page = 1, perPage = 50) =>
    invokeManageUsers<{ users: ManagedUser[]; total: number }>({
      action: 'list',
      page,
      perPage,
    }),

  create: (payload: { email: string; password: string; role?: AppUserRole }) =>
    invokeManageUsers<{ user: ManagedUser }>({
      action: 'create',
      ...payload,
    }),

  update: (payload: { userId: string; email?: string; role?: AppUserRole }) =>
    invokeManageUsers<{ user: ManagedUser }>({
      action: 'update',
      ...payload,
    }),

  resetPassword: (userId: string, password: string) =>
    invokeManageUsers<{ user: ManagedUser }>({
      action: 'resetPassword',
      userId,
      password,
    }),

  setActive: (userId: string, active: boolean) =>
    invokeManageUsers<{ user: ManagedUser }>({
      action: 'setActive',
      userId,
      active,
    }),

  delete: (userId: string) =>
    invokeManageUsers<{ success: boolean }>({
      action: 'delete',
      userId,
    }),
}
