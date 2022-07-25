export enum LogicalOperator {
  OR = 'OR',
  AND = 'AND',
}

type TOrderDirection = 'ASC' | 'DESC' | 'asc' | 'desc';

export enum ConditionalOperator {
  Not = 'Not',
  LessThan = 'LessThan',
  LessThanOrEqual = 'LessThanOrEqual',
  MoreThan = 'MoreThan',
  MoreThanOrEqual = 'MoreThanOrEqual',
  Equal = 'Equal',
  Like = 'Like',
  ILike = 'ILike',
  Between = 'Between',
  In = 'In',
  Any = 'Any',
  IsNull = 'IsNull',
  ArrayContains = 'ArrayContains',
  ArrayContainedBy = 'ArrayContainedBy',
  ArrayOverlap = 'ArrayOverlap',
  Raw = 'Raw',
  NotLessThan = 'NotLessThan',
  NotLessThanOrEqual = 'NotLessThanOrEqual',
  NotMoreThan = 'NotMoreThan',
  NotMoreThanOrEqual = 'NotMoreThanOrEqual',
  NotEqual = 'NotEqual',
  NotLike = 'NotLike',
  NotILike = 'NotILike',
  NotBetween = 'NotBetween',
  NotIn = 'NotIn',
  NotAny = 'NotAny',
  IsNotNull = 'IsNotNull',
  ArrayNotContains = 'ArrayNotContains',
  ArrayNotContainedBy = 'ArrayNotContainedBy',
  ArrayNotOverlap = 'ArrayNotOverlap',
}

export interface FilterMember {
  fields: string[];
  values: string[];
  operators: ConditionalOperator[];
}

export interface Filter {
  logicalOperator: LogicalOperator;
  filters: FilterMember[];
}

export interface OrderBy {
  fields: string[];
  values: TOrderDirection[];
}
