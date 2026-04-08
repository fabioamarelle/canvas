import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from '../services/api/apiClient';
import Canvas from '../components/whiteboard/Canvas';
import ShareWhiteboardPopup from '../components/dashboard/ShareWhiteboardPopup';
import '../styles/WhiteboardEditor.css';

function WhiteboardEditorView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  let currentUserId = localStorage.getItem('userId');
  
  if (!currentUserId) {
    currentUserId = searchParams.get("id");
    if (currentUserId) {
      localStorage.setItem('userId', currentUserId);
    }
  }

  const [boardInfo, setBoardInfo] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState('VIEWER');

  useEffect(() => {
    if (id) {
      getWhiteboardData(id);
      getUserRole(id);
    }
  }, [id, currentUserId]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUserId) return;
      
      try {
        const response = await apiClient.get(`/users/${currentUserId}`);
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUser();
  }, [currentUserId]);

  async function getWhiteboardData(boardId) {
    try {
      const response = await apiClient.get(`/whiteboards/${boardId}`);
      setBoardInfo(response.data);
    } catch (error) {
      console.error("Error fetching whiteboard data:", error);
    }
  }

  async function getUserRole(boardId) {
    if (!currentUserId) return; // Guard clause
    
    try {
      const response = await apiClient.get(`/whiteboards/${boardId}/collaborators`);
      const user = response.data.find(collab => collab.id == currentUserId);
      
      if (user && user.permissionType) {
        setUserRole(user.permissionType.toUpperCase()); 
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      setUserRole('VIEWER');
    }
  }

  const isOwner = boardInfo ? boardInfo.ownerId == currentUserId : false;
  const role = isOwner ? 'OWNER' : userRole;
  const canEdit = role === 'OWNER' || role === 'EDITOR';

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h2 className="board-title">
            <span className="board-title-text">{boardInfo?.name || "Whiteboard"}</span>
            {!canEdit && <span className="read-only-badge">Read-only</span>}
          </h2>
        </div>
        <div className="header-right">
          {canEdit && 
            <ShareWhiteboardPopup 
              id={id}
              currentUserRole={role}
            />
          }
        </div>
      </header>
      
      <main className="canvas-area">
        <Canvas 
          canEdit={canEdit}
          userName={userData ? `@${userData.username}` : '@usuari'} 
          readOnly={!canEdit} 
        />
      </main>
    </div>
  );
}

export default WhiteboardEditorView;