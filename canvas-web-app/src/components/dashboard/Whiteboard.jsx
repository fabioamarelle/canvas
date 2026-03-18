import '../../styles/Whiteboard.css';
import { useNavigate } from 'react-router-dom';
import ShareWhiteboardPopup from './ShareWhiteboardPopup';
import apiClient from '../../services/api/apiClient';

const Whiteboard = ({ id, name, onDelete, userRole }) => {
  const navigate = useNavigate();
  
  const isOwner = userRole === 'OWNER';
  const currentUserId = localStorage.getItem('userId');

  const handleCardClick = () => {
    navigate(`/whiteboard/${id}`);
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    
    if (isOwner) {
      if (window.confirm(`Do you want to delete "${name}"?`)) {
        await apiClient.delete('/whiteboards/' + id);
        onDelete(id);
      }
    } else if (window.confirm(`Do you want to remove "${name}"?`)) {
        await apiClient.delete(`/whiteboards/${id}/collaborators/${currentUserId}`);
        onDelete(id);
    }
  };

  return (
    <div className="whiteboard-card" onClick={handleCardClick}>
      <div className="whiteboard-card-header">
        <h3 className="whiteboard-title">{name ? name : "Whiteboard"}</h3>
      </div>
      <div className="whiteboard-card-footer">
        <ShareWhiteboardPopup id={id} currentUserRole={userRole}/>

        <button 
          className="delete-btn" 
          onClick={handleDeleteClick}
        >
          {isOwner ? "Delete" : "Remove"}
        </button>
      </div>
    </div>
  );
};

export default Whiteboard;