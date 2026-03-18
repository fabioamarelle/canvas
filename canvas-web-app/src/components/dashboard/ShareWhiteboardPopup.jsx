import '../../styles/ShareWhiteboardPopup.css';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import apiClient from '../../services/api/apiClient';

const ShareWhiteboardPopup = ({ id, currentUserRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', role: 'VIEWER' });
    const [message, setMessage] = useState('');
    const [collaborators, setCollaborators] = useState([]);

    const canInvite = currentUserRole === 'OWNER' || currentUserRole === 'EDITOR';
    const canManageRoles = currentUserRole === 'OWNER';

    useEffect(() => {
        if (isOpen) {
            const fetchCollaborators = async () => {
                try {
                    const res = await apiClient.get(`/whiteboards/${id}/collaborators`);
                    setCollaborators(res.data);
                } catch (error) {}
            };
            fetchCollaborators();
        }
    }, [isOpen, id]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleCopyLink = (e) => {
        e.stopPropagation();
        const link = `${window.location.origin}/whiteboard/${id}`;
        navigator.clipboard.writeText(link);
        setMessage('Link copied to clipboard.');
        setTimeout(() => setMessage(''), 3000);
    };

    const handleShare = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!canInvite || !formData.email) return; 
        
        setIsLoading(true);

        try {
            const res = await apiClient.post(`/whiteboards/${id}/collaborators`, { 
                email: formData.email, 
                role: formData.role 
            });
            
            setCollaborators([...collaborators, res.data]);
            setFormData({ email: '', role: 'VIEWER' });
            setMessage('Added user successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.response?.data?.message || "Error adding collaborator.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        if (!canManageRoles) return;

        try {
            if (newRole === 'REMOVE') {
                await apiClient.delete(`/whiteboards/${id}/collaborators/${userId}`);
                setCollaborators(prev => prev.filter(c => c.id !== userId));
            } else {
                await apiClient.put(`/whiteboards/${id}/collaborators/${userId}`, { role: newRole });
                setCollaborators(prev => prev.map(c => c.id === userId ? { ...c, permissionType: newRole } : c));
            }
        } catch (error) {
            setMessage("Error updating permissions.");
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <>
            <button 
                className="share-trigger-btn" 
                onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
            >
                Share
            </button>

            {isOpen && createPortal(
                <div 
                    className="share-popup-overlay" 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                >
                    <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="share-modal-header">
                            <h2>Share Whiteboard</h2>
                            <button className="share-close-btn" onClick={() => setIsOpen(false)}>✕</button>
                        </div>

                        {canInvite && (
                            <form className="share-add-section" onSubmit={handleShare}>
                                <div className="share-input-group">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Invite users (email)"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoFocus
                                    />
                                    <select name="role" value={formData.role} onChange={handleChange}>
                                        <option value="VIEWER">Viewer</option>
                                        <option value="EDITOR">Editor</option>
                                    </select>
                                </div>
                                {formData.email && (
                                    <button type="submit" className="share-primary-btn" disabled={isLoading}>
                                        {isLoading ? 'Sharing...' : 'Share'}
                                    </button>
                                )}
                            </form>
                        )}

                        <div className="share-collab-list">
                            <h3>Collaborators</h3>
                            {collaborators.map(user => {
                                const displayRole = (user.permissionType || 'VIEWER').toUpperCase();
                                
                                return (
                                    <div key={user.id} className="share-collab-item">
                                        <div className="share-collab-info">
                                            <div className="share-avatar">
                                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div className="share-details">
                                                <span className="share-name">{user.name || 'Unknown User'}</span>
                                                <span className="share-email">{user.email}</span>
                                            </div>
                                        </div>
                                        
                                        {displayRole === 'OWNER' || !canManageRoles ? (
                                            <span className="share-owner-label">
                                                {displayRole.charAt(0) + displayRole.slice(1).toLowerCase()}
                                            </span>
                                        ) : (
                                            <select 
                                                className="share-role-selector"
                                                value={displayRole} 
                                                onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                            >
                                                <option value="VIEWER">Viewer</option>
                                                <option value="EDITOR">Editor</option>
                                                <option value="REMOVE" className="share-danger-option">Remove</option>
                                            </select>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {message && <div className="share-status-message">{message}</div>}

                        <div className="share-modal-footer">
                            <button className="share-secondary-btn" onClick={handleCopyLink} type="button">
                                Copy link
                            </button>
                            <button className="share-primary-btn" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} type="button">
                                Done
                            </button>
                        </div>
                    </div>
                </div>, 
                document.body
            )}
        </>
    );
};

export default ShareWhiteboardPopup;