import { ConditionalOperator, Filter, FilterMember, LogicalOperator } from './types';
import {
  Equal,
  FindOperator,
  ILike,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Between,
  In,
  Any,
  IsNull,
  ArrayContains,
  ArrayOverlap,
  Raw,
  ArrayContainedBy,
} from 'typeorm';

type TConditionalOperatorFunction = (values: string[]) => FindOperator<any>;

const getNumberOrString = (value: string): string | number => (isNaN(Number(value)) ? value : Number(value));

function useConditionalOperatorCreator(args: {
  operator: any;
  not?: boolean;
  arrayType?: boolean | 'between';
  isNull?: boolean;
}): (values: string[]) => FindOperator<any> {
  const { operator, not, arrayType, isNull } = args;

  // !arrayType values must have been stringified
  if (arrayType === true) {
    return not
      ? (values: string[]) => Not(operator(JSON.parse(values[0]).map(getNumberOrString)))
      : (values: string[]) => operator(JSON.parse(values[0]).map(getNumberOrString));
  }

  if (arrayType === 'between') {
    return not
      ? (values: string[]) => {
          const list = JSON.parse(values[0]).map(getNumberOrString);
          return Not(operator(list[0], list[1]));
        }
      : (values: string[]) => {
          const list = JSON.parse(values[0]).map(getNumberOrString);
          return operator(list[0], list[1]);
        };
  }

  if (isNull) {
    return not ? () => Not(operator()) : () => operator();
  }

  return not
    ? (values: string[]) => Not(operator(getNumberOrString(values[0])))
    : (values: string[]) => operator(getNumberOrString(values[0]));
}

export function getConditionalOperator(conditionalOperator: ConditionalOperator) {
  let conditionalOperatorFunction: TConditionalOperatorFunction;

  switch (conditionalOperator) {
    case ConditionalOperator.Not:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: Not,
        not: true,
      });
      break;
    case ConditionalOperator.LessThan:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: LessThan,
      });
      break;
    case ConditionalOperator.LessThanOrEqual:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: LessThanOrEqual,
      });
      break;
    case ConditionalOperator.MoreThan:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: MoreThan,
      });
      break;
    case ConditionalOperator.MoreThanOrEqual:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: MoreThanOrEqual,
      });
      break;
    case ConditionalOperator.Equal:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: Equal,
      });
      break;
    case ConditionalOperator.Like:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: Like,
      });
      break;
    case ConditionalOperator.ILike:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: ILike,
      });
      break;
    case ConditionalOperator.Between:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: Between,
        arrayType: 'between',
      });
      break;
    case ConditionalOperator.In:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: In,
        arrayType: true,
      });
      break;
    case ConditionalOperator.Any:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: Any,
        arrayType: true,
      });
      break;
    case ConditionalOperator.IsNull:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: IsNull,
        isNull: true,
      });
      break;
    case ConditionalOperator.ArrayContains:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: ArrayContains,
        arrayType: true,
      });
      break;
    case ConditionalOperator.ArrayContainedBy:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: ArrayContainedBy,
        arrayType: true,
      });
      break;
    case ConditionalOperator.ArrayOverlap:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: ArrayOverlap,
        arrayType: true,
      });
      break;
    case ConditionalOperator.Raw:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: Raw,
      });
      break;
    case ConditionalOperator.NotLessThan:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: LessThan,
        not: true,
      });
      break;
    case ConditionalOperator.NotLessThanOrEqual:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: LessThanOrEqual,
        not: true,
      });
      break;
    case ConditionalOperator.NotMoreThan:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: MoreThan,
        not: true,
      });
      break;
    case ConditionalOperator.NotMoreThanOrEqual:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: MoreThanOrEqual,
        not: true,
      });
      break;
    case ConditionalOperator.NotEqual:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: Equal,
        not: true,
      });
      break;
    case ConditionalOperator.NotLike:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: Like,
        not: true,
      });
      break;
    case ConditionalOperator.NotILike:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: ILike,
        not: true,
      });
      break;
    case ConditionalOperator.NotBetween:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: Between,
        not: true,
        arrayType: 'between',
      });
      break;
    case ConditionalOperator.NotIn:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: In,
        not: true,
        arrayType: true,
      });
      break;
    case ConditionalOperator.NotAny:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: Any,
        not: true,
        arrayType: true,
      });
      break;
    case ConditionalOperator.IsNotNull:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: IsNull,
        not: true,
      });
      break;
    case ConditionalOperator.ArrayNotContains:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: ArrayContains,
        not: true,
        arrayType: true,
      });
      break;
    case ConditionalOperator.ArrayNotContainedBy:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: ArrayContainedBy,
        not: true,
        arrayType: true,
      });
      break;
    case ConditionalOperator.ArrayNotOverlap:
      conditionalOperatorFunction = useConditionalOperatorCreator({
        operator: ArrayOverlap,
        not: true,
        arrayType: true,
      });
      break;
  }

  return conditionalOperatorFunction;
}

export function buildWhere(filter: Filter) {
  const { logicalOperator, filters } = filter;

  let where: Record<string, any> | Record<string, any>[];

  // !handle AND operator
  if (logicalOperator === LogicalOperator.AND) {
    where = {};

    filters.forEach((filterMember: FilterMember) => {
      const { fields, operators, values } = filterMember;
      const field = fields[0];
      const operator = operators[0];
      (where as Record<string, any>)[field] = getConditionalOperator(operator)(values);
    });

    return where;
  }

  // !handle OR operator
  if (logicalOperator === LogicalOperator.OR) {
    where = filters.map((filterMember: FilterMember) => {
      const listItem: Record<string, any> = {};
      const { fields, operators, values } = filterMember;

      fields.forEach((field, index) => {
        listItem[field] = getConditionalOperator(operators[index])([values[index]]);
      });

      return listItem;
    });

    return where;
  }

  throw new Error('Logical operator must be of enum type LogicalOperator');
}
