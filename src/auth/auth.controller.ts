import { Body, Controller, Get, Post, Request } from '@nestjs/common';
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

  @Post('changePw')
  async changePassword(@Request() req) {
    return await this.authService.changePassword(
      req.body.email,
      req.body.password,
    );
  }

  @Get('user')
  async findAllUser() {
    return await this.authService.findAllUser();
  }
}
