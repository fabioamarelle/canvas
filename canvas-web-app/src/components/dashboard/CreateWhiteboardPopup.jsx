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
                setMessage("Error connecting to server.");
            }
        }
    };

    return (
        <>
            <div className="create-board-trigger" onClick={() => setIsOpen(true)}>
                <span>+ New whiteboard</span>
            </div>

            {isOpen && (
                <div className="popup-overlay" onClick={() => setIsOpen(false)}>
                    <form
                        className="create-whiteboard-form"
                        onSubmit={handleSubmit}
                        onClick={(e) => e.stopPropagation()}
                        autocomplete="off"
                    >
                        <h2>Create whiteboard</h2>

                        <label>Name</label>
                        <input
                            name="name"
                            placeholder="Whiteboard name"
                            value={formData.name}
                            onChange={handleChange}
                            autoFocus
                            required
                        />

                        <div className="form-actions">
                            <button type="submit" className="confirm-btn">Create</button>
                            <button type="button" className="cancel-btn" onClick={() => setIsOpen(false)}>Cancel</button>
                        </div>

                        {message && <p className="status-message">{message}</p>}
                    </form>
                </div>
            )}
        </>
    );
};

export default CreateWhiteboardPopup;