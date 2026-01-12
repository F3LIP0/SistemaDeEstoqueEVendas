/**
 * Sistema de Estoque e Vendas - Backend API
 * 
 * @description API RESTful para gerenciamento de estoque, vendas e controle de ponto
 * @version 2.0.0
 * @database PostgreSQL
 */
require('dotenv').config();


const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { supabase } = require('./supabaseClient');
const path = require('path');

// Configurações de ambiente
const CONFIG = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'secreto_temporario_mudar_em_producao',
    JWT_EXPIRES: '24h',
    SALT_ROUNDS: 10,
    DB: process.env.DATABASE_URL || {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'inventory_system',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    }
};

// Inicialização do Express
const app = express();

// Middlewares
// CORS configurado para aceitar qualquer origem (Codespaces/localhost)
const corsOptions = {
    origin: true, // Permite qualquer origem
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight para todas as rotas

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir o frontend diretamente pelo backend (evita problemas de CORS/ports)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'sistema.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Backend online', timestamp: new Date().toISOString() });
});

// Pool de conexões PostgreSQL
const pool = typeof CONFIG.DB === 'string'
    ? new Pool({ connectionString: CONFIG.DB, ssl: { rejectUnauthorized: false } })
    : new Pool(CONFIG.DB);

// Testar conexão
pool.on('connect', () => {
    console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Erro inesperado no pool PostgreSQL:', err);
    process.exit(-1);
});

// ============================================
// FUNÇÕES AUXILIARES DO BANCO
// ============================================

/**
 * Executa query no banco de dados
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            console.log('Query executada', { duration, rows: res.rowCount });
        }
        return res;
    } catch (error) {
        console.error('❌ Erro na query:', error.message);
        throw error;
    }
}

/**
 * Sanitiza input para prevenir XSS
 */
function sanitize(input) {
    if (typeof input !== 'string') return input;
    return input.trim()
        .replace(/[<>]/g, '')
        .substring(0, 500); // Limita a 500 caracteres
}

/**
 * Verifica se o banco está inicializado
 */
async function verificarBanco() {
    try {
        if (supabase) {
            const { data, error } = await supabase
              .from('users')
              .select('user_id')
              .limit(1);
            if (error) throw error;
            console.log('✅ Conectado ao Supabase (HTTP)');
            await criarUsuarioAdminSupabase();
            return;
        }
        // Verifica se existe a tabela users
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        if (!result.rows[0].exists) {
            console.log('⚠️  Banco de dados não está inicializado!');
            console.log('📌 Execute o script SQL de criação do banco antes de iniciar o servidor.');
            process.exit(1);
        }
        
        console.log('✅ Estrutura do banco verificada');
        await criarUsuarioAdmin();
        
    } catch (error) {
        console.error('❌ Erro ao verificar banco:', error.message);
        process.exit(1);
    }
}

/**
 * Cria usuário administrador padrão se não existir
 */
async function criarUsuarioAdmin() {
    try {
        // Verifica se já existe admin
        const checkAdmin = await pool.query(
            'SELECT user_id FROM users WHERE username = $1',
            ['admin']
        );
        
        if (checkAdmin.rows.length > 0) {
            console.log('👤 Usuário admin já existe');
            return;
        }
        
        // Busca role_id de ADMIN
        const roleResult = await pool.query(
            "SELECT role_id FROM roles WHERE role_name = 'ADMIN'"
        );
        
        if (roleResult.rows.length === 0) {
            console.error('❌ Role ADMIN não encontrada no banco');
            return;
        }
        
        const adminRoleId = roleResult.rows[0].role_id;
        const senhaHash = await bcrypt.hash('admin123', CONFIG.SALT_ROUNDS);
        
        await pool.query(`
            INSERT INTO users (username, email, password_hash, role_id, full_name, phone, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, ['admin', 'admin@empresa.com', senhaHash, adminRoleId, 'Administrador do Sistema', '0000000000', true]);
        
        console.log('👤 Usuário admin criado com sucesso');
        console.log('📧 Email: admin@empresa.com');
        console.log('🔑 Senha: admin123');
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error.message);
    }
}

async function criarUsuarioAdminSupabase() {
    if (!supabase) return;
    try {
        const { data: exists, error: errExists } = await supabase
            .from('users')
            .select('user_id')
            .eq('username', 'admin')
            .limit(1);
        if (errExists) throw errExists;
        if (exists && exists.length > 0) {
            console.log('👤 Usuário admin já existe (Supabase)');
            return;
        }
        const senhaHash = await bcrypt.hash('admin123', CONFIG.SALT_ROUNDS);
        const { data: roles, error: errRole } = await supabase
            .from('roles')
            .select('role_id')
            .eq('role_name', 'ADMIN')
            .limit(1);
        if (errRole) throw errRole;
        if (!roles || roles.length === 0) {
            console.error('❌ Role ADMIN não encontrada no Supabase');
            return;
        }
        const adminRoleId = roles[0].role_id;
        const { error: errInsert } = await supabase
            .from('users')
            .insert({
                username: 'admin',
                email: 'admin@empresa.com',
                password_hash: senhaHash,
                role_id: adminRoleId,
                full_name: 'Administrador do Sistema',
                phone: '0000000000',
                is_active: true
            });
        if (errInsert) throw errInsert;
        console.log('👤 Usuário admin criado com sucesso (Supabase)');
    } catch (error) {
        console.error('❌ Erro ao criar usuário admin (Supabase):', error.message);
    }
}


// ============================================
// MIDDLEWARES DE AUTENTICAÇÃO E AUTORIZAÇÃO
// ============================================

/**
 * Middleware de autenticação via JWT
 * Verifica se o token é válido e adiciona dados do usuário na request
 */
function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ 
            erro: 'Token não fornecido',
            mensagem: 'É necessário fornecer um token de autenticação'
        });
    }
    
    const [scheme, token] = authHeader.split(' ');
    
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ 
            erro: 'Token mal formatado',
            mensagem: 'Use o formato: Bearer [token]'
        });
    }
    
    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ 
            erro: 'Token inválido ou expirado',
            mensagem: 'Faça login novamente'
        });
    }
}

/**
 * Middleware de autorização por nível de acesso
 * Verifica se o usuário tem permissão para acessar a rota
 * 
 * @param {...number} niveis - Níveis de acesso permitidos (1=Employee, 2=Manager, 3=Admin)
 */
function autorizar(...niveis) {
    return (req, res, next) => {
        if (!req.usuario || !req.usuario.role_level) {
            return res.status(401).json({ 
                erro: 'Usuário não autenticado',
                mensagem: 'Faça login novamente'
            });
        }
        
        if (!niveis.includes(req.usuario.role_level)) {
            return res.status(403).json({ 
                erro: 'Acesso negado',
                mensagem: `Esta ação requer nível de acesso: ${niveis.join(', ')}`
            });
        }
        
        next();
    };
}

// ============================================
// ROTAS DA API
// ============================================

/**
 * @route POST /api/login
 * @desc Autentica usuário e retorna token JWT
 * @access Público
 */
app.post('/api/login', async (req, res) => {
    const { email, senha, username } = req.body;
    
    // Validação básica
    if ((!email && !username) || !senha) {
        return res.status(400).json({ 
            erro: 'Dados incompletos',
            mensagem: 'Email/username e senha são obrigatórios'
        });
    }
    
    try {
        if (supabase) {
            const ident = email || username;
            const { data: usuarios, error: errUser } = await supabase
                .from('users')
                .select('*')
                .or(`email.eq.${ident},username.eq.${ident}`)
                .eq('is_active', true)
                .limit(1);
            if (errUser) throw errUser;
            if (!usuarios || usuarios.length === 0) {
                return res.status(401).json({ 
                    erro: 'Credenciais inválidas',
                    mensagem: 'Email/username ou senha incorretos'
                });
            }
            const usuario = usuarios[0];
            const senhaValida = await bcrypt.compare(senha, usuario.password_hash);
            if (!senhaValida) {
                return res.status(401).json({ 
                    erro: 'Credenciais inválidas',
                    mensagem: 'Email/username ou senha incorretos'
                });
            }
            const { data: roles, error: errRole } = await supabase
                .from('roles')
                .select('role_name, role_level')
                .eq('role_id', usuario.role_id)
                .limit(1);
            if (errRole) throw errRole;
            const role = roles && roles[0] ? roles[0] : { role_name: 'EMPLOYEE', role_level: 1 };
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('user_id', usuario.user_id);
            const token = jwt.sign(
                { 
                    id: usuario.user_id,
                    username: usuario.username,
                    nome: usuario.full_name, 
                    email: usuario.email,
                    role_name: role.role_name,
                    role_level: role.role_level
                },
                CONFIG.JWT_SECRET,
                { expiresIn: CONFIG.JWT_EXPIRES }
            );
            return res.json({
                sucesso: true,
                token,
                usuario: {
                    id: usuario.user_id,
                    username: usuario.username,
                    nome: usuario.full_name,
                    email: usuario.email,
                    role_name: role.role_name,
                    role_level: role.role_level
                }
            });
        }
        // Busca usuário por email ou username via Postgres
        const userQuery = `
            SELECT u.*, r.role_name, r.role_level 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE (u.email = $1 OR u.username = $1) AND u.is_active = true
        `;
        
        const result = await pool.query(userQuery, [email || username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                erro: 'Credenciais inválidas',
                mensagem: 'Email/username ou senha incorretos'
            });
        }
        
        const usuario = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.password_hash);
        
        if (!senhaValida) {
            return res.status(401).json({ 
                erro: 'Credenciais inválidas',
                mensagem: 'Email/username ou senha incorretos'
            });
        }
        
        // Atualiza last_login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
            [usuario.user_id]
        );
        
        // Gera token JWT
        const token = jwt.sign(
            { 
                id: usuario.user_id,
                username: usuario.username,
                nome: usuario.full_name, 
                email: usuario.email,
                role_name: usuario.role_name,
                role_level: usuario.role_level
            },
            CONFIG.JWT_SECRET,
            { expiresIn: CONFIG.JWT_EXPIRES }
        );
        
        res.json({
            sucesso: true,
            token,
            usuario: {
                id: usuario.user_id,
                username: usuario.username,
                nome: usuario.full_name,
                email: usuario.email,
                role_name: usuario.role_name,
                role_level: usuario.role_level
            }
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao processar login'
        });
    }
});

/**
 * @route POST /api/usuarios
 * @desc Registra novo usuário no sistema
 * @access Privado (Manager e Admin)
 */
app.post('/api/usuarios', autenticar, autorizar(2, 3), async (req, res) => {
    const { username, email, senha, full_name, phone, role_name } = req.body;
    
    // Validações
    if (!username || !email || !senha || !full_name) {
        return res.status(400).json({ 
            erro: 'Dados incompletos',
            mensagem: 'Username, email, senha e nome completo são obrigatórios'
        });
    }
    
    // Valida formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            erro: 'Email inválido',
            mensagem: 'Forneça um email válido'
        });
    }
    
    try {
        if (supabase) {
            const { data: conflitos } = await supabase
                .from('users')
                .select('user_id')
                .or(`username.eq.${username},email.eq.${email}`)
                .limit(1);
            if (conflitos && conflitos.length > 0) {
                return res.status(409).json({ erro: 'Usuário já existe', mensagem: 'Email ou username já está cadastrado' });
            }
            const { data: roles, error: errRole } = await supabase
                .from('roles')
                .select('role_id')
                .eq('role_name', role_name || 'EMPLOYEE')
                .limit(1);
            if (errRole) throw errRole;
            if (!roles || roles.length === 0) {
                return res.status(400).json({ erro: 'Role inválido', mensagem: 'Tipo de usuário não encontrado' });
            }
            const role_id = roles[0].role_id;
            const senhaHash = await bcrypt.hash(senha, CONFIG.SALT_ROUNDS);
            const { data, error } = await supabase
                .from('users')
                .insert({
                    username,
                    email,
                    password_hash: senhaHash,
                    role_id,
                    full_name,
                    phone: phone || null,
                    created_by: req.usuario.id
                })
                .select('user_id')
                .single();
            if (error) {
                if (error.code === '23505') {
                    return res.status(409).json({ erro: 'Usuário já existe', mensagem: 'Email ou username já está cadastrado' });
                }
                throw error;
            }
            return res.status(201).json({ sucesso: true, id: data.user_id, mensagem: 'Usuário criado com sucesso' });
        }
        // Fallback Postgres
        const roleQuery = 'SELECT role_id FROM roles WHERE role_name = $1';
        const roleResult = await pool.query(roleQuery, [role_name || 'EMPLOYEE']);
        if (roleResult.rows.length === 0) {
            return res.status(400).json({ erro: 'Role inválido', mensagem: 'Tipo de usuário não encontrado' });
        }
        const role_id = roleResult.rows[0].role_id;
        const senhaHash = await bcrypt.hash(senha, CONFIG.SALT_ROUNDS);
        const insertQuery = `
            INSERT INTO users (username, email, password_hash, role_id, full_name, phone, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING user_id
        `;
        const result = await pool.query(insertQuery, [
            username,
            email,
            senhaHash,
            role_id,
            full_name,
            phone || null,
            req.usuario.id
        ]);
        return res.status(201).json({ sucesso: true, id: result.rows[0].user_id, mensagem: 'Usuário criado com sucesso' });
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ 
                erro: 'Usuário já existe',
                mensagem: 'Email ou username já está cadastrado'
            });
        }
        
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao criar usuário'
        });
    }
});

/**
 * @route GET /api/usuarios
 * @desc Lista usuários ativos
 * @access Privado (Manager e Admin)
 */
app.get('/api/usuarios', autenticar, autorizar(2, 3), async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('users')
                .select('user_id, username, full_name, email, phone, is_active')
                .eq('is_active', true)
                .order('full_name', { ascending: true });
            if (error) throw error;
            return res.json({ sucesso: true, total: data.length, usuarios: data });
        }

        const sql = `
            SELECT user_id, username, full_name, email, phone, is_active
            FROM users
            WHERE is_active = true
            ORDER BY full_name
        `;
        const result = await pool.query(sql);
        res.json({ sucesso: true, total: result.rows.length, usuarios: result.rows });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao listar usuários'
        });
    }
});

/**
 * @route GET /api/dashboard/estatisticas
 * @desc Retorna estatísticas gerais do sistema
 * @access Privado
 */
app.get('/api/dashboard/estatisticas', autenticar, async (req, res) => {
    try {
        if (supabase) {
            const agora = new Date();
            const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
            const inicioProximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);
            const hojeInicio = new Date(); hojeInicio.setHours(0,0,0,0);
            const hojeFim = new Date(); hojeFim.setHours(23,59,59,999);

            const { data: vendasMesData, error: vendasMesErr } = await supabase
                .from('sales_orders')
                .select('total_amount, status, order_date')
                .gte('order_date', inicioMes.toISOString())
                .lt('order_date', inicioProximoMes.toISOString());
            if (vendasMesErr) throw vendasMesErr;
            const vendasMesValor = (vendasMesData || [])
                .filter(v => v.status !== 'CANCELLED')
                .reduce((sum, v) => sum + Number(v.total_amount || 0), 0);

            const { data: produtosData, error: prodErr } = await supabase
                .from('products')
                .select('current_stock, minimum_stock, is_active')
                .eq('is_active', true);
            if (prodErr) throw prodErr;
            const estoqueBaixoValor = (produtosData || [])
                .filter(p => Number(p.current_stock || 0) <= Number(p.minimum_stock || 0)).length;

            const { data: pedidosHojeData, error: pedidosErr } = await supabase
                .from('sales_orders')
                .select('order_id, order_date')
                .gte('order_date', hojeInicio.toISOString())
                .lt('order_date', hojeFim.toISOString());
            if (pedidosErr) throw pedidosErr;
            const pedidosHojeValor = (pedidosHojeData || []).length;

            const lucroMesValor = vendasMesValor * 0.3;

            return res.json({
                sucesso: true,
                vendas_mes: vendasMesValor,
                estoque_baixo: estoqueBaixoValor,
                pedidos_hoje: pedidosHojeValor,
                lucro_mes: lucroMesValor
            });
        }

        // Fallback Postgres
        const vendasMes = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) as valor
            FROM sales_orders
            WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE)
            AND status != 'CANCELLED'
        `);
        const estoqueBaixo = await pool.query(`
            SELECT COUNT(*) as valor
            FROM products
            WHERE current_stock <= minimum_stock AND is_active = true
        `);
        const pedidosHoje = await pool.query(`
            SELECT COUNT(*) as valor
            FROM sales_orders
            WHERE DATE(order_date) = CURRENT_DATE
        `);
        const lucroMes = await pool.query(`
            SELECT COALESCE(SUM(total_amount * 0.3), 0) as valor
            FROM sales_orders
            WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', CURRENT_DATE)
            AND status != 'CANCELLED'
        `);

        res.json({
            sucesso: true,
            vendas_mes: parseFloat(vendasMes.rows[0].valor),
            estoque_baixo: parseInt(estoqueBaixo.rows[0].valor),
            pedidos_hoje: parseInt(pedidosHoje.rows[0].valor),
            lucro_mes: parseFloat(lucroMes.rows[0].valor)
        });
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao buscar estatísticas'
        });
    }
});

/**
 * @route GET /api/produtos
 * @desc Lista todos os produtos ativos
 * @access Público
 */
app.get('/api/produtos', async (req, res) => {
    const { categoria, busca } = req.query;
    
    try {
        if (supabase) {
            let query = supabase
                .from('products')
                .select('*')
                .eq('is_active', true);
            if (busca) {
                query = query.or(`product_name.ilike.%${busca}%,sku.ilike.%${busca}%,barcode.ilike.%${busca}%`);
            }
            const { data, error } = await query.order('product_name', { ascending: true });
            if (error) throw error;
            return res.json({ sucesso: true, total: data.length, produtos: data });
        }
        let sql = `
            SELECT p.*, c.category_name, b.brand_name, u.unit_name, u.abbreviation
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN brands b ON p.brand_id = b.brand_id
            LEFT JOIN units u ON p.unit_id = u.unit_id
            WHERE p.is_active = true
        `;
        const params = [];
        let paramCount = 1;
        if (categoria) { sql += ` AND c.category_name = $${paramCount}`; params.push(categoria); paramCount++; }
        if (busca) { sql += ` AND (p.product_name ILIKE $${paramCount} OR p.sku ILIKE $${paramCount} OR p.barcode ILIKE $${paramCount})`; params.push(`%${busca}%`); paramCount++; }
        sql += ' ORDER BY p.product_name';
        const result = await pool.query(sql, params);
        res.json({ sucesso: true, total: result.rows.length, produtos: result.rows });
        
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao buscar produtos'
        });
    }
});

/**
 * @route POST /api/produtos
 * @desc Cria novo produto
 * @access Privado (Manager e Admin)
 */
app.post('/api/produtos', autenticar, autorizar(2, 3), async (req, res) => {
    const { 
        sku, barcode, product_name, description, category_id, brand_id, unit_id,
        cost_price, selling_price, minimum_stock, maximum_stock, current_stock,
        weight, dimensions, is_perishable, tax_rate, image_url
    } = req.body;
    
    // Validações
    if (!sku || !product_name || !cost_price || !selling_price || !unit_id) {
        return res.status(400).json({ 
            erro: 'Dados incompletos',
            mensagem: 'SKU, nome, preço de custo, preço de venda e unidade são obrigatórios'
        });
    }
    
    if (cost_price < 0 || selling_price < 0) {
        return res.status(400).json({ 
            erro: 'Preços inválidos',
            mensagem: 'Preços não podem ser negativos'
        });
    }

    // Validação adicional: preço de venda >= preço de custo
    if (typeof cost_price === 'number' && typeof selling_price === 'number' && selling_price < cost_price) {
        return res.status(400).json({
            erro: 'Preço de venda inválido',
            mensagem: 'Preço de venda não pode ser menor que o preço de custo'
        });
    }

    // Validação adicional: estoque mínimo <= estoque máximo (quando ambos fornecidos)
    const minInformado = minimum_stock !== undefined && minimum_stock !== null;
    const maxInformado = maximum_stock !== undefined && maximum_stock !== null;
    if (minInformado && maxInformado && Number(minimum_stock) > Number(maximum_stock)) {
        return res.status(400).json({
            erro: 'Estoque inválido',
            mensagem: 'Estoque mínimo não pode ser maior que o estoque máximo'
        });
    }
    
    try {
        if (supabase) {
            const { data: skuDup } = await supabase
                .from('products')
                .select('product_id')
                .eq('sku', sku)
                .limit(1);
            if (skuDup && skuDup.length > 0) {
                return res.status(409).json({ erro: 'Produto já existe', mensagem: 'Já existe um produto com este SKU' });
            }
            const { data: unidade } = await supabase
                .from('units')
                .select('unit_id')
                .eq('unit_id', unit_id)
                .limit(1);
            if (!unidade || unidade.length === 0) {
                return res.status(400).json({ erro: 'Unidade inválida', mensagem: 'unit_id não encontrado' });
            }
            if (category_id) {
                const { data: categoria } = await supabase
                    .from('categories')
                    .select('category_id')
                    .eq('category_id', category_id)
                    .limit(1);
                if (!categoria || categoria.length === 0) {
                    return res.status(400).json({ erro: 'Categoria inválida', mensagem: 'category_id não encontrado' });
                }
            }
            if (brand_id) {
                const { data: marca } = await supabase
                    .from('brands')
                    .select('brand_id')
                    .eq('brand_id', brand_id)
                    .limit(1);
                if (!marca || marca.length === 0) {
                    return res.status(400).json({ erro: 'Marca inválida', mensagem: 'brand_id não encontrado' });
                }
            }
            const { data, error } = await supabase
                .from('products')
                .insert({
                    sku,
                    barcode: barcode || null,
                    product_name,
                    description: description || null,
                    category_id: category_id || null,
                    brand_id: brand_id || null,
                    unit_id,
                    cost_price,
                    selling_price,
                    minimum_stock: minimum_stock || 0,
                    maximum_stock: maximum_stock || null,
                    current_stock: current_stock || 0,
                    weight: weight || null,
                    dimensions: dimensions || null,
                    is_perishable: is_perishable || false,
                    tax_rate: tax_rate || 0,
                    image_url: image_url || null,
                    created_by: req.usuario.id
                })
                .select('product_id')
                .single();
            if (error) {
                if (error.code === '23505') {
                    return res.status(409).json({ erro: 'Produto já existe', mensagem: 'Já existe um produto com este SKU ou código de barras' });
                }
                throw error;
            }
            return res.status(201).json({ sucesso: true, id: data.product_id, mensagem: 'Produto criado com sucesso' });
        }
        // Fallback Postgres
        const insertQuery = `
            INSERT INTO products (
                sku, barcode, product_name, description, category_id, brand_id, unit_id,
                cost_price, selling_price, minimum_stock, maximum_stock, current_stock,
                weight, dimensions, is_perishable, tax_rate, image_url, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING product_id
        `;
        const result = await pool.query(insertQuery, [
            sku,
            barcode || null,
            product_name,
            description || null,
            category_id || null,
            brand_id || null,
            unit_id,
            cost_price,
            selling_price,
            minimum_stock || 0,
            maximum_stock || null,
            current_stock || 0,
            weight || null,
            dimensions || null,
            is_perishable || false,
            tax_rate || 0,
            image_url || null,
            req.usuario.id
        ]);
        return res.status(201).json({ sucesso: true, id: result.rows[0].product_id, mensagem: 'Produto criado com sucesso' });
        
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ 
                erro: 'Produto já existe',
                mensagem: 'Já existe um produto com este SKU ou código de barras'
            });
        }
        
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao criar produto'
        });
    }
});

/**
 * @route PUT /api/produtos/:id
 * @desc Atualiza um produto existente
 * @access Privado - Manager/Admin
 */
app.put('/api/produtos/:id', autenticar, autorizar(2, 3), async (req, res) => {
    const productId = req.params.id;
    const { 
        product_name, description, cost_price, selling_price, 
        minimum_stock, maximum_stock, current_stock, category_id, brand_id, barcode
    } = req.body;

    // Validações básicas
    if (!productId) {
        return res.status(400).json({ 
            erro: 'ID inválido',
            mensagem: 'ID do produto é obrigatório'
        });
    }

    // Validação: preço de venda >= preço de custo
    if (selling_price !== undefined && cost_price !== undefined) {
        if (typeof cost_price === 'number' && typeof selling_price === 'number' && selling_price < cost_price) {
            return res.status(400).json({
                erro: 'Preço de venda inválido',
                mensagem: 'Preço de venda não pode ser menor que o preço de custo'
            });
        }
    }

    // Validação: estoque mínimo <= estoque máximo
    if (minimum_stock !== undefined && maximum_stock !== undefined) {
        if (Number(minimum_stock) > Number(maximum_stock)) {
            return res.status(400).json({
                erro: 'Estoque inválido',
                mensagem: 'Estoque mínimo não pode ser maior que o estoque máximo'
            });
        }
    }

    try {
        if (supabase) {
            // Verificar se produto existe
            const { data: existe } = await supabase
                .from('products')
                .select('product_id')
                .eq('product_id', productId)
                .limit(1);
            if (!existe || existe.length === 0) {
                return res.status(404).json({ erro: 'Produto não encontrado', mensagem: 'ID do produto não existe' });
            }

            // Preparar dados para atualização
            const updates = {};
            if (product_name !== undefined) updates.product_name = product_name;
            if (description !== undefined) updates.description = description;
            if (cost_price !== undefined) updates.cost_price = cost_price;
            if (selling_price !== undefined) updates.selling_price = selling_price;
            if (minimum_stock !== undefined) updates.minimum_stock = minimum_stock;
            if (maximum_stock !== undefined) updates.maximum_stock = maximum_stock;
            if (current_stock !== undefined) updates.current_stock = current_stock;
            if (category_id !== undefined) updates.category_id = category_id;
            if (brand_id !== undefined) updates.brand_id = brand_id;
            if (barcode !== undefined) updates.barcode = barcode;

            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('product_id', productId)
                .select('product_id')
                .single();
            
            if (error) {
                console.error('Erro Supabase PUT produtos:', error);
                throw error;
            }
            return res.json({ sucesso: true, mensagem: 'Produto atualizado com sucesso', id: data.product_id });
        }

        // Fallback Postgres - remover updated_by e updated_at se não existirem nas colunas
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (product_name !== undefined) { updates.push(`product_name = $${paramCount++}`); values.push(product_name); }
        if (description !== undefined) { updates.push(`description = $${paramCount++}`); values.push(description); }
        if (cost_price !== undefined) { updates.push(`cost_price = $${paramCount++}`); values.push(cost_price); }
        if (selling_price !== undefined) { updates.push(`selling_price = $${paramCount++}`); values.push(selling_price); }
        if (minimum_stock !== undefined) { updates.push(`minimum_stock = $${paramCount++}`); values.push(minimum_stock); }
        if (maximum_stock !== undefined) { updates.push(`maximum_stock = $${paramCount++}`); values.push(maximum_stock); }
        if (current_stock !== undefined) { updates.push(`current_stock = $${paramCount++}`); values.push(current_stock); }
        if (category_id !== undefined) { updates.push(`category_id = $${paramCount++}`); values.push(category_id); }
        if (brand_id !== undefined) { updates.push(`brand_id = $${paramCount++}`); values.push(brand_id); }
        if (barcode !== undefined) { updates.push(`barcode = $${paramCount++}`); values.push(barcode); }
        
        // Não adicionar updated_by e updated_at - coluna pode não existir
        
        values.push(productId);

        const updateQuery = `
            UPDATE products
            SET ${updates.join(', ')}
            WHERE product_id = $${paramCount}
            RETURNING product_id
        `;

        const result = await pool.query(updateQuery, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado', mensagem: 'ID do produto não existe' });
        }
        return res.json({ sucesso: true, mensagem: 'Produto atualizado com sucesso', id: result.rows[0].product_id });
        
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao atualizar produto'
        });
    }
});

/**
 * @route DELETE /api/produtos/:id
 * @desc Deleta um produto (soft-delete - marca como inativo)
 * @access Privado - Admin
 */
app.delete('/api/produtos/:id', autenticar, autorizar(3), async (req, res) => {
    const productId = req.params.id;

    if (!productId) {
        return res.status(400).json({ 
            erro: 'ID inválido',
            mensagem: 'ID do produto é obrigatório'
        });
    }

    try {
        if (supabase) {
            // Verificar se produto existe
            const { data: existe } = await supabase
                .from('products')
                .select('product_id')
                .eq('product_id', productId)
                .limit(1);
            if (!existe || existe.length === 0) {
                return res.status(404).json({ erro: 'Produto não encontrado', mensagem: 'ID do produto não existe' });
            }

            // Soft-delete: marcar como inativo
            const { data, error } = await supabase
                .from('products')
                .update({ is_active: false })
                .eq('product_id', productId)
                .select('product_id')
                .single();
            
            if (error) throw error;
            return res.json({ sucesso: true, mensagem: 'Produto deletado com sucesso', id: data.product_id });
        }

        // Fallback Postgres - sem colunas updated_* para compatibilidade
        const updateQuery = `
            UPDATE products
            SET is_active = false
            WHERE product_id = $1
            RETURNING product_id
        `;
        const result = await pool.query(updateQuery, [productId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado', mensagem: 'ID do produto não existe' });
        }
        return res.json({ sucesso: true, mensagem: 'Produto deletado com sucesso', id: result.rows[0].product_id });
        
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao deletar produto'
        });
    }
});

/**
 * @route PUT /api/usuarios/:id
 * @desc Atualiza um usuário existente
 * @access Privado - Admin
 */
app.put('/api/usuarios/:id', autenticar, autorizar(3), async (req, res) => {
    const userId = req.params.id;
    const { full_name, email, username, phone, role_name } = req.body;

    if (!userId) {
        return res.status(400).json({ 
            erro: 'ID inválido',
            mensagem: 'ID do usuário é obrigatório'
        });
    }

    try {
        if (supabase) {
            // Verificar se usuário existe
            const { data: existe } = await supabase
                .from('users')
                .select('user_id')
                .eq('user_id', userId)
                .limit(1);
            if (!existe || existe.length === 0) {
                return res.status(404).json({ erro: 'Usuário não encontrado', mensagem: 'ID do usuário não existe' });
            }

            // Verificar unicidade de email e username se forem alterados
            if (email || username) {
                let conflictQuery = supabase.from('users').select('user_id');
                if (email) conflictQuery = conflictQuery.eq('email', email);
                if (username) conflictQuery = conflictQuery.eq('username', username);
                const { data: conflitos } = await conflictQuery.neq('user_id', userId);
                if (conflitos && conflitos.length > 0) {
                    return res.status(409).json({ erro: 'Usuário já existe', mensagem: 'Email ou username já está cadastrado' });
                }
            }

            const updates = {};
            if (full_name !== undefined) updates.full_name = full_name;
            if (email !== undefined) updates.email = email;
            if (username !== undefined) updates.username = username;
            if (phone !== undefined) updates.phone = phone;
            if (role_name !== undefined) {
                const { data: roles } = await supabase.from('roles').select('role_id').eq('role_name', role_name).limit(1);
                if (!roles || roles.length === 0) {
                    return res.status(400).json({ erro: 'Role inválido', mensagem: 'Tipo de usuário não encontrado' });
                }
                updates.role_id = roles[0].role_id;
            }
            updates.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('user_id', userId)
                .select('user_id')
                .single();
            
            if (error) throw error;
            return res.json({ sucesso: true, mensagem: 'Usuário atualizado com sucesso', id: data.user_id });
        }

        // Fallback Postgres
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (full_name !== undefined) { updates.push(`full_name = $${paramCount++}`); values.push(full_name); }
        if (email !== undefined) { updates.push(`email = $${paramCount++}`); values.push(email); }
        if (username !== undefined) { updates.push(`username = $${paramCount++}`); values.push(username); }
        if (phone !== undefined) { updates.push(`phone = $${paramCount++}`); values.push(phone); }
        if (role_name !== undefined) {
            const roleResult = await pool.query('SELECT role_id FROM roles WHERE role_name = $1', [role_name]);
            if (roleResult.rows.length === 0) {
                return res.status(400).json({ erro: 'Role inválido', mensagem: 'Tipo de usuário não encontrado' });
            }
            updates.push(`role_id = $${paramCount++}`);
            values.push(roleResult.rows[0].role_id);
        }
        
        updates.push(`updated_at = $${paramCount++}`);
        values.push(new Date().toISOString());
        values.push(userId);

        const updateQuery = `
            UPDATE users
            SET ${updates.join(', ')}
            WHERE user_id = $${paramCount}
            RETURNING user_id
        `;

        const result = await pool.query(updateQuery, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado', mensagem: 'ID do usuário não existe' });
        }
        return res.json({ sucesso: true, mensagem: 'Usuário atualizado com sucesso', id: result.rows[0].user_id });
        
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        if (error.code === '23505') {
            return res.status(409).json({ 
                erro: 'Usuário já existe',
                mensagem: 'Email ou username já está cadastrado'
            });
        }
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao atualizar usuário'
        });
    }
});

/**
 * @route DELETE /api/usuarios/:id
 * @desc Deleta um usuário do sistema
 * @access Privado - Admin
 */
app.delete('/api/usuarios/:id', autenticar, autorizar(3), async (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ 
            erro: 'ID inválido',
            mensagem: 'ID do usuário é obrigatório'
        });
    }

    try {
        if (supabase) {
            // Verificar se usuário existe
            const { data: existe } = await supabase
                .from('users')
                .select('user_id, role_id')
                .eq('user_id', userId)
                .limit(1);
            if (!existe || existe.length === 0) {
                return res.status(404).json({ erro: 'Usuário não encontrado', mensagem: 'ID do usuário não existe' });
            }

            // Proteger contra deleção do último admin
            if (existe[0].role_id === 3) { // ADMIN
                const { data: admins } = await supabase.from('users').select('user_id').eq('role_id', 3);
                if (admins && admins.length <= 1) {
                    return res.status(400).json({ erro: 'Operação não permitida', mensagem: 'Não pode deletar o último administrador' });
                }
            }

            // Soft-delete: manter registro para auditoria
            const { data, error } = await supabase
                .from('users')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('user_id', userId)
                .select('user_id')
                .single();
            
            if (error) throw error;
            return res.json({ sucesso: true, mensagem: 'Usuário deletado com sucesso', id: data.user_id });
        }

        // Fallback Postgres
        const checkQuery = 'SELECT user_id, role_id FROM users WHERE user_id = $1';
        const checkResult = await pool.query(checkQuery, [userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado', mensagem: 'ID do usuário não existe' });
        }

        // Proteger contra deleção do último admin
        if (checkResult.rows[0].role_id === 3) { // ADMIN
            const adminQuery = 'SELECT COUNT(*) as count FROM users WHERE role_id = 3 AND is_active = true';
            const adminResult = await pool.query(adminQuery);
            if (parseInt(adminResult.rows[0].count) <= 1) {
                return res.status(400).json({ erro: 'Operação não permitida', mensagem: 'Não pode deletar o último administrador' });
            }
        }

        const updateQuery = `
            UPDATE users
            SET is_active = false, updated_at = $1
            WHERE user_id = $2
            RETURNING user_id
        `;
        const result = await pool.query(updateQuery, [new Date().toISOString(), userId]);
        
        return res.json({ sucesso: true, mensagem: 'Usuário deletado com sucesso', id: result.rows[0].user_id });
        
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao deletar usuário'
        });
    }
});

/**
 * @route GET /api/vendas
 * @desc Lista vendas com paginação
 * @access Privado
 */
app.get('/api/vendas', autenticar, async (req, res) => {
    const limite = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100
    const offset = parseInt(req.query.offset) || 0;
    
    try {
        if (supabase) {
            const { data: vendas, error } = await supabase
                .from('sales_orders')
                .select('order_id, order_number, order_date, status, payment_status, payment_method, total_amount, customer_id, created_by')
                .order('order_date', { ascending: false })
                .range(offset, offset + limite - 1);
            if (error) throw error;
            const customerIds = [...new Set((vendas || []).map(v => v.customer_id).filter(Boolean))];
            const userIds = [...new Set((vendas || []).map(v => v.created_by).filter(Boolean))];
            const { data: customers } = customerIds.length ? await supabase
                .from('customers')
                .select('customer_id, full_name')
                .in('customer_id', customerIds) : { data: [] };
            const { data: users } = userIds.length ? await supabase
                .from('users')
                .select('user_id, full_name')
                .in('user_id', userIds) : { data: [] };
            const cMap = new Map((customers || []).map(c => [c.customer_id, c.full_name]));
            const uMap = new Map((users || []).map(u => [u.user_id, u.full_name]));
            const enriched = (vendas || []).map(v => ({
                ...v,
                customer_name: cMap.get(v.customer_id) || null,
                created_by_name: uMap.get(v.created_by) || null,
            }));
            return res.json({ sucesso: true, total: enriched.length, vendas: enriched });
        }

        const query = `
            SELECT 
                so.order_id,
                so.order_number,
                so.order_date,
                so.status,
                so.payment_status,
                so.payment_method,
                so.total_amount,
                c.full_name as customer_name,
                u.full_name as created_by_name
            FROM sales_orders so
            JOIN customers c ON so.customer_id = c.customer_id
            JOIN users u ON so.created_by = u.user_id
            ORDER BY so.order_date DESC
            LIMIT $1 OFFSET $2
        `;
        const result = await pool.query(query, [limite, offset]);
        res.json({ sucesso: true, total: result.rows.length, vendas: result.rows });
        
    } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao buscar vendas'
        });
    }
});

/**
 * @route GET /api/ponto
 * @desc Lista registros de ponto
 * @access Privado (Employee vê apenas os próprios)
 */
app.get('/api/ponto', autenticar, async (req, res) => {
    const data = req.query.data || new Date().toISOString().split('T')[0];
    
    try {
        if (supabase) {
            const inicioDia = new Date(`${data}T00:00:00.000Z`);
            const fimDia = new Date(`${data}T23:59:59.999Z`);
            if (req.usuario.role_level === 1) {
                const { data: registros, error } = await supabase
                    .from('time_records')
                    .select('*')
                    .eq('user_id', req.usuario.id)
                    .gte('clock_in', inicioDia.toISOString())
                    .lt('clock_in', fimDia.toISOString())
                    .order('clock_in', { ascending: false });
                if (error) throw error;
                return res.json({ sucesso: true, total: (registros||[]).length, registros });
            } else {
                const { data: registros, error } = await supabase
                    .from('time_records')
                    .select('*, user_id')
                    .gte('clock_in', inicioDia.toISOString())
                    .lt('clock_in', fimDia.toISOString())
                    .order('clock_in', { ascending: false });
                if (error) throw error;
                const userIds = [...new Set((registros || []).map(r => r.user_id).filter(Boolean))];
                const { data: users } = userIds.length ? await supabase
                    .from('users')
                    .select('user_id, full_name, username')
                    .in('user_id', userIds) : { data: [] };
                const uMap = new Map((users || []).map(u => [u.user_id, u]));
                const enriched = (registros || []).map(r => ({
                    ...r,
                    usuario_nome: uMap.get(r.user_id)?.full_name || null,
                    username: uMap.get(r.user_id)?.username || null,
                }));
                return res.json({ sucesso: true, total: enriched.length, registros: enriched });
            }
        }

        let query, params;
        if (req.usuario.role_level === 1) {
            query = `
                SELECT * FROM time_records
                WHERE user_id = $1 AND DATE(clock_in) = $2
                ORDER BY clock_in DESC
            `;
            params = [req.usuario.id, data];
        } else {
            query = `
                SELECT tr.*, u.full_name as usuario_nome, u.username
                FROM time_records tr
                JOIN users u ON tr.user_id = u.user_id
                WHERE DATE(tr.clock_in) = $1
                ORDER BY tr.clock_in DESC
            `;
            params = [data];
        }
        const result = await pool.query(query, params);
        res.json({ sucesso: true, total: result.rows.length, registros: result.rows });
        
    } catch (error) {
        console.error('Erro ao buscar ponto:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao buscar registros de ponto'
        });
    }
});

/**
 * @route GET /api/movimentacoes
 * @desc Lista movimentações de estoque
 * @access Privado (Manager e Admin)
 */
app.get('/api/movimentacoes', autenticar, autorizar(2, 3), async (req, res) => {
    const limite = Math.min(parseInt(req.query.limit) || 50, 200);
    const tipo = req.query.tipo; // 'IN' ou 'OUT'
    
    try {
        if (supabase) {
            let query = supabase
                .from('stock_movements')
                .select('movement_id, product_id, user_id, movement_type, quantity, movement_date, notes')
                .order('movement_date', { ascending: false });
            if (tipo && ['IN', 'OUT', 'ADJUSTMENT'].includes(tipo)) {
                query = query.eq('movement_type', tipo);
            }
            const { data: movimentos, error } = await query.range(0, limite - 1);
            if (error) throw error;
            const productIds = [...new Set((movimentos || []).map(m => m.product_id).filter(Boolean))];
            const userIds = [...new Set((movimentos || []).map(m => m.user_id).filter(Boolean))];
            const { data: produtos } = productIds.length ? await supabase
                .from('products')
                .select('product_id, product_name, sku')
                .in('product_id', productIds) : { data: [] };
            const { data: users } = userIds.length ? await supabase
                .from('users')
                .select('user_id, full_name')
                .in('user_id', userIds) : { data: [] };
            const pMap = new Map((produtos || []).map(p => [p.product_id, p]));
            const uMap = new Map((users || []).map(u => [u.user_id, u]));
            const enriched = (movimentos || []).map(m => ({
                ...m,
                product_name: pMap.get(m.product_id)?.product_name || null,
                sku: pMap.get(m.product_id)?.sku || null,
                usuario_nome: uMap.get(m.user_id)?.full_name || null,
            }));
            return res.json({ sucesso: true, total: enriched.length, movimentacoes: enriched });
        }

        let query = `
            SELECT 
                sm.*,
                p.product_name,
                p.sku,
                u.full_name as usuario_nome
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.product_id
            JOIN users u ON sm.user_id = u.user_id
        `;
        const params = [];
        let paramCount = 1;
        if (tipo && ['IN', 'OUT', 'ADJUSTMENT'].includes(tipo)) { query += ` WHERE sm.movement_type = $${paramCount}`; params.push(tipo); paramCount++; }
        query += ` ORDER BY sm.movement_date DESC LIMIT $${paramCount}`; params.push(limite);
        const result = await pool.query(query, params);
        res.json({ sucesso: true, total: result.rows.length, movimentacoes: result.rows });
        
    } catch (error) {
        console.error('Erro ao buscar movimentações:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao buscar movimentações'
        });
    }
});

// ============================================
// TRATAMENTO DE ERROS GLOBAL
// ============================================

/**
 * Middleware de erro 404
 */
app.use((req, res) => {
    res.status(404).json({ 
        erro: 'Rota não encontrada',
        mensagem: `A rota ${req.method} ${req.path} não existe`
    });
});

/**
 * Middleware de erro geral
 */
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ 
        erro: 'Erro interno do servidor',
        mensagem: process.env.NODE_ENV === 'development' ? err.message : 'Erro ao processar requisição'
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(CONFIG.PORT, async () => {
    console.log('\n🚀 ========================================');
    console.log(`   Servidor rodando em http://localhost:${CONFIG.PORT}`);
    console.log('   ========================================');
    console.log('\n📌 Endpoints disponíveis:');
    console.log('   POST   /api/login                    - Autenticação');
    console.log('   POST   /api/usuarios                 - Criar usuário (Admin)');
    console.log('   GET    /api/usuarios                 - Listar usuários (Manager/Admin)');
    console.log('   PUT    /api/usuarios/:id             - Atualizar usuário (Admin)');
    console.log('   DELETE /api/usuarios/:id             - Deletar usuário (Admin)');
    console.log('   GET    /api/produtos                 - Listar produtos (Todos)');
    console.log('   POST   /api/produtos                 - Criar produto (Manager/Admin)');
    console.log('   PUT    /api/produtos/:id             - Atualizar produto (Manager/Admin)');
    console.log('   DELETE /api/produtos/:id             - Deletar produto (Admin)');
    console.log('   GET    /api/vendas                   - Listar vendas (Autenticado)');
    console.log('   GET    /api/dashboard/estatisticas   - Estatísticas (Autenticado)');
    console.log('   GET    /api/ponto                    - Controle de ponto (Autenticado)');
    console.log('   GET    /api/movimentacoes            - Movimentações (Manager/Admin)');
    console.log('   GET    /api/health                   - Status do servidor');
    console.log('\n🔧 Conectando ao PostgreSQL...\n');
    
    await verificarBanco();
});