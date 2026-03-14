import '../../styles/Whiteboard.css';
import { useState } from 'react';
import apiClient from '../../services/api/apiClient';
import { useParams } from 'react-router-dom';


const AddImagePopup = ({ onSuccess }) => {
    const { id } = useParams();
    const [isOpen, setIsOpen] = useState(false);
    

    return (
        <>
            <div className="create-board-trigger" onClick={() => setIsOpen(true)}>
                <span>+ Crear nova pissarra</span>
            </div>

            {isOpen && (
                <div className="popup-overlay" onClick={() => setIsOpen(false)}>
                    <form
                        className="create-whiteboard-form"
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>Crea la teva pissarra</h2>

                        <input
                            name="name"
                            placeholder="Nom de la pissarra"
                            value={formData.name}
                            onChange={handleChange}
                            autoFocus
                            required
                        />

                        <div className="form-actions">
                            <button type="submit" className="confirm-btn">Crear</button>
                            <button type="button" className="cancel-btn" onClick={() => setIsOpen(false)}>Cancel·lar</button>
                        </div>

                        {message && <p className="status-message">{message}</p>}
                    </form>
                </div>
            )}
        </>
    );
};

export default AddImagePopup;