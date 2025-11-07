import AuthForm from "../components/AuthForm.jsx";

export default function Signup({ onSwitch }) {
  return (
    <div className="auth-container">
      <h2>Create Account</h2>
      <AuthForm buttonLabel="Register" includeName />
      <p>
        Already have an account?{" "}
        <button className="link" onClick={onSwitch}>
          Log in
        </button>
      </p>
    </div>
  );
}
