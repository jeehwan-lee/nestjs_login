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

  async findAllUser(email: string) {
    if (!email) {
      throw new HttpException(
        '회원목록은 관리자만 조회할 수 있습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const validatedUser = await this.userService.getUser(email);

    if (!validatedUser || validatedUser.role == 'normal') {
      throw new HttpException(
        '회원목록은 관리자만 조회할 수 있습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existedAllUser = await this.userService.getAllUser();
    return existedAllUser;
  }

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

  async changePassword(email: string, password: string) {
    // TODO : token 인증 추가
    const existedUser = await this.userService.getUser(email);

    if (!existedUser) {
      throw new HttpException(
        '이메일이 존재하지 않습니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const encryptedPassword = bcrypt.hashSync(password, 10);

    try {
      const newUser = await this.userService.updateUserPassword(
        existedUser,
        encryptedPassword,
      );
      newUser.password = undefined;
      return newUser;
    } catch (error) {
      throw new HttpException('Internal Server Error', 500);
    }
  }

  async login(email: string, password: string) {
    const validatedUser = await this.userService.validateUser(email, password);

    if (!validatedUser) {
      // 계정 fail Count ++
      const failCount = await this.userService.increaseUserFailCount(email);

      // fail Count > 5 이면 계정 잠금
      if (failCount > 5) {
        await this.userService.inActiveUser(email);
      }
      throw new HttpException(
        '이메일과 비밀번호를 확인하세요.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 계정이 잠겼는지 확인
    if (validatedUser.status == 'inactive') {
      throw new HttpException('계정이 잠겨있습니다.', HttpStatus.BAD_REQUEST);
    }

    // 중복로그인 확인

    // fail Acount 0으로 초기화

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
