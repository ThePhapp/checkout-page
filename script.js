document.getElementById("checkout-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  try {
    const formData = new URLSearchParams();
formData.append("name", name);
formData.append("email", email);
formData.append("amount", amount);

await fetch("https://script.google.com/macros/s/AKfycbwTF-siO0qUn2BFTzfyWs2SUTDsa6v719XHjMBwb1ezq-q3pd-XCINYCoJGcypP-UOB/exec", {
  method: "POST",
  body: formData
});


    // Redirect sang Momo
    window.location.href = "https://nhantien.momo.vn/phapok0"; // link Momo cố định của bạn
  } catch (err) {
    alert("Gửi thông tin thất bại. Vui lòng thử lại.");
  }
});
