import React, { useEffect, useState } from 'react';
import axios from 'axios';

function SpotifyComponent() {
    const [html, setHtml] = useState(null);

    useEffect(() => {
        const interval = setInterval(() => {
            axios.get('http://127.0.0.1:5000/spotify')
                .then(response => setHtml(response.data))
                .catch(error => console.error(error));
        }, 10000); // Fetches every 5 seconds

        // This is run when the component unmounts
        return () => clearInterval(interval);
    }, []); // Empty dependency array means this effect runs once when the component mounts and never again

    return (
        <div dangerouslySetInnerHTML={{ __html: html == null ? 'Loading' : html}} />
    );
}

export default SpotifyComponent;
