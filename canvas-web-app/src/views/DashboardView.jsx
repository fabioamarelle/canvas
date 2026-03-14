import '../styles/Dashboard.css';
import LogoutButton from '../components/auth/LogoutButton';
import logo_banner from '../assets/logo_banner.png';
import CreateWhiteboardPopup from '../components/dashboard/CreateWhiteboardPopup';
import UserProfilePopup from '../components/UserProfilePopup';
import Whiteboard from '../components/dashboard/Whiteboard'
import apiClient from '../services/api/apiClient';
import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import { Link } from 'react-router-dom';
function DashboardView() {

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [whiteboards, setWhiteboards] = useState([]);

  async function deleteWhiteboard(id) {
    try {
      await apiClient.delete('/whiteboards/' + id)
        .then(response => setWhiteboards(response.data));

      await getWhiteboards();

    } catch (error) {
      console.log(error)
    }
  };

  async function getWhiteboards() {

    try {
      await apiClient.get('/users/' + localStorage.getItem('userId') + '/whiteboards')
        .then(response => setWhiteboards(response.data));

    } catch (error) {
      console.log(error)
    }
  };

  useEffect(() => { getWhiteboards(); }, []);

  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="header-left">
          <Link to="/dashboard">
            <img className="header-logo-banner" src={logo_banner}></img>
          </Link>
        </div>
        <div className="header-right" style={{ position: 'relative' }}>
          <div className="avatar-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <Avatar id={localStorage.getItem('userId')} />
          </div>

          {isProfileOpen && (
            <UserProfilePopup
              onClose={() => setIsProfileOpen(false)}
            />
          )}
        </div>
      </header>

      <main className="dashboard-main">
        <h2>Les meves pissarres</h2>
        <div className="whiteboard-grid">
          <div className="create-card-wrapper">
            <CreateWhiteboardPopup onSuccess={() => getWhiteboards()} />
          </div>

          {whiteboards.length > 0 ? (
            whiteboards.map(whiteboard => (
              <Whiteboard
                key={whiteboard.id}
                id={whiteboard.id}
                name={whiteboard.name}
                onDelete={deleteWhiteboard}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>Encara no tens cap pissarra. Crea la primera!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardView
