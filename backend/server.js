const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./poolup.db');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('User connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'JOIN_POOL') {
            // 1. Update SQL Database
            db.run(`UPDATE pools SET current_amount = current_amount + ? WHERE id = ?`, 
            [data.amount, data.poolId], function(err) {
                if (err) return console.error(err.message);

                // 2. Fetch New Total
                db.get(`SELECT current_amount FROM pools WHERE id = ?`, [data.poolId], (err, row) => {
                    // 3. Broadcast JSON update to all connected clients
                    const response = JSON.stringify({
                        type: 'POOL_UPDATED',
                        poolId: data.poolId,
                        newTotal: row.current_amount
                    });
                    
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) client.send(response);
                    });
                });
            });
        }
    });
});

console.log('Backend running on ws://localhost:8080');