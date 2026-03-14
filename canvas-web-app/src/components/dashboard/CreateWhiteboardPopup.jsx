import '../../styles/Whiteboard.css';
import { useState } from 'react';
import apiClient from '../../services/api/apiClient';


const CreateWhiteboardPopup = ({ onSuccess }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        ownerId: '',
    });

    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            await apiClient.post(
                '/whiteboards', {
                ...formData,
                ownerId: localStorage.getItem('userId')
            }
            );

            setTimeout(() => {
                if (onSuccess) onSuccess();
                setIsOpen(false);
            }, 200);

        } catch (error) {
            console.log(error)
            if (error.response && error.response.data) {
                setMessage(error.response.data.message);
            } else {
                setMessage("No s'ha pogut connectar amb el servidor.");
            }
        }
    };

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

export default CreateWhiteboardPopup;