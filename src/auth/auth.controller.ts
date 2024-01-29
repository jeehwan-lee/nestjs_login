import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/user/user.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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
  async login(@Request() req) {
    return await this.authService.login(req.body.email, req.body.password);
  }

  @ApiOperation({
    summary: '로그아웃 API',
    description: '이메일 통해 로그아웃을 합니다.',
  })
  @Post('logout')
  async logout(@Request() req) {
    return await this.authService.logout(req.body.email);
  }

  @ApiOperation({
    summary: '비밀번호 변경 API',
    description: '이메일과 새로운 비밀번호를 입력받아 비밀번호를 변경합니다.',
  })
  @Post('changePw')
  async changePassword(@Request() req) {
    return await this.authService.changePassword(
      req.body.email,
      req.body.password,
    );
  }

  @ApiOperation({
    summary: '회원목록 조회 API',
    description:
      '회원목록 조회 API로 관리자 권한을 갖는 계정만 조회할 수 있습니다.',
  })
  @Get('user')
  async findAllUser(@Query('email') email: string) {
    // TODO : admin으로 인증하는방법 다시 (Guard?)
    return await this.authService.findAllUser(email);
  }

  @ApiOperation({
    summary: '토큰 재발급 API',
    description: 'Refresh 토큰을 통해 Access 토큰을 재발급합니다.',
  })
  @Post('token')
  async createAccessToken(@Request() req) {
    return await this.authService.createAccessToken(
      req.body.email,
      req.body.refreshToken,
    );
  }

  @ApiOperation({
    summary: '잠긴 계정 해제 API',
    description: '로그인 5회 실패 후 잠긴 계정을 해제합니다.',
  })
  @Post('unLockUser')
  async unlockUser(@Request() req) {
    return await this.authService.unLockUserAccount(
      req.body.email,
      req.body.password,
    );
  }
}
