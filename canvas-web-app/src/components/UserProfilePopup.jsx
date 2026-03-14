import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import LogoutButton from './auth/LogoutButton';
import apiClient from '../services/api/apiClient';

const UserProfilePopup = ({ onClose }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get('/users/' + localStorage.getItem('userId'));
        setUserData(response.data);
      } catch (error) {
        console.error("Error carregant l'usuari:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <div className="profile-popup">Carregant...</div>;
  if (!userData) return null;

  return (
    <div className='profile-popup-overlay' onClick={onClose}>
      <div className="profile-popup" onClick={""}>
        <div className="popup-header">
          <button className="close-popup" onClick={onClose}>x</button>
          <span>Compte</span>
        </div>

        <div className="popup-content">
          <div className="user-info">
            <Avatar id={localStorage.getItem('userId')} />
            <div className="user-details">
              <p className="user-name">@{userData.username}</p>
              <p className="user-email">{userData.email}</p>
            </div>
          </div>

          <hr />

          <ul className="popup-menu">
            <li>Configuració</li>
          </ul>

          <hr />

          <div className="popup-footer">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePopup;