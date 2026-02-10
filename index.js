document.addEventListener("DOMContentLoaded", () => {
  const loginBox = document.querySelector(".login");
  const signupBox = document.querySelector(".signup");
  const showSignup = document.getElementById("showSignup");
  const showLogin = document.getElementById("showLogin");

  // 🔁 Toggle Between Login and Signup
  showSignup.addEventListener("click", (e) => {
    e.preventDefault();
    loginBox.classList.remove("active");
    signupBox.classList.add("active");
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    signupBox.classList.remove("active");
    loginBox.classList.add("active");
  });

  // Forgot password redirect
  document.getElementById("forgotPassBtn").addEventListener("click", () => {
    window.location.href = "Forget.html";
  });

  // 📝 SIGNUP FUNCTION
  document.getElementById("signupBtn").addEventListener("click", async () => {
    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const role = document.getElementById("signup-role").value;
    const idProof = document.getElementById("signup-id").files[0];

    if (!username || !email || !password || !role) {
      alert("Please fill all fields!");
      return;
    }

    // Require ID proof for teacher/admin
    if ((role === "teacher" || role === "admin") && !idProof) {
      alert("Please upload your ID proof!");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("role", role);
    if (idProof) formData.append("idProof", idProof);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/auth/signup", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Signup failed");
        return;
      }

      // ✅ Role-based message
      if (role === "teacher") {
        alert(
          "Your account has been created successfully. Please wait for admin approval before logging in.",
        );
        signupBox.classList.remove("active");
        loginBox.classList.add("active");
      } else if (role === "student") {
        alert("Signup successful! You can now log in.");
        window.location.href = "";
      } else {
        alert(data.message || "Signup complete!");
      }
    } catch (err) {
      if (role === "teacher") {
        alert(
          "Your account has been created successfully. Please wait for admin approval before logging in.",
        );
        signupBox.classList.remove("active");
        loginBox.classList.add("active");
      } else {
        alert("Something went wrong. Please try again.");
      }
      console.error(err);
    }
  });

  // 🔐 LOGIN FUNCTION (Username OR Email)
  document.getElementById("loginBtn").addEventListener("click", async () => {
    const identifier = document.getElementById("login-identifier").value.trim();
    const password = document.getElementById("login-password").value.trim();
    const role = document.getElementById("login-role").value;

    if (!identifier || !password || !role) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      alert(data.message);

      // ✅ Save user data locally for dashboard use
      localStorage.setItem("sl_token", data.token);
      localStorage.setItem("sl_userId", data.user.id);
      localStorage.setItem("sl_username", data.user.username);
      localStorage.setItem("sl_email", data.user.email);
      localStorage.setItem("sl_role", data.user.role);

      // Redirect based on role
      if (role === "student") {
        window.location.href = "student-dashboard.html";
      } else if (role === "teacher") {
        window.location.href = "teacher-dashboard.html";
      } else if (role === "admin") {
        window.location.href = "admin-dashboard.html";
      }
    } catch (err) {
      alert("Error connecting to server.");
      console.error(err);
    }
  });
});
