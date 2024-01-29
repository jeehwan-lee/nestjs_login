import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id?: number;

  @ApiProperty({
    example: 'Jeehwan@naver.com',
    description: '사용자 이메일',
    required: true,
  })
  @IsEmail()
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '사용자 비밀번호',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Column()
  password: string;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ default: 0 })
  failCount: number;

  @Column({ default: 'MEMBER' })
  role: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createDate: Date = new Date();

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date = new Date();
}
