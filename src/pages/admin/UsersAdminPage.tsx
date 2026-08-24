import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  KeyRound,
  Plus,
  Search,
  ShieldOff,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminPageHeader from '@/components/layout/AdminPageHeader'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { useAuth } from '@/contexts/SimpleAuthContext'
import {
  AppUserRole,
  ManagedUser,
  userAdminService,
} from '@/services/userAdminService'

type ModalMode = 'create' | 'edit' | 'password' | 'delete' | null

const emptyCreateForm = {
  email: '',
  password: '',
  role: 'editor' as AppUserRole,
}

const UsersAdminPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [editForm, setEditForm] = useState({ email: '', role: 'editor' as AppUserRole })
  const [passwordForm, setPasswordForm] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userAdminService.list(),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })

  const createMutation = useMutation({
    mutationFn: () => userAdminService.create(createForm),
    onSuccess: () => {
      toast.success('Usuario creado')
      setModalMode(null)
      setCreateForm(emptyCreateForm)
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      userAdminService.update({
        userId: selectedUser!.id,
        email: editForm.email,
        role: editForm.role,
      }),
    onSuccess: () => {
      toast.success('Usuario actualizado')
      setModalMode(null)
      setSelectedUser(null)
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const passwordMutation = useMutation({
    mutationFn: () => userAdminService.resetPassword(selectedUser!.id, passwordForm),
    onSuccess: () => {
      toast.success('Contraseña actualizada')
      setModalMode(null)
      setSelectedUser(null)
      setPasswordForm('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const activeMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      userAdminService.setActive(userId, active),
    onSuccess: (_data, variables) => {
      toast.success(variables.active ? 'Usuario activado' : 'Usuario desactivado')
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => userAdminService.delete(selectedUser!.id),
    onSuccess: () => {
      toast.success('Usuario eliminado')
      setModalMode(null)
      setSelectedUser(null)
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const users = data?.users ?? []

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return users
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
    )
  }, [users, searchTerm])

  const openEdit = (user: ManagedUser) => {
    setSelectedUser(user)
    setEditForm({ email: user.email, role: user.role })
    setModalMode('edit')
  }

  const openPassword = (user: ManagedUser) => {
    setSelectedUser(user)
    setPasswordForm('')
    setModalMode('password')
  }

  const openDelete = (user: ManagedUser) => {
    setSelectedUser(user)
    setModalMode('delete')
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedUser(null)
    setPasswordForm('')
  }

  const formatDate = (value: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            {(error as Error).message || 'Error al cargar los usuarios'}
          </div>
          <button onClick={() => invalidate()} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Usuarios"
        subtitle="Gestiona el acceso al backoffice"
        actions={
          <button
            onClick={() => {
              setCreateForm(emptyCreateForm)
              setModalMode('create')
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-subtle" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por email o rol..."
              className="w-full pl-10 pr-3 py-2 border border-line-strong rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="bg-surface rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Último acceso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-line">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-content-subtle">
                        No hay usuarios que coincidan con la búsqueda
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelf = user.id === currentUser?.id
                      return (
                        <tr key={user.id} className="hover:bg-surface-muted">
                          <td className="px-4 py-3 text-sm text-content">
                            {user.email}
                            {isSelf && (
                              <span className="ml-2 text-xs text-link">(tú)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300'
                                  : 'bg-surface-muted text-content-muted'
                              }`}
                            >
                              {user.role === 'admin' ? 'Admin' : 'Editor'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                user.active
                                  ? 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300'
                                  : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'
                              }`}
                            >
                              {user.active ? 'Activo' : 'Desactivado'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-content-muted">
                            {formatDate(user.last_sign_in_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-content-muted">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(user)}
                                className="p-2 text-content-subtle hover:text-green-600 hover:bg-green-50 rounded-lg"
                                title="Editar"
                              >
                                <UserCog className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openPassword(user)}
                                className="p-2 text-content-subtle hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Resetear contraseña"
                              >
                                <KeyRound className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                disabled={isSelf || activeMutation.isPending}
                                onClick={() =>
                                  activeMutation.mutate({
                                    userId: user.id,
                                    active: !user.active,
                                  })
                                }
                                className="p-2 text-content-subtle hover:text-amber-600 hover:bg-amber-50 rounded-lg disabled:opacity-40"
                                title={user.active ? 'Desactivar' : 'Activar'}
                              >
                                {user.active ? (
                                  <ShieldOff className="h-4 w-4" />
                                ) : (
                                  <ShieldCheck className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                disabled={isSelf}
                                onClick={() => openDelete(user)}
                                className="p-2 text-content-subtle hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-surface rounded-lg shadow-xl w-full max-w-md p-6">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-3 top-3 p-1 text-content-subtle hover:text-content-muted"
            >
              <X className="h-5 w-5" />
            </button>

            {modalMode === 'create' && (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  createMutation.mutate()
                }}
              >
                <h3 className="text-lg font-semibold text-content">Nuevo usuario</h3>
                <div>
                  <label className="block text-sm font-medium text-content-muted mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-line-strong rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-content-muted mb-1">Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-line-strong rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-content-muted mb-1">Rol</label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, role: e.target.value as AppUserRole }))
                    }
                    className="w-full px-3 py-2 border border-line-strong rounded-lg text-sm"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="btn-outline">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn-primary"
                  >
                    {createMutation.isPending ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            )}

            {modalMode === 'edit' && selectedUser && (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  updateMutation.mutate()
                }}
              >
                <h3 className="text-lg font-semibold text-content">Editar usuario</h3>
                <div>
                  <label className="block text-sm font-medium text-content-muted mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-line-strong rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-content-muted mb-1">Rol</label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, role: e.target.value as AppUserRole }))
                    }
                    className="w-full px-3 py-2 border border-line-strong rounded-lg text-sm"
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="btn-outline">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="btn-primary"
                  >
                    {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            )}

            {modalMode === 'password' && selectedUser && (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  passwordMutation.mutate()
                }}
              >
                <h3 className="text-lg font-semibold text-content">Resetear contraseña</h3>
                <p className="text-sm text-content-muted">{selectedUser.email}</p>
                <div>
                  <label className="block text-sm font-medium text-content-muted mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm}
                    onChange={(e) => setPasswordForm(e.target.value)}
                    className="w-full px-3 py-2 border border-line-strong rounded-lg text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="btn-outline">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={passwordMutation.isPending}
                    className="btn-primary"
                  >
                    {passwordMutation.isPending ? 'Guardando...' : 'Actualizar'}
                  </button>
                </div>
              </form>
            )}

            {modalMode === 'delete' && selectedUser && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-content">Eliminar usuario</h3>
                <p className="text-sm text-content-muted">
                  ¿Seguro que quieres eliminar a <strong>{selectedUser.email}</strong>? Esta
                  acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="btn-outline">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                    className="btn-primary bg-red-600 hover:bg-red-700"
                  >
                    {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersAdminPage
