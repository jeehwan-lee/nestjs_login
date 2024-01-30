import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  User,
  UserEmail,
  UserEmailAndToken,
  UserInfo,
} from 'src/user/user.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { adminCheckGuard } from './auth.guard';

@ApiTags('API 목록')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: '회원가입 API',
    description: '이메일과 비밀번호를 입력받아 회원가입합니다.',
  })
  @Post('register')
  async register(@Body() user: User) {
    return await this.authService.register(user);
  }

  @ApiOperation({
    summary: '로그인 API',
    description: '이메일과 비밀번호를 입력받아 로그인합니다.',
  })
  @Post('login')
  async login(@Body() userInfo: UserInfo) {
    return await this.authService.login(userInfo.email, userInfo.password);
  }

  @ApiOperation({
    summary: '로그아웃 API',
    description: '이메일 통해 로그아웃을 합니다.',
  })
  @Post('logout')
  async logout(@Body() userEmail: UserEmail) {
    return await this.authService.logout(userEmail.email);
  }

  @ApiOperation({
    summary: '비밀번호 변경 API',
    description: '이메일과 새로운 비밀번호를 입력받아 비밀번호를 변경합니다.',
  })
  @Post('changePw')
  async changePassword(@Body() userInfo: UserInfo) {
    return await this.authService.changePassword(
      userInfo.email,
      userInfo.password,
    );
  }

  @ApiOperation({
    summary: '토큰 재발급 API',
    description: 'Refresh 토큰을 통해 Access 토큰을 재발급합니다.',
  })
  @Post('token')
  async createAccessToken(@Body() userEmailAndToken: UserEmailAndToken) {
    return await this.authService.createAccessToken(
      userEmailAndToken.email,
      userEmailAndToken.refreshToken,
    );
  }

  @ApiOperation({
    summary: '잠긴 계정 해제 API',
    description: '로그인을 5회 실패해서 잠긴 계정을 해제합니다.',
  })
  @Post('unLockUser')
  async unlockUser(@Body() userInfo: UserInfo) {
    return await this.authService.unLockUserAccount(
      userInfo.email,
      userInfo.password,
    );
  }

  @ApiOperation({
    summary: '회원목록 조회 API',
    description:
      '회원목록 조회 API로 관리자 권한을 갖는 계정만 조회할 수 있습니다.',
  })
  @UseGuards(adminCheckGuard)
  @Get('user')
  async findAllUser() {
    return await this.authService.findAllUser();
  }
}
