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
  
  const currentUserId = localStorage.getItem('userId');


  async function getWhiteboards() {
    try {
      const response = await apiClient.get('/users/' + currentUserId + '/whiteboards');
      const whiteboards = response.data;
      if (!whiteboards) { 
        setWhiteboards(whiteboards);
        return;
      }
      const whiteboardsPermissions = await Promise.all(whiteboards.map(async (board) => {
        if (String(board.ownerId) === String(currentUserId)) {
          return { ...board, userRole: 'OWNER' };
        }

        try {
          const collabRes = await apiClient.get(`/whiteboards/${board.id}/collaborators`);
          const currentUserCollab = collabRes.data.find(c => c.id === currentUserId);
          
          const role = currentUserCollab ? (currentUserCollab.permissionType || 'VIEWER').toUpperCase() : 'VIEWER';
          
          return { ...board, userRole: role };
        } catch (error) {
          return { ...board, userRole: 'VIEWER' };
        }
      }));
      setWhiteboards(whiteboardsPermissions);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => { 
    getWhiteboards(); 
  }, [currentUserId]);

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
            <Avatar id={currentUserId} />
          </div>

          {isProfileOpen && (
            <UserProfilePopup
              onClose={() => setIsProfileOpen(false)}
            />
          )}
        </div>
      </header>

      <main className="dashboard-main">
        <h2>My whiteboards</h2>
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
                onDelete={() => getWhiteboards()}
                userRole={whiteboard.userRole} 
              />
            ))
          ) : (
            <div className="empty-state">
              <p>You don't have any whiteboards.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardView;