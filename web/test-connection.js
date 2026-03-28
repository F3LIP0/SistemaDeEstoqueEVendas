require('dotenv').config();
const { Pool } = require('pg');
// Força IPv4
const net = require('net');
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(...args) {
    if (args[0] && typeof args[0] === 'object') {
        args[0].family = 4;
    }
    return originalConnect.apply(this, args);
};


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testarConexao() {
    try {
        const result = await pool.query('SELECT NOW() as hora, version() as versao');
        console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
        console.log('Hora do servidor:', result.rows[0].hora);
        console.log('Versão PostgreSQL:', result.rows[0].versao.substring(0, 50));
        
        // Verificar se as tabelas existem
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log(`\n📊 Tabelas encontradas: ${tables.rows.length}`);
        if (tables.rows.length > 0) {
            console.log('Primeiras 10 tabelas:');
            tables.rows.slice(0, 10).forEach(t => console.log(`  - ${t.table_name}`));
        }
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        await pool.end();
        process.exit(1);
    }
}

testarConexao();
