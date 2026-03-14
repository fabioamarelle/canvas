import { useEffect, useState } from 'react';
import { getGravatarUrl } from '../utils/Gravatar';

export default function Avatar({ id }) {
    const [url, setUrl] = useState('');

    useEffect(() => {
        getGravatarUrl(id).then(setUrl);
    }, [id]);

    return url ? <img src={url} alt="Avatar" style={{ borderRadius: '50%', width: '40px', filter: 'saturate(0.2) opacity(0.85) contrast(0.9)', backgroundColor: '#f4f5f7' }} /> : null;
}