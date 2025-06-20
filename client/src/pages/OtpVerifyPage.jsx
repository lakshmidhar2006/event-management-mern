import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { bgimage } from '../assets/image/index';

const OtpVerifyPage = () => {
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      setMessage('No email found. Please go back to the signup page.');
    }
  }, [email]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, ''); // Accept only digits
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); 
    setOtp(newOtp);

    // Move focus
    if (index < otp.length - 1) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }

    // Auto-submit if all filled
    if (newOtp.every(d => d !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleVerify = async (otpValue) => {
    if (!email) {
      setMessage('Email is missing');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post(
        'https://eventhon.onrender.com/api/auth/opt-verfy',
        { email, otp: otpValue },
        { withCredentials: true }
      );
      setMessage(res.data.message || 'OTP verified successfully');
      navigate('/login');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Invalid OTP, please try again');
      setOtp(Array(6).fill(''));
      document.getElementById('otp-input-0').focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      width: "100vw",
      backgroundImage: `url(${bgimage})`,
      backgroundSize: "100% 100%",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center"
    }}>
      <div style={{
        width: "400px",
        backgroundColor: "white",
        borderRadius: "10px",
        boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h2 style={{ marginBottom: "20px", fontFamily: "Nunito", fontWeight: "bold" }}>
          OTP Verification
        </h2>

        <form
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}
          onSubmit={(e) => e.preventDefault()}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                id={`otp-input-${index}`}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                maxLength="1"
                required
                autoFocus={index === 0}
                style={{
                  width: "40px",
                  height: "40px",
                  textAlign: "center",
                  fontSize: "1.5rem",
                  borderRadius: "5px",
                  border: "1px solid #ccc"
                }}
              />
            ))}
          </div>

          {loading && <p style={{ color: "blue" }}>Verifying...</p>}
          {message && (
            <p
              style={{
                color: message.toLowerCase().includes('success') ? "green" : "red",
                fontWeight: "bold"
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default OtpVerifyPage;
