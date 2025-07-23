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
//     await fetch("https://sheetdb.io/api/v1/jk595chfbj8m2", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({ data: { name, email, amount } })
// }
// );

    // Chuyển sang Momo sau khi gửi xong
    window.location.href = "thank_you.html";
  } catch (err) {
    alert("Gửi thông tin thất bại. Vui lòng thử lại.");
    console.error(err);
  }
});
