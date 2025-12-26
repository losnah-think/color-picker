import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Email과 password를 입력해주세요',
        },
        { status: 400 }
      );
    }

    console.log('🔍 로그인 테스트 시작:', { email });

    // 1. 사용자 찾기
    console.log('1️⃣ 사용자 검색 중...');
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!user) {
      console.log('❌ 사용자 없음:', email);
      return NextResponse.json(
        {
          status: 'error',
          message: '사용자를 찾을 수 없습니다',
          details: '등록되지 않은 이메일입니다',
        },
        { status: 401 }
      );
    }

    console.log('✅ 사용자 찾음:', { id: user.id, email: user.email });

    // 2. 비밀번호 확인
    console.log('2️⃣ 비밀번호 검증 중...');

    if (!user.password) {
      console.log('❌ 비밀번호 없음');
      return NextResponse.json(
        {
          status: 'error',
          message: '비밀번호가 설정되지 않았습니다',
          details: 'Google OAuth로만 가입한 계정일 수 있습니다',
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log('🔐 비밀번호 비교 결과:', {
      isValid: isPasswordValid,
      passwordLength: password.length,
      hashLength: user.password.length,
      hashPreview: user.password.substring(0, 30) + '...',
    });

    if (!isPasswordValid) {
      console.log('❌ 비밀번호 일치하지 않음');
      return NextResponse.json(
        {
          status: 'error',
          message: '비밀번호가 올바르지 않습니다',
        },
        { status: 401 }
      );
    }

    console.log('✅ 비밀번호 일치');

    // 3. 성공 응답
    console.log('✅ 로그인 테스트 성공');
    return NextResponse.json(
      {
        status: 'success',
        message: '✅ 로그인 테스트 성공!',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        details: '이 엔드포인트는 Email/Password 조합만 테스트합니다',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ 로그인 테스트 에러:', error.message);
    return NextResponse.json(
      {
        status: 'error',
        message: '로그인 테스트 중 에러 발생',
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 테스트용 사용자 생성 (선택사항)
export async function GET() {
  return NextResponse.json(
    {
      status: 'info',
      message: '로그인 테스트 API',
      usage: {
        method: 'POST',
        endpoint: '/api/test-login',
        body: {
          email: 'your-email@example.com',
          password: 'your-password',
        },
        example: {
          curl: 'curl -X POST http://localhost:3000/api/test-login -H "Content-Type: application/json" -d \'{"email":"hansol416@naver.com","password":"your-password"}\'',
        },
      },
      testUsers: [
        {
          email: 'hansol416@naver.com',
          name: '최한솔',
          note: '실제 가입한 사용자입니다',
        },
      ],
    },
    { status: 200 }
  );
}
