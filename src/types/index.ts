export type Category = {
  id: string
  name: string
  description: string
  reportCount: number
  productCount: number
  displayOrder: number
}

export type Report = {
  id: string
  name: string
  number: string
  description: string
  status: string
  version: number
  updatedAt: string
}

export type FilterCondition = {
  field: string
  operator: string
  value: string
}
