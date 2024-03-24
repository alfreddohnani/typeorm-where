import { DataSource } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { User, UserTitle } from './tests/utils/entities/user.entity';
import { Product } from './tests/utils/entities/product.entity';
import { Category } from './tests/utils/entities/category.entity';
import { Order, OrderStatus } from './tests/utils/entities/order.entity';
import { OrderItem } from './tests/utils/entities/order-item.entity';
import { Payment, PaymentMethod, PaymentStatus } from './tests/utils/entities/payment.entity';
import { where } from './where-builder';

describe('TypeORM where filter util tests', () => {
  jest.setTimeout(1000 * 60 * 1);

  let postgreSqlContainer: StartedPostgreSqlContainer;
  let db: DataSource;
  let user: User;
  let anotherUser: User;

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

    // initialize db
    db = await new DataSource({
      type: 'postgres',
      host: DB_HOST,
      port: +DB_PORT,
      username: DB_USERNAME,
      password: DB_PASSWORD,
      database: DB_NAME,
      name: 'default',
      entities: ['src/**/*.entity.{ts,js}'],
      synchronize: true,
    }).initialize();

    // persist test data
    user = await User.create({
      age: 22,
      firsName: 'Alfred',
      lastName: 'Doh-Nani',
      telephone: '+233544700089',
      title: UserTitle.MR,
    }).save();

    anotherUser = await User.create({
      age: 22,
      firsName: 'Mary',
      lastName: 'Kwawu',
      telephone: '+233544700088',
      title: UserTitle.MR,
    }).save();

    const category = await Category.create({
      name: 'Accesories',
    }).save();
    const products = Product.create([
      {
        name: 'Electric Toothbrush',
        description: 'An ultra modern electric toothbrush with tough bristles that yank your teeth out',
        price: 40.0,
        category,
        tags: ['home', 'accesories', 'bathroom', 'household'],
      },
      {
        name: 'Geisha Soap',
        description: 'Soap for clean skins',
        price: 50.0,
        category,
        tags: ['home', 'disinfectants', 'chemicals', 'lathers', 'smells good'],
      },
      {
        name: 'Umbra Umbrella',
        description: 'Need to go out on a rainy day?',
        price: 60,
        tags: ['rain', 'rainy days', 'cover', 'shiny days', 'water'],
      },
    ]);

    const [toothbrush, soap, umbrella] = await Product.save(products);
    const firstOrder = await Order.create({
      user,
      status: OrderStatus.PENDING,
      orderItems: OrderItem.create([
        {
          product: toothbrush,
          quantity: 2,
        },
        {
          product: soap,
          quantity: 10,
        },
        {
          product: umbrella,
          quantity: 1,
        },
      ]),
    }).save();

    const secondOrder = await Order.create({
      user,
      status: OrderStatus.PENDING,
      orderItems: OrderItem.create([
        {
          product: toothbrush,
          quantity: 12,
        },
      ]),
    }).save();

    const thirdOrder = await Order.create({
      user,
      status: OrderStatus.PENDING,
      orderItems: OrderItem.create([
        {
          product: toothbrush,
          quantity: 1,
        },
        {
          product: soap,
          quantity: 5,
        },
        {
          product: umbrella,
          quantity: 34,
        },
      ]),
    }).save();

    const payments = Payment.create([
      {
        order: { id: firstOrder.id },
        paymentMethod: PaymentMethod.MOMO,
        paymentStatus: PaymentStatus.PENDING,
        user,
      },
      {
        order: { id: firstOrder.id },
        paymentMethod: PaymentMethod.MASTERCARD,
        paymentStatus: PaymentStatus.PENDING,
        user,
      },
      {
        order: { id: firstOrder.id },
        paymentMethod: PaymentMethod.VISA,
        paymentStatus: PaymentStatus.PENDING,
        user,
      },
      {
        order: { id: secondOrder.id },
        paymentMethod: PaymentMethod.VISA,
        paymentStatus: PaymentStatus.FAILED,
        user,
      },
      {
        order: { id: thirdOrder.id },
        paymentMethod: PaymentMethod.MOMO,
        paymentStatus: PaymentStatus.SUCCESS,
        user,
      },
    ]);

    await Payment.save(payments);
  });

  afterAll(async () => {
    await postgreSqlContainer.stop();
    await db.destroy();
  });

  it('throws TypeORM error when the filter is null or undefined', async () => {
    expect(user).toBeDefined();
    expect(anotherUser).toBeDefined();

    try {
      const res: User | null = await User.findOne({
        where: where<User>(null as any),
      });
      expect(res).toBeUndefined();
    } catch (error) {
      expect((error as Error).message).toBe('You must provide selection conditions in order to find a single row.');
    }
  });

  it('$equal operator', async () => {
    const res: User | null = await User.findOne({
      where: where<User>({
        id: {
          $equal: user.id,
        },
      }),
    });
    expect(res).toBeDefined();
    expect(res?.id).toBe(user.id);
  });

  it('$not operator', async () => {
    const res: User[] | null = await User.find({
      where: where<User>({
        firsName: {
          $not: {
            $equal: 'Alfred',
          },
        },
      }),
    });

    expect(res.length).toBe(1);
    expect(res.at(0)?.id).toBe(anotherUser.id);
  });

  it('$lessThan operator', async () => {
    const res: Product[] = await Product.find({
      where: where<Product>({
        price: {
          $lessThan: 60,
        },
      }),
    });

    expect(res.length).toBe(2);
  });

  it('$lessThanOrEqual operator', async () => {
    const res: Product[] = await Product.find({
      where: where<Product>({
        price: {
          $lessThanOrEqual: 60,
        },
      }),
    });

    expect(res.length).toBe(3);
  });

  it('$moreThan operator', async () => {
    const res: OrderItem[] = await OrderItem.find({
      where: where<OrderItem>({
        quantity: {
          $moreThan: 5,
        },
      }),
    });

    expect(res.length).toBe(3);
  });

  it('$moreThanOrEqual operator', async () => {
    const res: OrderItem[] = await OrderItem.find({
      where: where<OrderItem>({
        quantity: {
          $moreThanOrEqual: 5,
        },
      }),
    });

    expect(res.length).toBe(4);
  });
  describe('$like operator', () => {
    it('returns no results when text case is different', async () => {
      const res: Product[] = await Product.find({
        where: where<Product>({
          name: {
            $like: 'geisha soap',
          },
        }),
      });
      expect(res.length).toBe(0);
    });

    it('returns results when text case is thesame', async () => {
      const res: Product[] = await Product.find({
        where: where<Product>({
          name: {
            $like: 'Geisha Soap',
          },
        }),
      });
      expect(res.length).toBe(1);
      expect(res.at(0)?.name).toBe('Geisha Soap');
    });

    it('returns result when given part of the full text', async () => {
      const res: Product[] = await Product.find({
        where: where<Product>({
          description: {
            $like: '%out%',
          },
        }),
      });

      expect(res.length).toBe(2);
    });
  });

  describe('$ilike operator', () => {
    it('returns result when given full case insensitive text', async () => {
      const res: Product[] = await Product.find({
        where: where<Product>({
          name: {
            $ilike: 'gEisHa sOAp',
          },
        }),
      });

      expect(res.length).toBe(1);
      expect(res.at(0)?.name).toBe('Geisha Soap');
    });

    it('returns result for part of the text', async () => {
      const res: Product[] = await Product.find({
        where: where<Product>({
          description: {
            $ilike: '%OuT%',
          },
        }),
      });
      expect(res.length).toBe(2);
    });
  });

  it('$between operator', async () => {
    const res: OrderItem[] = await OrderItem.find({
      where: where<OrderItem>({
        quantity: {
          $between: [5, 12],
        },
      }),
    });
    expect(res.length).toBe(3);
  });

  it('$in operator', async () => {
    const res: Product | null = await Product.findOne({
      where: where<Product>({
        name: {
          $in: ['Geisha Soap', 'Laptop', 'Smart Phone'],
        },
      }),
    });

    expect(res).toBeDefined();
    expect(res?.name).toBe('Geisha Soap');
  });

  it('$any operator', async () => {
    const res: Product[] = await Product.find({
      where: where<Product>({
        name: {
          $any: ['Geisha Soap', 'Laptop', 'Smart Phone'],
        },
      }),
    });
    expect(res.at(0)?.name).toBe('Geisha Soap');
  });

  it('$arrayContains operator', async () => {
    const res1: Product[] = await Product.find({
      where: where<Product>({
        tags: {
          $arrayContains: ['home'],
        },
      }),
    });
    expect(res1.length).toBe(2);

    const res2: Product[] = await Product.find({
      where: where<Product>({
        tags: {
          $arrayContains: ['rain'],
        },
      }),
    });
    expect(res2.length).toBe(1);

    const res3: Product[] = await Product.find({
      where: where<Product>({
        tags: {
          $arrayContains: ['home', 'rain'],
        },
      }),
    });
    expect(res3.length).toBe(0);
  });

  it('$arrayContainedBy operator', async () => {
    const res1: Product[] = await Product.find({
      where: where<Product>({
        tags: {
          $arrayContainedBy: ['home', 'accesories', 'bathroom', 'household', 'electronics', 'hardware', 'sofware'],
        },
      }),
    });
    expect(res1.length).toBe(1);
    expect(res1.at(0)?.name).toBe('Electric Toothbrush');

    const res2: Product[] = await Product.find({
      where: where<Product>({
        tags: {
          $arrayContainedBy: ['home'],
        },
      }),
    });
    expect(res2.length).toBe(0);
  });

  it('$arrayOverlap operator', async () => {
    const res1: Product[] = await Product.find({
      where: where<Product>({
        tags: {
          $arrayOverlap: ['bathroom', 'rain', 'electronics', 'hardware', 'sofware'],
        },
      }),
    });
    expect(res1.length).toBe(2);

    const res2: Product[] = await Product.find({
      where: where<Product>({
        tags: {
          $arrayOverlap: ['rain', 'cover', 'electronics', 'hardware', 'sofware'],
        },
      }),
    });
    expect(res2.length).toBe(1);
    expect(res2.at(0)?.name).toBe('Umbra Umbrella');

    const res3: Product[] = await Product.find({
      where: where<Product>({
        tags: {
          $arrayOverlap: ['electronics', 'hardware', 'sofware'],
        },
      }),
    });
    expect(res3.length).toBe(0);
  });

  it('$raw operator', async () => {
    const res: Product[] = await Product.find({
      where: where<Product>({
        price: {
          $raw: 40,
        },
      }),
    });

    expect(res.length).toBe(1);
  });

  it('or condition', async () => {
    const res: Product[] = await Product.find({
      where: where<Product>([
        {
          description: {
            $ilike: '%bristles%',
          },
        },
        {
          description: {
            $ilike: '%rainy day%',
          },
        },
      ]),
    });

    expect(res.length).toBe(2);
  });

  it('nested relation filter', async () => {
    const res: Order[] = await Order.find({
      where: where<Order>({
        orderItems: {
          quantity: {
            $moreThan: 10,
          },
        },
      }),
      relations: {
        orderItems: true,
      },
    });

    expect(res.length).toBe(2);
  });

  it('$isNull operator', async () => {
    const res: User[] = await User.find({
      where: where<User>({
        orders: {
          id: {
            $isNull: null,
          },
        },
      }),
    });

    expect(res.length).toBe(1);
    expect(res.at(0)?.firsName).toBe('Mary');
  });
});
