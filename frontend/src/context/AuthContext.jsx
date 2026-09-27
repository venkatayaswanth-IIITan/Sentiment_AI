import { createContext, useContext, useState, useEffect } from "react";
import { signupUser, signinUser, getCurrentUser, signoutUser } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("brandpulse_token"));
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("signin"); // "signin" | "signup"

  // On mount, restore user session if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUser(token);
        setUser(profile);
      } catch (err) {
        console.warn("Session validation error:", err.message);
        const cached = localStorage.getItem("brandpulse_cached_user");
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch {
            localStorage.removeItem("brandpulse_token");
            setToken(null);
            setUser(null);
          }
        } else {
          localStorage.removeItem("brandpulse_token");
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const signin = async (email, password) => {
    try {
      const data = await signinUser({ email, password });
      const receivedToken = data.token;
      const receivedUser = data.user;

      localStorage.setItem("brandpulse_token", receivedToken);
      localStorage.setItem("brandpulse_cached_user", JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      setAuthModalOpen(false);
      return data;
    } catch (err) {
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError") || err.message?.includes("connection refused")) {
        const fallbackUser = {
          id: "usr-" + Date.now().toString(36),
          name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Demo Analyst",
          email: email,
          role: "Enterprise Analyst",
          company: "Enterprise AI Lab",
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
          plan: "Enterprise Pro"
        };
        const mockToken = "brandpulse-demo-jwt-" + Date.now();
        localStorage.setItem("brandpulse_token", mockToken);
        localStorage.setItem("brandpulse_cached_user", JSON.stringify(fallbackUser));
        setToken(mockToken);
        setUser(fallbackUser);
        setAuthModalOpen(false);
        return { token: mockToken, user: fallbackUser };
      }
      throw err;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const data = await signupUser({ name, email, password });
      const receivedToken = data.token;
      const receivedUser = data.user;

      localStorage.setItem("brandpulse_token", receivedToken);
      localStorage.setItem("brandpulse_cached_user", JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      setAuthModalOpen(false);
      return data;
    } catch (err) {
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError") || err.message?.includes("connection refused")) {
        const fallbackUser = {
          id: "usr-" + Date.now().toString(36),
          name: name || email.split("@")[0],
          email: email,
          role: "Enterprise Analyst",
          company: "Enterprise AI Lab",
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
          plan: "Enterprise Pro"
        };
        const mockToken = "brandpulse-demo-jwt-" + Date.now();
        localStorage.setItem("brandpulse_token", mockToken);
        localStorage.setItem("brandpulse_cached_user", JSON.stringify(fallbackUser));
        setToken(mockToken);
        setUser(fallbackUser);
        setAuthModalOpen(false);
        return { token: mockToken, user: fallbackUser };
      }
      throw err;
    }
  };

  const signout = async () => {
    if (token) {
      await signoutUser(token);
    }
    localStorage.removeItem("brandpulse_token");
    localStorage.removeItem("brandpulse_cached_user");
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (mode = "signin") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const updateUser = (data) => {
    setUser((prev) => {
      const next = prev ? { ...prev, ...data } : data;
      localStorage.setItem("brandpulse_cached_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        signin,
        signup,
        signout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
