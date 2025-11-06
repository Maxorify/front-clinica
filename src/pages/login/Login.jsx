import { useState, useEffect } from "react";
import { TextField, Button, InputAdornment, IconButton } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import fondo from "../../assets/fondo.jpg";
import { getCurrentUser } from "../../utils/auth";

const loginTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
    },
    background: {
      paper: "#fff",
      default: "transparent",
    },
    text: {
      primary: "#222",
    },
  },
});

const MotionDiv = motion.div;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  // Verificar si el usuario ya está autenticado al cargar el componente
  useEffect(() => {
    const user = getCurrentUser();
    const token = localStorage.getItem("auth_token");

    if (user && token && user.rol_nombre) {
      // Usuario ya autenticado, redirigir a su dashboard
      const dashboardRoutes = {
        admin: "/admin/dashboard",
        medico: "/doctor/dashboard",
        secretaria: "/secretaria/dashboard",
      };

      const redirectUrl = dashboardRoutes[user.rol_nombre];
      if (redirectUrl) {
        setIsRedirecting(true);
        setTimeout(() => {
          navigate(redirectUrl, { replace: true });
        }, 400);
      }
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.detail || "Error al iniciar sesión");
        setIsSubmitting(false);
        return;
      }

      if (data.success && data.data) {
        // Guardar información del usuario en localStorage
        localStorage.setItem("user", JSON.stringify(data.data));
        localStorage.setItem("auth_token", data.data.auth_token || "");
        localStorage.setItem("access_token", data.data.auth_token || ""); // Para compatibilidad
        localStorage.setItem("user_id", data.data.id); // ID del usuario
        localStorage.setItem("user_name", data.data.nombre); // Nombre del usuario
        localStorage.setItem("user_role", data.data.rol_nombre); // Rol del usuario

        // Activar animación de salida antes de redirigir
        setIsRedirecting(true);
        setIsSubmitting(false);

        // Verificar si tiene contraseña temporal
        if (data.data.contrasena_temporal === true) {
          // Redirigir a cambiar contraseña
          setTimeout(() => {
            navigate("/cambiar-contrasena");
          }, 400);
        } else if (data.redirect_url) {
          // Redirigir según el rol usando la URL que envía el backend con delay para animación
          setTimeout(() => {
            navigate(data.redirect_url);
          }, 400);
        }
      }
    } catch (error) {
      console.error("Error en login:", error);
      setFormError("Error de conexión con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-start relative bg-cover bg-center"
      style={{ backgroundImage: `url(${fondo})` }}
    >
      <ThemeProvider theme={loginTheme}>
        <CssBaseline />
        <MotionDiv
          className="relative z-10 bg-white/95 p-10 rounded-3xl shadow-2xl w-full max-w-md ml-8 md:ml-16 lg:ml-24"
          initial={{ opacity: 0, x: -30 }}
          animate={
            isRedirecting
              ? { opacity: 0, x: 50, scale: 0.95 }
              : { opacity: 1, x: 0, scale: 1 }
          }
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
            Inicio de sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 text-gray-700"
              >
                Correo:
              </label>
              <TextField
                id="email"
                type="email"
                fullWidth
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={isSubmitting}
                required
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <EmailIcon sx={{ color: "#6b7280" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: "#f9fafb",
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#e5e7eb",
                    },
                    "&:hover fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#2563eb",
                    },
                  },
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 text-gray-700"
              >
                Contraseña:
              </label>
              <TextField
                id="password"
                type={showPassword ? "text" : "password"}
                fullWidth
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                required
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: "#f9fafb",
                    borderRadius: "12px",
                    "& fieldset": {
                      borderColor: "#e5e7eb",
                    },
                    "&:hover fieldset": {
                      borderColor: "#d1d5db",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#2563eb",
                    },
                  },
                }}
              />
            </div>

            {formError && <p className="text-red-500 text-sm">{formError}</p>}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              sx={{
                backgroundColor: "#2563eb",
                "&:hover": {
                  backgroundColor: "#1d4ed8",
                },
                "&:disabled": {
                  backgroundColor: "#93c5fd",
                },
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 600,
                padding: "14px",
                borderRadius: "12px",
                marginTop: "0.5rem",
                boxShadow: "0 4px 14px 0 rgba(37, 99, 235, 0.39)",
              }}
            >
              {isSubmitting ? "Ingresando..." : "Login"}
            </Button>
          </form>
        </MotionDiv>
      </ThemeProvider>
    </div>
  );
}
