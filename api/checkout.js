// api/checkout.js
export default async function handler(req, res) {
  const { name, email, amount } = req.body;

  // Xử lý tạo URL thanh toán (VD: VNPay hoặc Stripe)
  const paymentUrl = await createVnpayUrl(name, email, amount); // hoặc Stripe checkout link
  res.status(200).json({ paymentUrl });
}
