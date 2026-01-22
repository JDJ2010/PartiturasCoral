document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal-login");
  const btn = document.getElementById("btn-login");
  const closeBtn = document.getElementById("close-modal");
  const loginForm = document.getElementById("login-form");
  const passInput = document.getElementById("pass");
  const errorDiv = document.getElementById("login-error");

  // Abrir modal
  btn.addEventListener("click", () => {
    modal.style.display = "flex";
    passInput.value = "";
    errorDiv.style.display = "none";
  });

  // Cerrar modal con X
  closeBtn.addEventListener("click", () => modal.style.display = "none");

  // Cerrar modal al hacer click fuera
  window.addEventListener("click", (e) => {
    if(e.target === modal) modal.style.display = "none";
  });

  // Login con redirección
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if(passInput.value === "admin123"){ // contraseña correcta
      window.location.href = "admin.html"; // redirige al panel admin
    } else {
      errorDiv.style.display = "block"; // mostrar error
    }
  });
});
