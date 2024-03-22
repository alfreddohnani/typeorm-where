import {
  Equal,
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
  And,
  FindOptionsWhere,
} from 'typeorm';
import { FindFilter } from './types';
import { isPlainObject } from 'lodash';

const OperatorMap = {
  $not: Not,
  $lessThan: LessThan,
  $lessThanOrEqual: LessThanOrEqual,
  $moreThan: MoreThan,
  $moreThanOrEqual: MoreThanOrEqual,
  $equal: Equal,
  $like: Like,
  $ilike: ILike,
  $between: Between,
  $in: In,
  $any: Any,
  $isNull: IsNull,
  $arrayContains: ArrayContains,
  $arrayContainedBy: ArrayContainedBy,
  $arrayOverlap: ArrayOverlap,
  $raw: Raw,
};

const operatorMapKeys = Object.keys(OperatorMap);

//todo: examples. remove us
// type Something = {
//   name: string;
//   age: number;
//   father: {
//     house: boolean;
//     street: string;
//     holiday: string[];
//   };
// };

//todo: example
// const filt: FindFilter<Something> = {
//   age: {
//     $not: {
//       $equal: 10,
//       $between: [2, 4],
//     },
//     $lessThan: 20,
//     $moreThan: 230,
//     $between: [200, 500],
//   },
//   father: {
//     street: { $equal: 'Nmai Dzorn' },
//     holiday: {
//       $in: ['Xmas', 'New Year'],
//     },
//     house: {
//       $not: {
//         $equal: {
//           $ilike: {
//             $lessThan: true,
//           },
//         },
//       },
//       $moreThan: true,
//     },
//   },
//   name: {
//     $equal: '',
//     $like: '',
//     $lessThan: { $equal: '', $lessThan: '' },
//     $between: ['', ''],
//   },
// };

const primitiveTypes = ['string', 'number', 'bigint', 'boolean', 'symbol'];

export const isPrimitiveType = (value: any) => primitiveTypes.includes(typeof value);
const isAbsenceOfValueType = (value: any) => value === undefined || value === null;
const isArrayType = (value: any) => Array.isArray(value);
export const isObjectLiteral = isPlainObject;

const is$betweenOperator = (operatorKey: string) => operatorKey === '$between';
const is$isNullOperator = (operatorKey: string) => operatorKey === '$isNull';

function getOperatorFunc(key: string) {
  const operatorFunc = (OperatorMap as Record<string, any>)[key];
  if (!operatorFunc) {
    throw new Error(`Unknown filter operator ${key}. A filter operator should be one of ${operatorMapKeys.toString()}`);
  }
  return operatorFunc;
}

function getFindOperator(key: string, value: any) {
  if (isPrimitiveType(value)) {
    const operatorFunc = getOperatorFunc(key);
    return operatorFunc(value);
  } else if (isArrayType(value)) {
    const operatorFunc = getOperatorFunc(key);
    if (is$betweenOperator(key)) {
      return operatorFunc(...(value as unknown[]));
    }
    return operatorFunc(value);
  } else if (isAbsenceOfValueType(value)) {
    const operatorFunc = getOperatorFunc(key);
    if (is$isNullOperator(key)) {
      return operatorFunc();
    }
    return operatorFunc(value);
  } else if (isObjectLiteral(value)) {
    const nestedFindOperatorList = [] as any[];
    Object.entries(value).forEach(([key, value]) => {
      nestedFindOperatorList.push(getFindOperator(key, value));
    });
    const operatorFunc = getOperatorFunc(key);
    return operatorFunc(And(...nestedFindOperatorList));
  } else {
    throw new Error(`Unhandled value type of operator ${key} : ${value?.toString ? value.toString() : value}`);
  }
}

function compileToOperatorAst<Entity>(filterMap: FindFilter<Entity>) {
  const ast = filterMap as Record<string, any>;
  const keys = Object.keys(ast);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key.startsWith('$')) {
      const operatorFunc = getFindOperator(key, ast[key]);
      ast[`___$operator_${i}`] = operatorFunc;

      delete ast[key];
    } else if (isObjectLiteral(ast[key])) {
      compileToOperatorAst(ast[key]);
    }
  }

  return ast;
}

function joinOperatorValues(operatorValues: any[]) {
  return And(...operatorValues);
}
function getFindFilterMap(ast: Record<string, any>) {
  const keys = Object.keys(ast);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key.startsWith('___$operator_')) {
      const subVal = ast[key];
      const isOperatorSubKeys = Object.keys(subVal)[0].startsWith('___$operator_');

      if (isOperatorSubKeys) {
        ast[key] = joinOperatorValues(Object.values(subVal));
        if (!subVal) {
          delete ast[key];
        }
      } else {
        getFindFilterMap(subVal);
      }
    }
  }

  return ast;
}

export function getWhereMap<Entity>(
  filter: FindFilter<Entity>[] | FindFilter<Entity>,
): FindOptionsWhere<Entity>[] | FindOptionsWhere<Entity> | null {
  if (!filter) return null;
  if (Array.isArray(filter)) {
    return filter.map((f) => {
      const ast = compileToOperatorAst(f);
      return getFindFilterMap(ast);
    });
  }
  const ast = compileToOperatorAst(filter);
  return getFindFilterMap(ast);
}

// todo: example call
// console.dir(getWhereMap(filt), { depth: Infinity });
