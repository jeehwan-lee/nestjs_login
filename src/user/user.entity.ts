import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id?: number;

  @IsEmail()
  @Column({ unique: true })
  email: string;

  @IsString()
  @IsNotEmpty()
  @Column()
  password: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createDate: Date = new Date();

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date = new Date();

  @Column({ default: 'active' })
  status: string;

  @Column({ default: 0 })
  failCount: number;

  @Column({ default: 'normal' })
  role: string;
}
