import { Between, Equal, ILike, In, LessThan, Like, MoreThanOrEqual, Not } from 'typeorm';
import { ConditionalOperator, Filter, LogicalOperator } from '../types';
import { buildWhere } from '../WhereBuilder';
import { isEqual, isArray } from 'lodash';

describe('buildWhere', () => {
  it('can build the correct filter when given an AND logical operator', () => {
    const mockFilterInput: Filter = {
      logicalOperator: LogicalOperator.AND,
      filters: [
        {
          fields: ['firstname'],
          operators: [ConditionalOperator.ILike],
          values: ['%fred #%'],
        },
        {
          fields: ['lastname'],
          operators: [ConditionalOperator.Like],
          values: ['%Doh #%'],
        },
      ],
    };

    const expectedWhereOutput = {
      firstname: ILike('%fred #%'),
      lastname: Like('%Doh #%'),
    };

    const buildWhereResult = buildWhere(mockFilterInput);

    const areThesame = isEqual(buildWhereResult, expectedWhereOutput);

    expect(areThesame).toBe(true);
  });

  it('can build the correct filter when given an OR logical operator', () => {
    const mockFilterInput: Filter = {
      logicalOperator: LogicalOperator.OR,
      filters: [
        {
          fields: ['username'],
          operators: [ConditionalOperator.Equal],
          values: ['johndoe'],
        },
        {
          fields: ['email'],
          operators: [ConditionalOperator.Equal],
          values: ['johndoe@gmail.com'],
        },
        {
          fields: ['phone'],
          operators: [ConditionalOperator.Equal],
          values: ['+233247000000'],
        },
      ],
    };

    const expectedWhereOutput = [
      {
        username: Equal('johndoe'),
      },
      {
        email: Equal('johndoe@gmail.com'),
      },
      {
        phone: Equal(233247000000),
      },
    ];

    const buildWhereResult = buildWhere(mockFilterInput);

    expect(isArray(buildWhereResult)).toBe(true);
    expect(isEqual(buildWhereResult[0], expectedWhereOutput[0])).toBe(true);
    expect(isEqual(buildWhereResult[1], expectedWhereOutput[1])).toBe(true);
    expect(isEqual(buildWhereResult[2], expectedWhereOutput[2])).toBe(true);
  });

  it('can build the correct filter when given an AND OR scenario', () => {
    const mockFilterInput: Filter = {
      logicalOperator: LogicalOperator.OR,
      filters: [
        {
          fields: ['firstname', 'lastname', 'age'],
          operators: [ConditionalOperator.ILike, ConditionalOperator.ILike, ConditionalOperator.Equal],
          values: ['john', 'doe', '30'],
        },
        {
          fields: ['powerups'],
          operators: [ConditionalOperator.NotLessThan],
          values: ['400'],
        },
        {
          fields: ['ratings', 'likes'],
          operators: [ConditionalOperator.MoreThanOrEqual, ConditionalOperator.Between],
          values: ['3', JSON.stringify([100, 500])],
        },
        {
          fields: ['tags'],
          operators: [ConditionalOperator.In],
          values: [JSON.stringify(['courageous', 'strong', 'skillful'])],
        },
      ],
    };

    const expectedOutput = [
      { firstname: ILike('john'), lastname: ILike('doe'), age: Equal(30) },
      { powerups: Not(LessThan(400)) },
      { ratings: MoreThanOrEqual(3), likes: Between(100, 500) },
      { tags: In(['courageous', 'strong', 'skillful']) },
    ];

    const buildWhereResult = buildWhere(mockFilterInput);

    expect(isArray(expectedOutput)).toBe(true);
    expect(isEqual(buildWhereResult[0], expectedOutput[0])).toBe(true);
    expect(isEqual(buildWhereResult[1], expectedOutput[1])).toBe(true);
    expect(isEqual(buildWhereResult[2], expectedOutput[2])).toBe(true);
    expect(isEqual(buildWhereResult[3], expectedOutput[3])).toBe(true);
  });
});
