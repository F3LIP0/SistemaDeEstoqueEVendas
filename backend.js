// backend.js - Sistema COMPLETO com self-healing do banco
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// SELF-HEALING DO BANCO DE DADOS
// ============================================

function criarBancoAutomatico() {
    console.log('🔧 Verificando banco de dados...');
    
    // Primeiro conecta sem banco
    const conn = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: ''
    });

    conn.connect((err) => {
        if (err) {
            console.log('⚠️  XAMPP não está rodando!');
            console.log('👉 Abra o XAMPP e inicie o MySQL');
            return;
        }

        // Cria banco se não existir
        conn.query('CREATE DATABASE IF NOT EXISTS sistema_estoque', (err) => {
            if (err) throw err;
            
            console.log('✅ Banco "sistema_estoque" criado/verificado');
            
            // Agora conecta ao banco específico
            global.db = mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'sistema_estoque'
            });
            
            global.db.connect((err) => {
                if (err) throw err;
                console.log('✅ Conectado ao MySQL/XAMPP');
                criarTabelas();
            });
        });
    });
}

function criarTabelas() {
    const tabelas = [
        `CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) UNIQUE NOT NULL,
            senha VARCHAR(255) NOT NULL,
            nome VARCHAR(100) NOT NULL,
            tipo ENUM('admin', 'gerente', 'funcionario') DEFAULT 'funcionario',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS produtos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo VARCHAR(50) UNIQUE NOT NULL,
            nome VARCHAR(200) NOT NULL,
            descricao TEXT,
            preco_custo DECIMAL(10,2) NOT NULL,
            preco_venda DECIMAL(10,2) NOT NULL,
            estoque INT DEFAULT 0,
            estoque_minimo INT DEFAULT 10,
            categoria VARCHAR(100),
            ativo BOOLEAN DEFAULT TRUE,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS vendas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo VARCHAR(50) UNIQUE NOT NULL,
            cliente_nome VARCHAR(200),
            total DECIMAL(10,2) NOT NULL,
            forma_pagamento VARCHAR(50),
            status VARCHAR(20) DEFAULT 'concluida',
            usuario_id INT,
            data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS itens_venda (
            id INT AUTO_INCREMENT PRIMARY KEY,
            venda_id INT NOT NULL,
            produto_id INT NOT NULL,
            quantidade INT NOT NULL,
            preco_unitario DECIMAL(10,2) NOT NULL,
            subtotal DECIMAL(10,2) AS (quantidade * preco_unitario) STORED,
            FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
            FOREIGN KEY (produto_id) REFERENCES produtos(id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS movimentacoes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            produto_id INT NOT NULL,
            tipo ENUM('entrada', 'saida') NOT NULL,
            quantidade INT NOT NULL,
            motivo VARCHAR(200),
            usuario_id INT,
            data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (produto_id) REFERENCES produtos(id),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS ponto (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            saida TIMESTAMP NULL,
            horas DECIMAL(5,2) AS (
                TIMESTAMPDIFF(MINUTE, entrada, saida) / 60
            ) STORED,
            data DATE AS (DATE(entrada)) STORED,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )`
    ];

    tabelas.forEach((sql, i) => {
        global.db.query(sql, (err) => {
            if (err) console.log(`❌ Erro tabela ${i}:`, err.message);
        });
    });
    
    console.log('✅ Tabelas criadas/verificadas');
    
    // Cria usuário admin se não existir
    const senhaHash = bcrypt.hashSync('admin123', 10);
    const sql = `INSERT IGNORE INTO usuarios (email, senha, nome, tipo) 
                 VALUES ('admin@empresa.com', ?, 'Administrador', 'admin')`;
    
    global.db.query(sql, [senhaHash], (err) => {
        if (err) console.log('❌ Erro ao criar admin:', err.message);
        else console.log('👤 Admin criado: admin@empresa.com / admin123');
    });
}

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================================

function autenticar(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) return res.status(401).json({ erro: 'Token necessário' });
    
    try {
        const decoded = jwt.verify(token, 'secreto');
        req.usuario = decoded;
        next();
    } catch {
        res.status(401).json({ erro: 'Token inválido' });
    }
}

function autorizar(...tipos) {
    return (req, res, next) => {
        if (!tipos.includes(req.usuario.tipo)) {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        next();
    };
}

// ============================================
// ROTAS DA API
// ============================================

// Login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    
    global.db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro no servidor' });
        if (results.length === 0) return res.status(401).json({ erro: 'Credenciais inválidas' });
        
        const usuario = results[0];
        const senhaValida = bcrypt.compareSync(senha, usuario.senha);
        
        if (!senhaValida) return res.status(401).json({ erro: 'Credenciais inválidas' });
        
        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome, tipo: usuario.tipo },
            'secreto',
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo
            }
        });
    });
});

// Registrar usuário (apenas admin/gerente)
app.post('/api/usuarios', autenticar, autorizar('admin', 'gerente'), (req, res) => {
    const { email, senha, nome, tipo } = req.body;
    
    if (!['admin', 'gerente', 'funcionario'].includes(tipo)) {
        return res.status(400).json({ erro: 'Tipo inválido' });
    }
    
    const senhaHash = bcrypt.hashSync(senha, 10);
    
    global.db.query(
        'INSERT INTO usuarios (email, senha, nome, tipo) VALUES (?, ?, ?, ?)',
        [email, senhaHash, nome, tipo],
        (err, result) => {
            if (err) return res.status(500).json({ erro: 'Email já existe' });
            res.status(201).json({ id: result.insertId, mensagem: 'Usuário criado' });
        }
    );
});

// Dashboard - Estatísticas
app.get('/api/dashboard/estatisticas', autenticar, (req, res) => {
    const queries = [
        'SELECT SUM(total) as total_vendas FROM vendas WHERE MONTH(data) = MONTH(CURDATE())',
        'SELECT COUNT(*) as produtos_baixo FROM produtos WHERE estoque <= estoque_minimo AND ativo = TRUE',
        'SELECT COUNT(*) as pedidos_hoje FROM vendas WHERE DATE(data) = CURDATE()',
        'SELECT SUM(total * 0.3) as lucro_mensal FROM vendas WHERE MONTH(data) = MONTH(CURDATE())'
    ];
    
    const resultados = {};
    let completas = 0;
    
    queries.forEach((query, i) => {
        global.db.query(query, (err, results) => {
            const chaves = ['vendas_mes', 'estoque_baixo', 'pedidos_hoje', 'lucro_mes'];
            resultados[chaves[i]] = results[0][Object.keys(results[0])[0]] || 0;
            completas++;
            
            if (completas === queries.length) {
                res.json(resultados);
            }
        });
    });
});

// Produtos
app.get('/api/produtos', (req, res) => {
    global.db.query('SELECT * FROM produtos WHERE ativo = TRUE', (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar produtos' });
        res.json(results);
    });
});

app.post('/api/produtos', autenticar, autorizar('admin', 'gerente'), (req, res) => {
    const { codigo, nome, descricao, preco_custo, preco_venda, estoque, categoria } = req.body;
    
    global.db.query(
        `INSERT INTO produtos (codigo, nome, descricao, preco_custo, preco_venda, estoque, categoria) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [codigo, nome, descricao, preco_custo, preco_venda, estoque || 0, categoria],
        (err, result) => {
            if (err) return res.status(500).json({ erro: 'Código já existe' });
            res.status(201).json({ id: result.insertId, mensagem: 'Produto criado' });
        }
    );
});

// Vendas
app.get('/api/vendas', autenticar, (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    global.db.query(
        'SELECT * FROM vendas ORDER BY data DESC LIMIT ?',
        [limit],
        (err, results) => {
            if (err) return res.status(500).json({ erro: 'Erro ao buscar vendas' });
            res.json(results);
        }
    );
});

// Ponto (apenas gerente+ vê todos)
app.get('/api/ponto', autenticar, (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];
    
    if (req.usuario.tipo === 'funcionario') {
        global.db.query(
            'SELECT * FROM ponto WHERE usuario_id = ? AND data = ?',
            [req.usuario.id, hoje],
            (err, results) => res.json(results)
        );
    } else {
        global.db.query(
            `SELECT p.*, u.nome 
             FROM ponto p 
             JOIN usuarios u ON p.usuario_id = u.id 
             WHERE p.data = ?`,
            [hoje],
            (err, results) => res.json(results)
        );
    }
});

// Movimentações (apenas gerente+)
app.get('/api/movimentacoes', autenticar, autorizar('admin', 'gerente'), (req, res) => {
    global.db.query(
        `SELECT m.*, p.nome as produto_nome, u.nome as usuario_nome 
         FROM movimentacoes m
         JOIN produtos p ON m.produto_id = p.id
         LEFT JOIN usuarios u ON m.usuario_id = u.id
         ORDER BY m.data DESC LIMIT 50`,
        (err, results) => {
            if (err) return res.status(500).json({ erro: 'Erro ao buscar movimentações' });
            res.json(results);
        }
    );
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(3000, () => {
    console.log('🚀 Servidor rodando em http://localhost:3000');
    console.log('📌 Endpoints:');
    console.log('   POST /api/login              - Login');
    console.log('   GET  /api/produtos           - Listar produtos');
    console.log('   GET  /api/dashboard/estatisticas - Dashboard (com token)');
    console.log('   GET  /api/ponto              - Ponto (funcionario vê só o dele)');
    criarBancoAutomatico();
});