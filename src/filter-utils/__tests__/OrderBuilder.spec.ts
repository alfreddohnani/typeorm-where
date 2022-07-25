import { OrderBy } from '../types';
import { isEqual } from 'lodash';
import { buildOrder } from '../OrderBuilder';

describe('buildOrder', () => {
  it('can build an order object', () => {
    const mockOrder: OrderBy = {
      fields: ['firstname', 'createdAt'],
      values: ['ASC', 'DESC'],
    };
    const expectedOrderObj = {
      firstname: 'ASC',
      createdAt: 'DESC',
    };

    const orderObj = buildOrder(mockOrder);

    expect(isEqual(orderObj, expectedOrderObj)).toBe(true);
  });
});
