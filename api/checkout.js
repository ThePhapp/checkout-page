// /api/checkout.js
import crypto from "crypto";
export default async function handler(req, res) {
  const { name, email, amount } = req.body;

  const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
  const partnerCode = "MOMOXXXX";
  const accessKey = "accesskeyXXX";
  const secretKey = "secretXXX";
  const orderId = Date.now().toString();
  const requestId = orderId;

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=&ipnUrl=https://yourdomain.com/ipn&orderId=${orderId}&orderInfo=Thanh toán Momo&partnerCode=${partnerCode}&redirectUrl=https://yourdomain.com/thank-you&requestId=${requestId}&requestType=captureWallet`;

  const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

  const body = {
    partnerCode,
    accessKey,
    requestId,
    amount: amount.toString(),
    orderId,
    orderInfo: "Thanh toán đơn hàng Momo",
    redirectUrl: "https://yourdomain.com/thank-you",
    ipnUrl: "https://yourdomain.com/ipn",
    requestType: "captureWallet",
    extraData: "",
    signature,
    lang: "vi"
  };

  const momoRes = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await momoRes.json();
  res.json({ paymentUrl: result.payUrl });
}
