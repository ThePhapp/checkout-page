document.getElementById("checkout-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const amount = 19990;

  const formData = new URLSearchParams();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("amount", amount);

  try {
    await fetch("https://script.google.com/macros/s/AKfycbwTF-siO0qUn2BFTzfyWs2SUTDsa6v719XHjMBwb1ezq-q3pd-XCINYCoJGcypP-UOB/exec", {
      method: "POST",
      body: formData,
    });

    // Chuyển sang Momo sau khi gửi xong
    window.location.href = "https://nhantien.momo.vn/phapok0";
  } catch (err) {
    alert("Gửi thông tin thất bại. Vui lòng thử lại.");
    console.error(err);
  }
});
