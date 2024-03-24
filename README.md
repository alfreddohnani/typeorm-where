# TypeORM-where

![test coverage badge](./coverage/coverage.svg)

## THE PROBLEM

Single-page applications (SPAs) usually require bespoke backend APIs. The problematic word in that sentence is "bespoke." I have worked as a backend developer in teams where the frontend developers ask for an API to be created for nearly all requirements. Such requirements were usually about filtering some data when given certain parameters. As you can imagine, this gets wearisome quickly, hence introducing friction between both teams.
What if I allowed the frontend developers to filter data on the backend to their hearts' content? That is why I wrote this library.

## IMPLEMENTATION

TypeORM's find methods take a where object whose filtering is limited to the "equals to" operator. Consequently, to give the frontend team total capacity to filter data, additional operations, including less than, more than, between, like, and not operations, among others, need to be available. To filter data, pass an object literal that describes how to filter records in the database. One can filter with the same object on the backend to avoid using the QueryBuilder for more complex queries. Let us take a look at how you would use it.

## USAGE

We will first see how Typeform-where is used in your backend project, which uses TypeORM, and subsequently see how to pass filters from the front end. There is not much of a difference. Let us assume we have the following entities for a fictional e-commerce app:

```typescript
@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  firsName: string;

  @Column({ type: 'varchar' })
  lastName: string;

  @Column({ type: 'varchar' })
  telephone: string;

  @Column({ type: 'integer' })
  age: number;

  @Column({ type: 'enum', enum: UserTitle })
  title: string;

  @OneToMany(() => Order, (order) => order.user, { nullable: true })
  orders?: Order[];

  @OneToMany(() => Payment, (payment) => payment.user, { nullable: true, onUpdate: 'CASCADE' })
  payments?: Payment[];

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}


@Entity({ name: 'products' })
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal' })
  price: number;

  @ManyToOne(() => Category, (category) => category.products, {
    cascade: true,
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  category?: Category;

  @Column({ type: 'varchar', array: true })
  tags: string[];

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}


@Entity({ name: 'payments' })
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Order, { cascade: true, onUpdate: 'CASCADE' })
  order: Order;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ManyToOne(() => User, (user) => user.payments, { cascade: true, onUpdate: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}


@Entity({ name: 'orders' })
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.orders, { cascade: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true, onUpdate: 'CASCADE', nullable: true })
  orderItems?: OrderItem[];

  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}


@Entity({ name: 'order_items' })
export class OrderItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  order: Order;

  @OneToOne(() => Product, { cascade: true, onUpdate: 'CASCADE' })
  product: Product;

  @Column({ type: 'integer' })
  quantity: number;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}


@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @OneToMany(() => Product, (product) => product.category, { nullable: true })
  products?: Product[];

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
```

We then create the following records:

```typescript
const user = await User.create({
      age: 22,
      firsName: 'Alfred',
      lastName: 'Doh-Nani',
      telephone: '+233544700089',
      title: UserTitle.MR,
    }).save();

   const anotherUser = await User.create({
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
```

We'll use the following operators to filter these records.

### EQUAL OPERATOR

On the backend:

```typescript
import {where} from 'typeorm-where';

const filter = where<User>({
        id: {
          $equal: user.id,
        },
      }),
    });

const res: User | null = await User.findOne({
         where: filter
      });

    expect(res).toBeDefined();
    expect(res?.id).toBe(user.id);
```

On the frontend:

```typescript
import type {Filter} from '~/utils'

const filter: Filter<User> = {
        id: {
          $equal: user.id,
        },
      };
await fetch(`/some/endpoint?filter=${JSON.stringify(filter)}`);

```

*NB*: When you stringify the filter object on the frontend, remember to parse it on the backend. All the frontend does is to send the filter object in the format above to the backend API. This is replicable for all the other operators we will see.

Where does the type `Filter` come from you ask?:

I didn't think the utility type `Filter` deserved a separate package. Although `typeorm-where` exports it, you shouldn't install the whole package in your frontend app just to use this utility type either.

Hence the immediate solution is to copy the following code and paste it in your utilities as I think of an easier way of doing this.

```typescript
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
  [P in keyof Entity]?: Entity[P] extends Array<Primitive> | Nullish
    ? NonNullable<TPartialOperatorMap<Primitive>>
    : Entity[P] extends Array<infer I> | Nullish
    ? Filter<I>
    : Entity[P] extends Record<any, any> | Nullish
    ? Filter<Entity[P]>
    : NonNullable<TPartialOperatorMap<Entity[P]>>;
};
```

### NOT OPERATOR

On the backend:

```typescript
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
```

### LESS THAN OPERATOR

On the backend:

```typescript
    const res: Product[] = await Product.find({
      where: where<Product>({
        price: {
          $lessThan: 60,
        },
      }),
    });

    expect(res.length).toBe(2);
```

### LESS THAN OR EQUAL OPERATOR

On the backend:

```typescript
    const res: Product[] = await Product.find({
      where: where<Product>({
        price: {
          $lessThanOrEqual: 60,
        },
      }),
    });

    expect(res.length).toBe(3);
```

### MORE THAN OPERATOR

On the backend:

```typescript
    const res: OrderItem[] = await OrderItem.find({
      where: where<OrderItem>({
        quantity: {
          $moreThan: 5,
        },
      }),
    });

    expect(res.length).toBe(3);
```

### MORE THAN OR EQUAL OPERATOR

On the backend:

```typescript
    const res: OrderItem[] = await OrderItem.find({
      where: where<OrderItem>({
        quantity: {
          $moreThanOrEqual: 5,
        },
      }),
    });

    expect(res.length).toBe(4);
```

### LIKE OPERATOR

On the backend:

```typescript
 const res: Product[] = await Product.find({
        where: where<Product>({
          name: {
            $like: 'geisha soap',
          },
        }),
      });
      expect(res.length).toBe(0);
    
```

```typescript
       const res: Product[] = await Product.find({
        where: where<Product>({
          name: {
            $like: 'Geisha Soap',
          },
        }),
      });
      expect(res.length).toBe(1);
      expect(res.at(0)?.name).toBe('Geisha Soap');
```

```typescript
       const res: Product[] = await Product.find({
        where: where<Product>({
          description: {
            $like: '%out%',
          },
        }),
      });
      expect(res.length).toBe(2);
```

### iLIKE OPERATOR

On the backend:

```typescript
const res: Product[] = await Product.find({
        where: where<Product>({
          name: {
            $ilike: 'gEisHa sOAp',
          },
        }),
      });

      expect(res.length).toBe(1);
      expect(res.at(0)?.name).toBe('Geisha Soap');
```

```typescript
      const res: Product[] = await Product.find({
        where: where<Product>({
          description: {
            $ilike: '%OuT%',
          },
        }),
      });
      expect(res.length).toBe(2);
```

### BETWEEN OPERATOR

On the backend:

*NB*: The between operator is both lower and upperbound inclusive. e.g, `between:[2, 5]` means `[2,3,4,5]`.

```typescript
    const res: OrderItem[] = await OrderItem.find({
      where: where<OrderItem>({
        quantity: {
          $between: [5, 12],
        },
      }),
    });
    expect(res.length).toBe(3);
```

### IN OPERATOR

On the backend:

```typescript
    const res: Product | null = await Product.findOne({
      where: where<Product>({
        name: {
          $in: ['Geisha Soap', 'Laptop', 'Smart Phone'],
        },
      }),
    });

    expect(res).toBeDefined();
    expect(res?.name).toBe('Geisha Soap');
```

### ANY OPERATOR

On the backend:

```typescript
    const res: Product[] = await Product.find({
      where: where<Product>({
        name: {
          $any: ['Geisha Soap', 'Laptop', 'Smart Phone'],
        },
      }),
    });
    expect(res.at(0)?.name).toBe('Geisha Soap');
```

### ARRAY CONTAINS OPERATOR

On the backend:

```typescript
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
```

### ARRAY CONTAINED BY OPERATOR

On the backend:

```typescript
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
```

### ARRAY OVERLAP OPERATOR

On the backend:

```typescript
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
```

### RAW OPERATOR

On the backend:

```typescript
    const res: Product[] = await Product.find({
      where: where<Product>({
        price: {
          $raw: 40,
        },
      }),
    });

    expect(res.length).toBe(1);
```

### OR CONDITION

To filter where you expect the results to be either of the filters, pass an array of filter objects.

On the backend:

```typescript
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
```

### NESTED RELATION FILTER

You can filter based on subrelations of an entity.

On the backend:

```typescript
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
```

### IS NULL OPERATOR

You can filter based on the absence of value of a particular column.

On the backend:

```typescript
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
```
