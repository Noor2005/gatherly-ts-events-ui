import {
  Alert,
  Box,
  Button,
  Collapse,
  Container,
  CssBaseline,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import OtpInput from "react-otp-input";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import authService from "../../Services/AuthService";
import "./Login.css";

function Login() {
  const OTP_COUNTDOWN_SECONDS = 30;

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState({ isError: false, message: "" });

  const validateEmail = (value) => {
    // 1. Required Check
    if (!value) {
      return { isError: true, message: "Email is required" };
    }

    // 2. Format Check (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { isError: true, message: "Invalid email format" };
    }

    return { isError: false, message: "" };
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Clear error while typing or validate on the fly
    if (error.isError) {
      setError(validateEmail(value));
    }
  };

  const navigate = useNavigate();

  // State to manage OTP status
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false); // To show loading

  //Add state for your alert
  const [alertInfo, setAlertInfo] = useState({
    show: false,
    severity: "success", // 'success', 'error', 'warning', 'info'
    message: "",
  });

  const [countdown, setCountdown] = useState(0);

  // Add useEffect to handle the timer logic
  useEffect(() => {
    // If countdown is 0, do nothing
    if (countdown <= 0) return;

    // Set a timer to decrease the countdown by 1
    const timerId = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    // This is a cleanup function:
    // It clears the timer if the component unmounts or countdown changes
    return () => clearTimeout(timerId);
  }, [countdown]); // This effect runs whenever 'countdown' changes

  const handleSendOtp = async () => {
    // Validate input
    const validation = validateEmail(email);
    setError(validation);

    if (!validation.isError) {
      console.log("Form Submitted:", email);

      setIsSending(true);
      setAlertInfo({ show: false, message: "" }); // Clear any old alerts

      try {
        const response = await authService.sendOtp(email);
        const isSuccess = response.data.success;

        setAlertInfo({
          show: true,
          severity: isSuccess ? "success" : "error",
          message:
            response.data.message ||
            (isSuccess
              ? "An OTP has been sent to your email."
              : "Failed to send OTP. Please try again."),
        });

        if (!isSuccess) {
          return; // Stop here, don't show the OTP field
        }

        setOtpSent(true);

        // Start the countdown on success
        setCountdown(OTP_COUNTDOWN_SECONDS);
      } catch (error) {
        console.error(error);

        // Set an error alert
        setAlertInfo({
          show: true,
          severity: "error",
          message: error.message || "Failed to send OTP. Please try again.",
        });
      } finally {
        // 5. This runs whether it succeeds or fails
        setIsSending(false);
      }
    }
  };

  const getSendOtpBtnText = () => {
    if (isSending) return "Sending...";
    if (countdown > 0) return `Resend in ${countdown}`;
    if (otpSent) return "Resend OTP";
    return "Send OTP";
  };

  const handleSubmit = async (event) => {
    setAlertInfo({ show: false, message: "" }); // Clear any old alerts
    event.preventDefault();

    try {
      const response = await authService.loginWithOtp(email, otp);

      const isSuccess = response.data.success;

      if (!isSuccess) {
        setAlertInfo({
          show: true,
          severity: "error",
          message:
            response.data.message ||
            "Error in authentication. Please try again.",
        });
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);

      // Set an error alert
      setAlertInfo({
        show: true,
        severity: "error",
        message: error.message || "Failed to login. Please try again.",
      });
    }
  };

  // Define the style for each input box for OTP
  const inputStyle = {
    width: "3rem",
    height: "3rem",
    fontSize: "1.5rem",
    textAlign: "center",
    border: "1px solid #ccc",
    borderRadius: "4px",
    margin: "0 4px", // Replaces the separator
  };

  return (
    <motion.div
      className="login-container"
      initial={{ opacity: 0, y: -50 }} // Starts transparent and 50px above
      animate={{ opacity: 1, y: 0 }} // Animates to full opacity at its original position
      transition={{ duration: 0.5 }} // Animation takes 0.5 seconds
    >
     

      <Container component="main" maxWidth="xs" className="login-form">
        <CssBaseline />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>

          <Typography component="label" variant="body2" color="textSecondary">
            Enter your registered Tech Sisters email
          </Typography>

          <Collapse
            in={alertInfo.show} // Animation is controlled by this state
            sx={{ width: "100%", mt: 2 }} // Style the wrapper
          >
            {alertInfo.show && (
              <Alert
                severity={alertInfo.severity}
                sx={{ width: "100%", mt: 2 }}
                onClose={() => setAlertInfo({ ...alertInfo, show: false })} // Optional: makes it dismissible
              >
                {alertInfo.message}
              </Alert>
            )}
          </Collapse>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              type="email"
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleChange}
              onBlur={() => setError(validateEmail(email))} // Validate when user clicks away
              error={error.isError}
              helperText={error.message}
              disabled={otpSent} // Optionally disable email field after OTP is sent
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={handleSendOtp}
                      disabled={isSending || countdown > 0 || error.isError} // Disable if sending or already sent
                    >
                      {getSendOtpBtnText()}
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            {/* === CONDITIONAL OTP FIELD === */}

            {/* This field only appears *after* the OTP is sent */}
            {otpSent && (
              <>
                {/* --- Start of OTP Input --- */}
                <div className="form-group mt-3">
                  <Typography component="label" variant="body2">
                    Enter the 6-digit OTP sent to your email
                  </Typography>

                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    isInputNum={true}
                    shouldAutoFocus={true}
                    // This is the new required prop
                    renderInput={(props, index) => (
                      <input
                        {...props}
                        style={inputStyle} // Apply your custom styles here
                      />
                    )}
                  />
                </div>
                {/* --- End of OTP Input --- */}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={otp.length !== 6}
                >
                  Sign In
                </Button>
              </>
            )}

            {/* === END CONDITIONAL OTP FIELD === */}
          </Box>
        </Box>
      </Container>
    </motion.div>
  );
}

export default Login;
