import '../../styles/Whiteboard.css';
import { useNavigate } from 'react-router-dom';
import ShareWhiteboardPopup from './ShareWhiteboardPopup';

const Whiteboard = ({ id, name, onDelete }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/whiteboard/${id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm(`Vols esborrar la pissarra "${name}"?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="whiteboard-card" onClick={handleCardClick}>
      <div className="whiteboard-card-header">
        <h3 className="whiteboard-title">{name ? name : "Pissarra sense nom"}</h3>
      </div>
      <div className="whiteboard-card-footer">
        <ShareWhiteboardPopup id={id}/>

        <button className="delete-btn" onClick={handleDeleteClick}>
          Esborrar
        </button>
      </div>
    </div>
  );
};

export default Whiteboard;