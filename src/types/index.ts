export type Category = {
  id: string
  name: string
  description: string
}

export type Report = {
  id: string
  name: string
  number: string
}

export type FilterCondition = {
  field: string
  operator: string
  value: string
}
