export const isMissingColumnError = (
  error: { code?: string; message?: string } | null | undefined,
  column: string
): boolean =>
  error?.code === '42703' ||
  Boolean(error?.message?.includes(column) && error.message.includes('does not exist'))
