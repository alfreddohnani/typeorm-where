import { OrderBy } from './types';

export function buildOrder(order: OrderBy) {
  const { fields, values } = order;

  const orderObj: Record<string, any> = {};

  fields.forEach((field, index) => {
    orderObj[field] = values[index];
  });

  return orderObj;
}
