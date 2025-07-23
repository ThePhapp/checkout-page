document.getElementById("checkout-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const amount = 19990; // đơn giá

  const data = { name, email, amount };

  try {
    // Gửi dữ liệu tới Google Apps Script
    await fetch("https://script.google.com/macros/s/AKfycbwTF-siO0qUn2BFTzfyWs2SUTDsa6v719XHjMBwb1ezq-q3pd-XCINYCoJGcypP-UOB/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    // Redirect sang Momo
    window.location.href = "https://nhantien.momo.vn/phapok0"; // link Momo cố định của bạn
  } catch (err) {
    alert("Gửi thông tin thất bại. Vui lòng thử lại.");
  }
});
