## Problem

Due to the limited support for generic types especially in graphql, it becomes difficult to write generic DTOs(data transfer objects) or generic input types.

Consider the following example using nestjs:

*entities/organisation.entity.ts*

```typescript
@Entity({
  name: 'organisations',
})
export class OrganisationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 200,
    unique: true,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 200,
    unique: true,
    nullable: true,
  })
  registrationNumber?: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  address?: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  numberOfEmployees: string;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  countryOfOperation: string;

  @Column({
    type: 'varchar',
    nullable: true,
    length: 150,
    unique: true,
  })
  email: string;

  @Column({
    type: 'enum',
    nullable: true,
    enum: OrganisationTypeEnum,
  })
  organisationType?: OrganisationTypeEnum;

  @CreateDateColumn({ nullable: true })
  createdAt?: string;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: string;

  @Column({
    type: 'varchar',
  })
  ownerId: string;
}
```

The type `FindOptionsWhere` for find operations in typeorm:

```typescript
export declare type FindOptionsWhere<Entity> = {
    [P in keyof Entity]?: FindOptionsWhereProperty<NonNullable<Entity[P]>>;
};
```

Assuming we use this to create a `FindOrganisation` DTO:

```typescript
class FindOrganisationDTO implements FindOptionsWhere<OrganisationEntity> {
  @Field(() => !D, {nullable: true})
  id?: string;

  @Field(() => String, {nullable: true})
  name?: string;

  @Field(() => String, {nullable: true})
  registrationNumber?: string;

  @Field(() => String, {nullable: true})
  address?: string;

  @Field(() => String, {nullable: true})
  numberOfEmployees?: string;

  @Field(() => String, {nullable: true})
  countryOfOperation?: string;

  @Field(() => String, {nullable: true})
  email?: string;

  @Field(() => String, {nullable: true})
  organisationType?: OrganisationTypeEnum;

  @Field(() => String, {nullable: true})
  createdAt?: string;

  @Field(() => String, {nullable: true})
  updatedAt?: string;

  @Field(() => ID, {nullable: true})
  ownerId: string;
}

```

The DTO class above would work for simple filters. Even then you have the following problems to name a few:

* If the`OrganisationEntity` changes, you'd have to update it in the DTO as well
* What if you entity was way larger?
* What about advanced filters like`between` or`in` ? How do you type those in graphql

## Solution

With this package you could provide an input resembling this in graphl:

```json
{
  "getOrganisationsDto": {
    "paginateOptions": {
      "page": 1,
      "limit": 10
    },
    "findOptions": {
     "where": {
       "logicalOperator": "AND",
      "filters":{
        "fields": ["numberOfEmployees"],
        "operators": ["Between"],
        "values":["[100,1000]"]
      }
    }
    }
  }
}
```

and have nice advanced filtering in typeorm.

*Note*: This is not limited only to graphql. You can convert the object above to a query parameter in rest-apis.

## Usage

1. Write the following input types in `src/lib/filter.ts`:

   ```typescript
   import { Field, InputType, registerEnumType } from '@nestjs/graphql';
   import {
     IsArray,
     IsDefined,
     IsIn,
     IsOptional,
     IsString,
     ValidateNested,
   } from 'class-validator';
   import { getEnumKeys } from 'src/shared/utils';
   import { Type } from 'class-transformer';
   import {
     TOrderDirection,
     LogicalOperator,
     ConditionalOperator,
     Filter,
     OrderBy,
     FilterMember,
   } from 'typeorm-advanced-filter-util';

   registerEnumType(ConditionalOperator, {
     name: 'ConditionalOperator',
   });
   registerEnumType(LogicalOperator, {
     name: 'LogicalOperator',
   });

   @InputType()
   export class FilterMemberDto implements FilterMember {
     @Field(() => [String])
     @IsDefined()
     @IsArray()
     fields: string[];

     @Field(() => [String])
     @IsDefined()
     @IsArray()
     values: string[];

     @Field(() => [ConditionalOperator])
     @IsDefined()
     @IsArray()
     operators: ConditionalOperator[];
   }

   @InputType()
   export class FilterDto implements Filter {
     @Field(() => LogicalOperator)
     @IsDefined()
     @IsString()
     @IsIn(getEnumKeys(LogicalOperator))
     logicalOperator: LogicalOperator;

     @Field(() => [FilterMemberDto])
     @IsDefined()
     @IsArray()
     filters: FilterMemberDto[];
   }

   @InputType()
   export class OrderByDto implements OrderBy {
     @Field(() => [String])
     @IsDefined()
     @IsArray()
     fields: string[];

     @Field(() => [String])
     @IsDefined()
     @IsArray()
     values: TOrderDirection[];
   }

   @InputType()
   export class FindOptionsDto {
     @Field(() => FilterDto, { nullable: true })
     @IsOptional()
     @ValidateNested({ each: true })
     @Type(() => FilterDto)
     where?: Filter;

     @Field(() => OrderByDto, { nullable: true })
     @IsOptional()
     @ValidateNested({ each: true })
     @Type(() => OrderByDto)
     order?: OrderByDto;
   }

   export { ConditionalOperator, LogicalOperator };
   ```

*Note*: Import `ConditionalOperator` and `LogicalOperator` from your code's `src/lib/filter.ts` in your `controllers/resolvers/services/etc`. This is because you've registered them in `src/lib/filter.ts` using `registerEnumType`(nestjs code-first approach). Therefore the metadata are associated with these. Hence importing them from `'typeorm-advanced-filter-util'` and re-registering them elsewhere in your code will cause nestjs graphql to throw a duplicate type error.

*Note*: We used `class-valdiator` and `class-transformer` for validation



2. In`dto/get-organisations.dto.ts`:

```typescript
import { FindOptionsDto } from 'src/lib/filter.ts';
import {
InputType,
Field
} from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidateNested, IsOptional } from 'class-validator';


@InputType()
export class GetOrganisationsDto {
  @ValidateNested({ each: true })
  @Type(() => PaginationOptionsDto)
  @Field(() => PaginationOptionsDto)
  paginateOptions: PaginationOptionsDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FindOptionsDto)
  @Field(() => FindOptionsDto, { nullable: true })
  findOptions?: FindOptionsDto;
}
```

The `PaginationOptionsDto` was crafted with `Pagination` from `nestjs-typeorm-paginate`


3. In`organisation.resolver.ts`

```typescript
 @Query((_returns) => GetOrganisationsResponseDto)
 public async getOrganisations(
   @Args('getOrganisationsDto')
   getOrganisationsDto: GetOrganisationsDto,
 ): Promise<GetOrganisationsResponseDto> {

   return this.organisationSvc.getOrganisations(getOrganisationsDto);
 }
```



4. In`organisation.service.ts`

```typescript
import { buildWhere, Filter , OrderBy, buildOrder} from 'typeorm-advanced-filter-util';
import { FindManyOptions, Repository } from 'typeorm';
import {
paginate,
IPaginationOptions,
IPaginationMeta,
} from 'nestjs-typeorm-paginate';


public async getOrganisations(
   data: GetOrganisationsDto,
 ): Promise<GetOrganisationsResponseDto> {
   try {
     const { paginateOptions, findOptions } = data;
     const paginationOptions: IPaginationOptions<IPaginationMeta> = {
       ...(paginateOptions as IPaginationOptions),
       route: '/organisation',
     };
     const searchOptions: FindManyOptions<OrganisationEntity> = {
       where: findOptions?.where ? buildWhere(<Filter>findOptions.where) : {},
       order: findOptions?.order
         ? buildOrder(<OrderBy>findOptions?.order)
         : {},
     };
     const organisations = await paginate<OrganisationEntity>(
       this.repository,
       paginationOptions,
       searchOptions,
     );

     return {
       error: [],
       status: HttpStatus.OK,
       organisations: getStruct(organisations),
     };
   } catch (error) {
     return {
       error: [],
       status: HttpStatus.INTERNAL_SERVER_ERROR,
       organisations: null,
     };
   }
 }
```

Notice we used `nestjs-typeorm-paginate` for pagination but you can use whatever applies in your implementation.


## Logical Operators

### Making an `AND` filter query/request



```typescript
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
```





### Making an `OR` filter query/request



```typescript
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
```



### Making an `AND OR` filter query/request

const mockFilterInput: Filter = {

```typescript
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
```


*Note*:  For array types like between, in, etc, make sure to JSON.stringify the array.

Issues, contributions etc are welcome. Thanks 😉
