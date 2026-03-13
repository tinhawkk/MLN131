# Hướng dẫn deploy game trên Railway (có Socket.io)

## 1. Chuẩn bị

- Đảm bảo bạn đã có tài khoản Railway (https://railway.app/)
- Đảm bảo project đã có file `package.json`, `server.ts` (hoặc `server.js`), và cấu hình socket.io.

## 2. Cấu hình project

- Đảm bảo server sử dụng cổng từ biến môi trường:

```ts
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- Nếu dùng TypeScript, Railway sẽ build từ file `server.ts` hoặc `server.js`. Đảm bảo có script build và start trong `package.json`:

```json
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js"
}
```

## 3. Đẩy code lên GitHub

- Tạo repo GitHub, push toàn bộ code lên.

## 4. Deploy trên Railway

1. Vào https://railway.app/
2. Bấm "New Project" > "Deploy from GitHub repo"
3. Chọn repo vừa push.
4. Railway sẽ tự động detect Node.js project và build.
5. Nếu dùng TypeScript, Railway sẽ chạy script `build` rồi `start`.
6. Đảm bảo server dùng đúng cổng (PORT).

## 5. Socket.io hoạt động trên Railway

- Socket.io sẽ hoạt động bình thường nếu server đã dùng đúng cổng và không hardcode localhost.
- Railway cung cấp domain public, client cần kết nối tới domain đó.

## 6. Cấu hình client

- Đổi URL socket client:

```ts
const socket = io(); // Railway sẽ tự động dùng đúng domain
```

- Nếu cần, dùng domain Railway: `const socket = io('https://your-app.up.railway.app');`

## 7. Kiểm tra

- Sau khi deploy, vào domain Railway, kiểm tra client và server có kết nối socket.

## 8. Troubleshooting

- Nếu không kết nối được, kiểm tra logs Railway, đảm bảo server không hardcode localhost.
- Đảm bảo không chặn CORS nếu client và server cùng domain.

## 9. Tài liệu

- Railway docs: https://docs.railway.app/
- Socket.io docs: https://socket.io/docs/

---

Nếu cần hướng dẫn chi tiết từng bước, hãy hỏi thêm!
