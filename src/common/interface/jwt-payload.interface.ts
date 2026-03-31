export interface JwtPayload {
  sub: number; // ID của user
  email: string;
  role: string;
  iat?: number; // Issued At (Thời điểm tạo)
  exp?: number; // Expiration (Thời điểm hết hạn)
}
