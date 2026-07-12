import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/api";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem(
      "transitops_user"
    );

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch {
    localStorage.removeItem(
      "transitops_user"
    );

    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    readStoredUser
  );

  const [loading, setLoading] =
    useState(true);

  const token = localStorage.getItem(
    "transitops_token"
  );

  const clearAuthentication =
    useCallback(() => {
      localStorage.removeItem(
        "transitops_token"
      );

      localStorage.removeItem(
        "transitops_user"
      );

      setUser(null);
    }, []);

  const saveAuthentication = useCallback(
    (newToken, newUser) => {
      localStorage.setItem(
        "transitops_token",
        newToken
      );

      localStorage.setItem(
        "transitops_user",
        JSON.stringify(newUser)
      );

      setUser(newUser);
    },
    []
  );

  const login = useCallback(
    async ({ email, password }) => {
      const response = await api.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      const {
        token: newToken,
        user: authenticatedUser,
      } = response.data;

      saveAuthentication(
        newToken,
        authenticatedUser
      );

      return authenticatedUser;
    },
    [saveAuthentication]
  );

  const logout = useCallback(() => {
    clearAuthentication();
  }, [clearAuthentication]);

  useEffect(() => {
    async function restoreSession() {
      const currentToken =
        localStorage.getItem(
          "transitops_token"
        );

      if (!currentToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          "/auth/me"
        );

        const currentUser =
          response.data.user;

        localStorage.setItem(
          "transitops_user",
          JSON.stringify(currentUser)
        );

        setUser(currentUser);
      } catch {
        clearAuthentication();
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [clearAuthentication]);

  useEffect(() => {
    function handleUnauthorized() {
      clearAuthentication();
      setLoading(false);
    }

    window.addEventListener(
      "transitops:unauthorized",
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        "transitops:unauthorized",
        handleUnauthorized
      );
    };
  }, [clearAuthentication]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [
      user,
      token,
      loading,
      login,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}