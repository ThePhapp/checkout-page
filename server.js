import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve file tĩnh (public/)
app.use(express.static("public"));

/** ====== CẤU HÌNH & STORE ĐƠN HÀNG (demo in-memory) ====== */
const {
  PORT = 3000,
  BANK_CODE,
  BANK_ACCOUNT,
  ACCOUNT_NAME,
  PAYMENT_PREFIX = "DH",
  WEBHOOK_SECRET,
  VIETQR_BASE = "https://img.vietqr.io/image",
} = process.env;

// Bảng giá giống trên frontend
const PRODUCT_PRICES = {
  basic: 199000,
  pro: 349000,
  full: 499000,
};

// Store demo: dùng MongoDB/SQL trong thực tế
const orders = new Map(); // key: orderId, value: object

function genOrderId() {
  // orderId ngắn gọn: timestamp + 3 số random
  const rand = Math.floor(Math.random() * 900) + 100;
  return `${Date.now()}${rand}`;
}

function buildPaymentContent(orderId) {
  // nội dung chuyển khoản: ví dụ "DH-<orderId>"
  return `${PAYMENT_PREFIX}-${orderId}`;
}

function buildVietQrUrl({ bankCode, account, amount, addInfo }) {
  // Chuẩn VietQR image:
  // {VIETQR_BASE}/{bankCode}-{account}-qr_only.png?amount=...&addInfo=...
  const url = new URL(`${VIETQR_BASE}/${bankCode}-${account}-qr_only.png`);
  url.searchParams.set("amount", amount);
  url.searchParams.set("addInfo", addInfo);
  return url.toString();
}

/** ====== API: TẠO ĐƠN HÀNG & LẤY QR ====== */
app.post("/api/orders", (req, res) => {
  try {
    const { name, email, product } = req.body || {};
    if (!name || !email || !product) {
      return res.status(400).json({ error: "Thiếu name/email/product" });
    }
    const amount = PRODUCT_PRICES[product];
    if (!amount) {
      return res.status(400).json({ error: "Sản phẩm không hợp lệ" });
    }

    const orderId = genOrderId();
    const paymentContent = buildPaymentContent(orderId);

    // Lưu đơn
    const order = {
      orderId,
      name,
      email,
      product,
      amount,
      status: "PENDING", // PENDING -> PAID
      paymentContent,
      createdAt: new Date().toISOString(),
      paidAt: null,
      rawMatches: [], // lưu payload webhook
    };
    orders.set(orderId, order);

    // Tạo URL QR (có amount + addInfo = paymentContent)
    const qrUrl = buildVietQrUrl({
      bankCode: BANK_CODE,
      account: BANK_ACCOUNT,
      amount,
      addInfo: paymentContent,
    });

    return res.json({
      orderId,
      amount,
      paymentContent,
      qrUrl,
      bank: {
        code: BANK_CODE,
        account: BANK_ACCOUNT,
        accountName: ACCOUNT_NAME,
      },
      status: order.status,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Lỗi tạo đơn hàng" });
  }
});

/** ====== API: KIỂM TRA TRẠNG THÁI ĐƠN HÀNG ====== */
app.get("/api/orders/:orderId/status", (req, res) => {
  const { orderId } = req.params;
  const order = orders.get(orderId);
  if (!order) return res.status(404).json({ error: "Không thấy đơn hàng" });
  return res.json({ orderId, status: order.status, amount: order.amount });
});

/** ====== WEBHOOK TỪ SEPAY ======
 * Bạn cấu hình Webhook URL: https://<domain>/api/sepay/webhook
 * và (khuyến nghị) gửi kèm secret dưới dạng Header "X-Webhook-Secret: <WEBHOOK_SECRET>"
 * hoặc query ?secret=<WEBHOOK_SECRET>
 * Payload (ví dụ) SePay gửi sẽ có:
 * - transferType: "in" (tiền vào)
 * - transferAmount: number
 * - content: "DH-<orderId>" (nội dung chuyển khoản)
 * - transactionDate, referenceCode, accountNumber, ...
 */
app.post("/api/sepay/webhook", (req, res) => {
  try {
    // Xác thực webhook (đơn giản)
    const headerSecret = req.get("X-Webhook-Secret");
    const querySecret = req.query.secret;
    if (WEBHOOK_SECRET && headerSecret !== WEBHOOK_SECRET && querySecret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: "Sai webhook secret" });
    }

    const payload = req.body || {};
    // Tùy theo SePay, field có thể là "transferType", "amount" hoặc "transferAmount", "content"
    // Cố gắng đọc linh hoạt:
    const transferType = payload.transferType || payload.type || "";
    const amount = Number(payload.transferAmount ?? payload.amount ?? 0);
    const content = (payload.content || payload.description || "").trim();

    if (transferType !== "in") {
      // Bỏ qua giao dịch không phải tiền vào
      return res.json({ ok: true, ignored: true });
    }
    if (!amount || !content) {
      return res.status(400).json({ error: "Thiếu amount/content trong payload" });
    }

    // Trích orderId từ content theo format PAYMENT_PREFIX-<orderId>
    const re = new RegExp(`^${PAYMENT_PREFIX}-([0-9]{10,})$`, "i");
    const m = content.match(re);
    if (!m) {
      return res.json({ ok: true, ignored: true, reason: "content không khớp format" });
    }
    const orderId = m[1];
    const order = orders.get(orderId);
    if (!order) {
      return res.json({ ok: true, ignored: true, reason: "Không thấy orderId" });
    }

    // Đối chiếu số tiền
    if (Number(order.amount) !== Number(amount)) {
      // Có thể bạn muốn cho phép chênh lệch nhỏ hoặc xử lý partial.
      order.rawMatches.push({ payload, matchedAt: new Date().toISOString(), note: "Sai số tiền" });
      return res.json({ ok: true, mismatch: true, reason: "Số tiền không khớp" });
    }

    // Đánh dấu đã thanh toán
    order.status = "PAID";
    order.paidAt = new Date().toISOString();
    order.rawMatches.push({ payload, matchedAt: new Date().toISOString(), note: "Matched" });
    orders.set(orderId, order);

    // TODO: Gửi email / kích hoạt fulfillment ở đây (ví dụ: Nodemailer)
    console.log(`[PAID] orderId=${orderId}, email=${order.email}`);

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Webhook xử lý lỗi" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
