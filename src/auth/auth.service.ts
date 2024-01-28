import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
  ) {}

  async register(user: User) {
    const existedUser = await this.userService.getUser(user.email);

    if (existedUser) {
      throw new HttpException(
        '이미 존재하는 이메일입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const encryptedPassword = bcrypt.hashSync(user.password, 10);

    try {
      const newUser = await this.userService.createUser({
        ...user,
        password: encryptedPassword,
      });
      newUser.password = undefined;
      return newUser;
    } catch (error) {
      throw new HttpException('Internal Server Error', 500);
    }
  }

  async login(email: string, password: string) {
    const validatedUser = await this.userService.validateUser(email, password);

    if (!validatedUser) {
      throw new HttpException(
        '이메일과 비밀번호를 확인하세요.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const accessToken = await this.tokenService.signAccessToken(email);
    const refreshToken = await this.tokenService.signRefreshToken(email);

    await this.tokenService.createRefreshToken({
      email: email,
      refreshToken: refreshToken,
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }
}
