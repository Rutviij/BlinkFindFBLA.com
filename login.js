let loginAttempts = 0;

const form = document.getElementById("loginForm");
const errorBox = document.getElementById("loginError");

form.addEventListener("submit", e => {
  e.preventDefault();

  const user = username.value;
  const pass = password.value;
  const remember = rememberMe.checked;

  if (
    (user === "admin" && pass === "school123") ||
    (user === "staff" && pass === "campus456")
  ) {
    localStorage.setItem("isAdminLoggedIn", "true");

    if (remember) {
      localStorage.setItem("adminUsername", user);
    } else {
      localStorage.removeItem("adminUsername");
    }

    // 🔁 REDIRECT
    window.location.href = "admin.html";
  } else {
    loginAttempts++;
    errorBox.classList.add("show");

    if (loginAttempts >= 3) {
      alert("Too many failed attempts");
      loginAttempts = 0;
    }
  }
});

document.getElementById("forgotPassword").onclick = e => {
  e.preventDefault();
  alert("Contact system administrator.");
};

window.onload = () => {
  const saved = localStorage.getItem("adminUsername");
  if (saved) {
    username.value = saved;
    rememberMe.checked = true;
  }
};
