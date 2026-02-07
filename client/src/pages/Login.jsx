import React, { useState } from "react";
import { UseAppContext } from "../context/Context";
import toast from "react-hot-toast";

const Login = () => {
  const [state, setState] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { axios, setToken } = UseAppContext();
  const { navigate } = UseAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = state === "login" ? "/api/user/login" : "/api/user/register";

    const payload =
      state === "login" ? { email, password } : { name, email, password };

    try {
      const { data } = await axios.post(url, payload);

      if (data.success) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        navigate("/");
        toast.success(
          state === "login"
            ? "Login successful 🎉"
            : "Account created successfully 🎉",
        );
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Server error. Try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const switchState = () => {
    setState(state === "login" ? "register" : "login");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-88 text-gray-500 rounded-lg shadow-xl border border-gray-200 bg-white"
    >
      <p className="text-2xl font-medium m-auto">
        <span className="text-purple-700">User</span>{" "}
        {state === "login" ? "Login" : "Sign Up"}
      </p>

      {state === "register" && (
        <div className="w-full">
          <p>Name</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700"
            type="text"
            required
          />
        </div>
      )}

      <div className="w-full">
        <p>Email</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700"
          type="email"
          required
        />
      </div>

      <div className="w-full">
        <p>Password</p>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-200 rounded w-full p-2 mt-1 outline-purple-700"
          type="password"
          required
        />
      </div>

      <p>
        {state === "register"
          ? "Already have an account?"
          : "Create an account?"}{" "}
        <span onClick={switchState} className="text-purple-700 cursor-pointer">
          click here
        </span>
      </p>

      <button
        type="submit"
        disabled={loading}
        className="bg-purple-700 hover:bg-purple-800 transition-all text-white w-full py-2 rounded-md"
      >
        {loading
          ? "Please wait..."
          : state === "register"
            ? "Create Account"
            : "Login"}
      </button>
    </form>
  );
};

export default Login;
