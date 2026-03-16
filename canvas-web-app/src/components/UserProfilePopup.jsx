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
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <div className="profile-popup">Loading...</div>;
  if (!userData) return null;

  return (
    <div className='profile-popup-overlay' onClick={onClose}>
      <div className="profile-popup" onClick={""}>
        <div className="popup-header">
          <button className="close-popup" onClick={onClose}>x</button>
          <span>Account</span>
        </div>

        <div className="popup-content">
          <div className="user-info">
            <Avatar id={localStorage.getItem('userId')} />
            <div className="user-details">
              <p className="user-name">@{userData.username}</p>
              <p className="user-email">{userData.email}</p>
            </div>
          </div>

          <ul className="popup-menu">
             
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