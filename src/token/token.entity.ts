import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  email: string;

  @Column()
  refreshToken: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createDate: Date = new Date();

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date = new Date();

  @DeleteDateColumn()
  deletedDate!: Date | null;
}
