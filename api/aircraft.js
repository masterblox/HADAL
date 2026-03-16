// API proxy for OpenSky to bypass CORS
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        // OpenSky credentials
        const username = 'arestheagent@gmail.com-api-client';
        const password = 'E9hWNjvQoXKWmguZcKBbrZSBvIHC5hlw';
        const authString = Buffer.from(`${username}:${password}`).toString('base64');
        
        // Fetch from OpenSky
        const response = await fetch('https://opensky-network.org/api/states/all?lamin=12&lamax=35&lomin=34&lomax=60', {
            headers: {
                'Authorization': `Basic ${authString}`
            }
        });
        
        if (!response.ok) {
            res.status(response.status).json({ error: 'OpenSky API error', states: [] });
            return;
        }
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy error', states: [] });
    }
}