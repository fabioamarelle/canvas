import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api/apiClient';
import logo_banner from '../../assets/logo_banner.png';
import '../../styles/AuthForm.css';

const RegisterForm = ({ onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await apiClient.post('/auth/register', formData);

      localStorage.setItem('userId', response.data.id);
      if (onAuthSuccess) onAuthSuccess();

      window.location.reload();

    } catch (error) {
      if (error.response && error.response.data) {
        setMessage(error.response.data.message);
      } else {
        setMessage('No s`ha pogut connectar amb el servidor.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-main-content">
        
        <div className="auth-logo-container">
          <img src={logo_banner} alt="Canvas Logo" className="auth-logo" />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Crea un compte</h2>

          <input
            type="text"
            name="username"
            placeholder="Nom d'usuari"
            value={formData.username}
            onChange={handleChange}
            required
            autoComplete="username"
          />

          <input
            type="email"
            name="email"
            placeholder="Correu electrònic"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />

          <input
            type="password"
            name="password"
            placeholder="Contrasenya"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />

          <button type="submit">Registrar-se</button>

          {message && (
            <div className="status-message">
              <span>{message}</span>
            </div>
          )}

          <Link to="/login" className="auth-link">
            Ja tens compte? Inicia sessió
          </Link>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;