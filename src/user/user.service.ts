import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async getUser(email: string) {
    const result = await this.userRepository.findOne({
      where: { email },
    });

    return result;
  }

  async getAllUser() {
    const result = await this.userRepository.find();
    return result;
  }

  createUser(user): Promise<User> {
    return this.userRepository.save(user);
  }

  updateUserPassword(user, password: string): Promise<User> {
    user.password = password;
    user.updatedDate = new Date();

    return this.userRepository.save(user);
  }

  async validateUser(email: string, password: string) {
    const existedUser = await this.getUser(email);

    if (!existedUser) {
      return null;
    }
    const { password: hasedPassword, ...userInfo } = existedUser;

    if (bcrypt.compareSync(password, hasedPassword)) {
      return userInfo;
    }
    return null;
  }
}
