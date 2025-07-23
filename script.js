document.getElementById("checkout-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;

  const res = await fetch("https://your-api-url.com/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, amount: 1999 }),
  });

  const result = await res.json();
  if (result.paymentUrl) {
    window.location.href = result.paymentUrl;
  } else {
    alert("Error processing payment.");
  }
});
