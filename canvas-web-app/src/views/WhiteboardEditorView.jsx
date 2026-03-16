import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import apiClient from '../services/api/apiClient';
import Canvas from '../components/whiteboard/Canvas';
import '../styles/WhiteboardEditor.css';

function WhiteboardEditorView() {
  const { id } = useParams(); 
  const [boardInfo, setBoardInfo] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [userData, setUserData] = useState(null);
  
  const [userRole, setUserRole] = useState('VIEWER');

  useEffect(() => {
    if (id) {
      getWhiteboardData(id);
      getUserRole(id);
    }
  }, [id]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get('/users/' + localStorage.getItem('userId'));
        setUserData(response.data);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    fetchUser();
  }, []);

  async function getWhiteboardData(boardId) {
    try {
      const response = await apiClient.get(`/whiteboards/${boardId}`);
      setBoardInfo(response.data);
    } catch (error) {
      console.error("Error loading whiteboard info:", error);
    }
  }

  async function getUserRole(boardId) {
    try {
        const currentUserId = localStorage.getItem('userId');
        const res = await apiClient.get(`/whiteboards/${boardId}/collaborators`);
        
        const me = res.data.find(collab => collab.id === currentUserId);
        
        if (me) {
            const myRole = me.permissionType || me.role; 
            setUserRole(myRole); 
        } else {
            setUserRole('VIEWER');
        }
    } catch (error) {
        console.error("Error loading user permissions:", error);
    }
  }

  const isOwnerFallback = boardInfo && boardInfo.ownerId === localStorage.getItem('userId');
  

  const handleToolClick = (tool) => {
    if (selectedElement === tool) {
      setSelectedElement(null);
    } else {
      setSelectedElement(tool);
    }
  };

  const canEdit = userRole === 'OWNER' || userRole === 'EDITOR' || isOwnerFallback;

  return (
    <div className="editor-container">
      <header className="editor-header">
        <button className="back-button" onClick={() => window.history.back()}>
          <span style={{ fontSize: '15px' }}>↩</span> 
        </button>
        <h2>{boardInfo?.name || "Whiteboard"} {!canEdit && <span style={{fontSize:'12px', color:'#666', marginLeft:'10px'}}>(Read-only)</span>}</h2>
      </header>
      
      {canEdit && (
        <div className='toolbar'>
          {['Text', 'Image', 'Note', 'Drawing', 'Eraser'].map((type) => (
            <button 
              key={type}
              onClick={() => handleToolClick(type)}
              className={`element-button ${selectedElement === type ? "active" : "inactive"}`}
              title={selectedElement === type ? "Click to deselect" : `Select ${type}`}
            >
              {type}
            </button>
          ))}
        </div> 
      )}

      <main className="canvas-area">
        <Canvas 
            activeTool={canEdit ? selectedElement : null} 
            userName={userData ? `@${userData.username}` : '@usuari'} 
            readOnly={!canEdit} 
        />
      </main>
    </div>
  );
}

export default WhiteboardEditorView;