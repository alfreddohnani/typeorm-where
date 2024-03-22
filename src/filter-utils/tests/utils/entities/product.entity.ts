import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity({ name: 'products' })
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'double' })
  price: number;

  @ManyToOne(() => Category, (category) => category.products, {
    cascade: true,
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  category?: Category;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
