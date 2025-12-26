# Stripe 설정 가이드

## 현재 상황
구독하기 버튼 클릭 시 다음 오류 발생:
```
StripeInvalidRequestError: No such price: 'prod_TfVd0h1gxc32SF'
```

## 문제점
환경 변수의 Stripe Price ID가 실제 계정에 존재하지 않습니다.

## 해결 방법

### 1단계: Stripe 대시보드 접속
- https://dashboard.stripe.com 접속
- 테스트 모드(Test Mode) 확인

### 2단계: Products 확인
1. 좌측 메뉴에서 "Products" 클릭
2. 기존 Products 목록 확인
3. 각 Product별 Price 확인

### 3단계: Price ID 형식 확인
- **Product ID**: `prod_` 로 시작
- **Price ID**: `price_` 로 시작 ← **이것을 사용해야 함**

### 4단계: 환경 변수 업데이트
`.env.local` 파일의 다음 부분을 수정:

```dotenv
# 실제 Stripe 대시보드에서 확인한 Price ID 입력
STRIPE_BASIC_PRICE_ID="price_XXX..."      # price_로 시작하는 ID
STRIPE_PRO_PRICE_ID="price_YYY..."        # price_로 시작하는 ID
STRIPE_ENTERPRISE_PRICE_ID="price_ZZZ..." # price_로 시작하는 ID
```

### 5단계: 서버 재시작
변경 후 `npm run dev` 재시작

## Price ID 찾는 방법
1. Stripe 대시보드 → Products
2. 각 Product 클릭
3. "Pricing" 섹션에서 `price_` ID 확인
4. 또는 API Keys → Prices 섹션 확인

