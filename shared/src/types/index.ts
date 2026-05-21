export type ApiResponse<T = unknown> = {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export type QrisDynamicRequest = {
  qris: string
  amount: number
}

export type QrisDynamicResponse = {
  qris: string
  amount: number
}
