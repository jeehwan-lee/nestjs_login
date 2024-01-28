import { Body, Controller, Post, Request, Response } from '@nestjs/common';
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
    console.log(req.body.email);
    return await this.authService.login(req.body.email, req.body.password);
  }
}
