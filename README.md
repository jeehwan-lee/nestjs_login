1. api swagger로 하나 만들어두기
   -> 모든 유저 조회는 swagger로 불가
   -> req body 안에 email이 필요
2. admin@admin.com / admin
3. softDelete를 통한 refreshToken 삭제
4. typescript 적용
5. 권한 : MEMBER / ADMIN
6. 잠금해제 API 추가

# NestJS를 활용한 사용자 인증과 권한 관리시스템 구현

이 프로젝트는 NestJS를 활용해 사용자의 회원가입, 로그인, 비밀번호 변경을 처리하는 API를 구현하고 

JWT를 사용한 토큰 기반의 인증 시스템을 구축합니다.


## 목차

- [설치 및 실행방법](#설치-및-실행방법)

- [구현 내용](#구현-내용)

- [구조 및 설계](#구조-및-설계)

   - [프로젝트 구조](#1-프로젝트-구조)
 
   - [DB 설계](#2-DB-설계)

- [코드 설명](#코드-설명)

- [회고](#회고)


## 설치 및 실행방법

1. Install Dependencies

```
npm install
```

2. NestJS 서버 실행

```
npm run start
```

3. 서버 접속 주소
   
```
http://localhost:3000
```

4. Swagger API를 통한 실행
   
   아래 URL을 통해 Swagger API를 통해 API 예시를 확인하고 실행할 수 있습니다.

   다만, 관리자 권한 인증이 필요한 '회원목록 조회 API'의 경우 별도의 방법(Postman 사용)이 필요합니다.

```
http://lolcahost:3000/api
```

5. 테스트 계정

   - 관리자 : admin@admin.com / admin

   - 일반 사용자 : jeehwan@naver.com / 123456


## 구현 내용

1. 회원가입 API

   - 이메일과 비밀번호를 입력받아 회원가입을 합니다.
  
   - 이메일 중복검사를 합니다.
  
   - 비밀번호는 암호화된 방식으로 데이터베이스에 저장됩니다.

2. 로그인 API

   - 이메일과 비밀번호를 입력받아 로그인합니다.
  
   - 로그인 성공 시 JWT 토큰(Access 토큰, Refresh 토큰)을 발급합니다.
  
   - 추가적으로 로그아웃 API를 통해 현재 계정을 로그아웃 할 수 있습니다.
  
3. 비밀번호 변경 API

   - 로그인한 사용자는 이메일과 비밀번호를 입력받아 비밀번호를 변경할 수 있습니다.
  
   - 새로운 비밀번호는 암호화된 방식으로 데이터베이스에 저장됩니다.
  
4. 회원 목록 조회 API

   - 현재 가입된 회원 목록을 조회할 수 있습니다.
  
   - 관리자 권한을 갖는 계정만 회원 목록을 조회할 수 있습니다.
  
5. Refresh 토큰을 사용한 토큰 재발급 기능

   - 토큰 재발급 API를 통해 유효한 Refresh 토큰을 통해 Access 토큰을 재발급 받을 수 있습니다.
     
6. 로그인 시도 제한 기능(최대 5회)

   - 로그인을 5번 실패할 경우 해당 계정이 잠기게 됩니다.
  
   - 추가적으로 잠긴 계정을 해제하는 API를 통해 잠긴 상태의 계정을 풀 수 있습니다.
     
7. 중복 로그인 방지 기능

   - 현재 접속중인 계정은 중복으로 로그인할 수 없습니다.

     
## 구조 및 설계

### 1. 프로젝트 구조

```bash
├── app.js
├── config
│   ├── db.js
│   └── handlebars_helpers.js
├── controllers
│   ├── post_controller.js
│   └── refly_controller.js
├── routes
│   ├── post.js
│   └── refly.js
├── services
│   ├── post_service.js
│   └── refly_service.js
├── views
│   ├── layouts
│       └── main.handlebars
│   ├── detail.handlebars
│   ├── home.handlebars
│   ├── modify.handlebars
│   └── write.handlebars
└── public
```

### 2. DB 설계
