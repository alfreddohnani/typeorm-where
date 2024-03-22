import { DataSource } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Category } from './tests/utils/entities/category.entity';
import { OrderItem } from './tests/utils/entities/order-item.entity';
import { Order } from './tests/utils/entities/order.entity';
import { Payment } from './tests/utils/entities/payment.entity';
import { Product } from './tests/utils/entities/product.entity';
import { User } from './tests/utils/entities/user.entity';

describe('Typeorm advanced filter util test', () => {
  jest.setTimeout(1000 * 60 * 1);

  let postgreSqlContainer: StartedPostgreSqlContainer;
  let datasource: DataSource;

  beforeAll(async () => {
    postgreSqlContainer = await new PostgreSqlContainer()
      .withName('testcontainer-filter')
      .withDatabase('testcontainer-filter')
      .start();

    const DB_HOST = postgreSqlContainer.getHost();
    const DB_PORT = postgreSqlContainer.getPort().toString();
    const DB_USERNAME = postgreSqlContainer.getUsername();
    const DB_PASSWORD = postgreSqlContainer.getPassword();
    const DB_NAME = postgreSqlContainer.getDatabase();

    datasource = new DataSource({
      type: 'postgres',
      host: DB_HOST,
      port: +DB_PORT,
      username: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_NAME,
      name: 'default',
      entities: [Category, OrderItem, Order, Payment, Product, User],
      synchronize: true,
    });

    console.log(datasource.entityMetadatasMap);
  });

  afterAll(async () => {
    await postgreSqlContainer.stop();
  });

  it('tests for something', () => {
    expect(true).toBe(true);
  });
});
