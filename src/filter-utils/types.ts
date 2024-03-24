export type TPartialOperatorMap<V> = Partial<TOperatorMap<V>>;

export type TOperatorMap<V> = {
  $not: V | TPartialOperatorMap<V>;
  $lessThan: V | TPartialOperatorMap<V>;
  $lessThanOrEqual: V | TPartialOperatorMap<V>;
  $moreThan: V | TPartialOperatorMap<V>;
  $moreThanOrEqual: V | TPartialOperatorMap<V>;
  $equal: V | TPartialOperatorMap<V>;
  $like: V | TPartialOperatorMap<V>;
  $ilike: V | TPartialOperatorMap<V>;
  $between: [V | TPartialOperatorMap<V>, V | TPartialOperatorMap<V>];
  $in: V[] | TPartialOperatorMap<V>;
  $any: V[] | TPartialOperatorMap<V>;
  $isNull: null;
  $arrayContains: V[] | TPartialOperatorMap<V>;
  $arrayContainedBy: V[] | TPartialOperatorMap<V>;
  $arrayOverlap: V[] | TPartialOperatorMap<V>;
  $raw: V;
};

type Primitive = string | number | boolean;
type Nullish = null | undefined;

export type Filter<Entity> = {
  [P in keyof Entity]?: Entity[P] extends Primitive[] | Nullish
    ? NonNullable<TPartialOperatorMap<Primitive>>
    : Entity[P] extends Array<infer I> | Nullish
    ? Filter<I>
    : Entity[P] extends Record<any, any> | Nullish
    ? Filter<Entity[P]>
    : NonNullable<TPartialOperatorMap<Entity[P]>>;
};

export type Order<Entity> = {
  [P in keyof Entity]?: Entity[P] extends Primitive[] | Nullish
    ? OrderValue
    : Entity[P] extends Array<infer I> | Nullish
    ? Order<I>
    : Entity[P] extends Record<any, any> | Nullish
    ? Order<Entity[P]>
    : OrderValue;
};

type OrderValue =
  | 'ASC'
  | 'DESC'
  | 'asc'
  | 'desc'
  | 1
  | -1
  | {
      direction?: 'asc' | 'desc' | 'ASC' | 'DESC';
      nulls?: 'first' | 'last' | 'FIRST' | 'LAST';
    };
