import {
  CanActivate,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class adminCheckGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const existedUser = await this.userService.getUser(request.body.email);

    if (!existedUser) {
      throw new HttpException(
        '정상적인 접근이 아닙니다.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (existedUser.role !== 'ADMIN') {
      throw new HttpException(
        '회원목록은 관리자만 조회할 수 있습니다.',
        HttpStatus.BAD_REQUEST,
      );
    } else {
      return true;
    }
  }
}
