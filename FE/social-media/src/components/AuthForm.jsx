import { useState } from "react";

export default function AuthForm({ buttonLabel, includeName }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert(JSON.stringify(form, null, 2)); // simulate login/signup
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {includeName && (
        <input
          type="text"
          name="name"
          placeholder="Full name"
          value={form.name}
          onChange={handleChange}
          required
        />
      )}
      <input
        type="email"
        name="email"
        placeholder="Email address"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
      />
      <button type="submit">{buttonLabel}</button>
    </form>
  );
}
