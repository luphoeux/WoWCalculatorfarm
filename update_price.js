const fs = require('fs');

async function main() {
    try {
        const clientId = process.env.BLIZZARD_CLIENT_ID;
        const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET environment variables');
            process.exit(1);
        }

        // 1. Get OAuth Token
        const authResponse = await fetch('https://oauth.battle.net/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });

        if (!authResponse.ok) {
            throw new Error(`Failed to authenticate with Blizzard: ${authResponse.statusText}`);
        }

        const authData = await authResponse.json();
        const accessToken = authData.access_token;

        // 2. Get WoW Token Price (US Region - NA)
        const usResponse = await fetch(`https://us.api.blizzard.com/data/wow/token/index?namespace=dynamic-us&locale=en_US`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Battlenet-Namespace': 'dynamic-us'
            }
        });
        
        let priceNA = 0;
        let timestampNA = 0;
        if (usResponse.ok) {
            const tokenData = await usResponse.json();
            priceNA = Math.floor(tokenData.price / 10000);
            timestampNA = tokenData.last_updated_timestamp || 0;
        } else {
            console.warn(`Failed to fetch NA token price: ${await usResponse.text()}`);
        }

        // 3. Get WoW Token Price (EU Region)
        const euResponse = await fetch(`https://eu.api.blizzard.com/data/wow/token/index?namespace=dynamic-eu&locale=en_GB`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Battlenet-Namespace': 'dynamic-eu'
            }
        });
        
        let priceEU = 0;
        let timestampEU = 0;
        if (euResponse.ok) {
            const tokenDataEU = await euResponse.json();
            priceEU = Math.floor(tokenDataEU.price / 10000);
            timestampEU = tokenDataEU.last_updated_timestamp || 0;
        } else {
            console.warn(`Failed to fetch EU token price: ${await euResponse.text()}`);
        }

        // 4. Save to JSON file with History
        const apiTimestamp = Math.max(timestampNA, timestampEU) || Date.now();
        const lastUpdatedDate = new Date(apiTimestamp);

        let data = {};
        try {
            const raw = fs.readFileSync('token_price.json', 'utf8');
            data = JSON.parse(raw);
        } catch (e) {
            data = { history: [], stats: { NA: {}, EU: {} } };
        }

        data.NA = priceNA;
        data.EU = priceEU;
        data.lastUpdated = lastUpdatedDate.toISOString();
        
        if (!data.history) data.history = [];
        if (!data.stats) data.stats = { NA: {}, EU: {} };

        // Append new data point
        data.history.push({
            timestamp: apiTimestamp,
            NA: priceNA,
            EU: priceEU
        });

        // Prune history older than 7 days (7 * 24 * 60 * 60 * 1000 = 604800000 ms)
        const sevenDaysAgo = apiTimestamp - 604800000;
        data.history = data.history.filter(pt => pt.timestamp >= sevenDaysAgo);

        // Calculate 24h stats
        const day24 = apiTimestamp - (24 * 60 * 60 * 1000);
        let minNA24 = Infinity, maxNA24 = -Infinity;
        let minEU24 = Infinity, maxEU24 = -Infinity;

        data.history.forEach(pt => {
            if (pt.timestamp >= day24) {
                if (pt.NA < minNA24) minNA24 = pt.NA;
                if (pt.NA > maxNA24) maxNA24 = pt.NA;
                if (pt.EU < minEU24) minEU24 = pt.EU;
                if (pt.EU > maxEU24) maxEU24 = pt.EU;
            }
        });

        data.stats.NA = { "24h_low": minNA24, "24h_high": maxNA24 };
        data.stats.EU = { "24h_low": minEU24, "24h_high": maxEU24 };

        fs.writeFileSync('token_price.json', JSON.stringify(data, null, 2));
        console.log(`Successfully updated token prices: NA=${priceNA}, EU=${priceEU}`);
    } catch (error) {
        console.error('Error updating price:', error);
        process.exit(1);
    }
}

main();
