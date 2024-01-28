import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/user/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() user: User) {
    return await this.authService.register(user);
  }

  @Post('login')
  async login(@Request() req) {
    return await this.authService.login(req.body.email, req.body.password);
  }

  @Post('logout')
  async logout(@Request() req) {
    return await this.authService.logout(req.body.email);
  }

  @Post('changePw')
  async changePassword(@Request() req) {
    return await this.authService.changePassword(
      req.body.email,
      req.body.password,
    );
  }

  @Get('user')
  async findAllUser(@Query('email') email: string) {
    // TODO : admin으로 인증하는방법 다시
    return await this.authService.findAllUser(email);
  }

  @Post('token')
  async createAccessToken(@Request() req) {
    return await this.authService.createAccessToken(
      req.body.email,
      req.body.refreshToken,
    );
  }
}
