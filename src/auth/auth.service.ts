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

  async findAllUser() {
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
    // TOKEN 인증을 통해 현재 접속한 사용자인지 검증
    const userExistedRefreshToken =
      await this.tokenService.getRefreshTokenByEmail(email);

    if (!userExistedRefreshToken) {
      throw new HttpException('로그인이 필요합니다.', HttpStatus.BAD_REQUEST);
    }

    // 유효한 토큰인지 검증
    await this.tokenService.verifyRefreshToken(
      userExistedRefreshToken.refreshToken,
    );

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
      // 비밀번호 검증에 실패했을 경우

      const existedUser = await this.userService.getUser(email);

      // 계정이 존재하지 않을 경우
      if (!existedUser) {
        throw new HttpException(
          '가입되지 않은 이메일입니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // User의 fail Count 데이터 증가
      const failCount = await this.userService.increaseUserFailCount(email);

      // fail Count >= 5 이면 계정 잠금
      if (failCount >= 5) {
        await this.userService.inActivateUserAccount(email);

        throw new HttpException(
          '로그인 시도 횟수 5회 초과로 계정이 잠겼습니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        `이메일과 비밀번호를 확인하세요. (로그인 실패 횟수 : ${failCount})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 계정이 잠겼는지 확인
    if (validatedUser.status == 'INACTIVE') {
      throw new HttpException('계정이 잠겨있습니다.', HttpStatus.BAD_REQUEST);
    }

    // 중복로그인 확인
    const userExistedRefreshToken =
      await this.tokenService.getRefreshTokenByEmail(validatedUser.email);

    if (userExistedRefreshToken) {
      throw new HttpException(
        '이미 로그인 되어있는 사용자입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // User의 fail Acount 0으로 초기화
    await this.userService.resetUserFailCount(email);

    const accessToken = await this.tokenService.signAccessToken(email);
    const refreshToken = await this.tokenService.signRefreshToken(email);

    // 현재 로그인한 사용자의 refresh Token을 DB에 저장
    await this.tokenService.createRefreshToken({
      email: email,
      refreshToken: refreshToken,
      createDate: undefined,
      updatedDate: undefined,
      deletedDate: undefined,
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async logout(email: string) {
    const userExistedRefreshToken =
      await this.tokenService.getRefreshTokenByEmail(email);

    // token DB에 저장되어 있지 않는 사용자의 토큰일 경우
    if (!userExistedRefreshToken) {
      throw new HttpException(
        '로그인되어 있지 않은 사용자입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.tokenService.delelteRefreshToken(
      userExistedRefreshToken.refreshToken,
    );
  }

  async createAccessToken(email: string, refreshToken: string) {
    const existedToken =
      await this.tokenService.getRefreshTokenByToken(refreshToken);

    if (!existedToken) {
      throw new HttpException(
        '유효한 토큰이 아닙니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 유효한 토큰인지 검증
    await this.tokenService.verifyRefreshToken(refreshToken);

    // refreshToken 유효기간 갱신
    const newAccessToken = this.tokenService.signAccessToken(email);
    const newRefreshToken = this.tokenService.signRefreshToken(email);

    // 현재 로그인한 사용자의 새로 발급된 refresh Token으로 DB에 저장
    await this.tokenService.updateRefreshToken(email, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: refreshToken };
  }

  async unLockUserAccount(email: string, password: string) {
    const validatedUser = await this.userService.validateUser(email, password);

    if (!validatedUser) {
      // 비밀번호 검증에 실패했을 경우
      throw new HttpException(
        '이메일과 비밀번호를 확인하세요.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // User DB의 status 컬럼의 값을 active로 수정
    await this.userService.activateUserAccount(email);

    // User의 fail Acount 0으로 초기화
    await this.userService.resetUserFailCount(email);
  }
}
