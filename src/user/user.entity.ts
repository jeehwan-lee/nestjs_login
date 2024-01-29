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

  @ApiProperty({
    example: 'MEMBER | ADMIN',
    default: 'MEMBER',
    description: '계정 권한',
    required: false,
  })
  @Column({ default: 'MEMBER' })
  role: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createDate: Date = new Date();

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date = new Date();
}

export class UserInfo {
  @ApiProperty({
    example: 'Jeehwan@naver.com',
    description: '사용자 이메일',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: '사용자 비밀번호',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserEmail {
  @ApiProperty({
    example: 'Jeehwan@naver.com',
    description: '사용자 이메일',
    required: true,
  })
  @IsEmail()
  email: string;
}

export class UserEmailAndToken {
  @ApiProperty({
    example: 'Jeehwan@naver.com',
    description: '사용자 이메일',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluQGFkbWluLmNvbSIsImlhdCI6MTcwNjUzNzY4MCwiZXhwIjoxNzA2NjI0MDgwfQ.EoswLiBiiibw82SXzrpoPyt9DRO5zBMV8ZGK1xjspYk',
    description: '로그인한 사용자의 Refresh 토큰',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
