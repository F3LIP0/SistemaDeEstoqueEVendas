/**
 * fluxa - Backend API
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

// Headers de segurança HTTP
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname, { index: false }));

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
        
        console.log('👤 Usuário admin criado com sucesso (use a senha padrão para o primeiro acesso)');
        
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

async function registrarAtividade({ req, action, resourceType, resourceId, oldValues, newValues }) {
    try {
        const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || null;
        const payload = {
            user_id: req.usuario?.id || null,
            action,
            resource_type: resourceType,
            resource_id: resourceId || null,
            old_values: oldValues || null,
            new_values: newValues || null,
            ip_address: ip
        };

        if (supabase) {
            await supabase.from('activity_log').insert(payload);
            return;
        }

        await pool.query(
            `INSERT INTO activity_log (user_id, action, resource_type, resource_id, old_values, new_values, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`
            , [payload.user_id, payload.action, payload.resource_type, payload.resource_id, payload.old_values, payload.new_values, payload.ip_address]
        );
    } catch (error) {
        console.error('Erro ao registrar atividade:', error.message);
    }
}

function isMissingTableError(error, tableName) {
    if (!error) return false;
    const code = String(error.code || '');
    const message = String(error.message || '').toLowerCase();
    const table = String(tableName || '').toLowerCase();
    if (code === 'PGRST205' || code === '42P01') return true;
    if (message.includes('could not find the table') && message.includes(table)) return true;
    if (message.includes('relation') && message.includes(table) && message.includes('does not exist')) return true;
    return false;
}

function isMissingColumnError(error, columnName) {
    if (!error) return false;
    const code = String(error.code || '');
    const message = String(error.message || '').toLowerCase();
    const column = String(columnName || '').toLowerCase();
    if (code === '42703' || code === 'PGRST204') return true;
    if (message.includes('column') && message.includes(column) && message.includes('does not exist')) return true;
    if (message.includes('could not find the') && message.includes(column) && message.includes('column')) return true;
    return false;
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
                    avatar_url: usuario.avatar_url || null,
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
                avatar_url: usuario.avatar_url || null,
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
    const { username, email, senha, full_name, phone, role_name, avatar_url } = req.body;
    
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
                    avatar_url: avatar_url || null,
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
            await registrarAtividade({
                req,
                action: 'CREATE',
                resourceType: 'user',
                resourceId: data.user_id,
                newValues: { username, email, full_name, role_name }
            });
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
            INSERT INTO users (username, email, password_hash, role_id, full_name, phone, avatar_url, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING user_id
        `;
        const result = await pool.query(insertQuery, [
            username,
            email,
            senhaHash,
            role_id,
            full_name,
            phone || null,
            avatar_url || null,
            req.usuario.id
        ]);
        await registrarAtividade({
            req,
            action: 'CREATE',
            resourceType: 'user',
            resourceId: result.rows[0].user_id,
            newValues: { username, email, full_name, role_name }
        });
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
    const incluirInativos = String(req.query.incluir_inativos || '0') === '1';
    try {
        if (supabase) {
            let query = supabase
                .from('users')
                .select('user_id, username, full_name, email, phone, avatar_url, is_active, role_id, created_at, last_login')
                .order('full_name', { ascending: true });
            if (!incluirInativos) {
                query = query.eq('is_active', true);
            }
            const { data, error } = await query;
            if (error) throw error;

            const roleIds = [...new Set((data || []).map(u => u.role_id).filter(Boolean))];
            const { data: roles } = roleIds.length ? await supabase
                .from('roles')
                .select('role_id, role_name, role_level')
                .in('role_id', roleIds) : { data: [] };
            const roleMap = new Map((roles || []).map(r => [r.role_id, r]));
            const usuarios = (data || []).map(u => ({
                ...u,
                role_name: roleMap.get(u.role_id)?.role_name || null,
                role_level: roleMap.get(u.role_id)?.role_level || null
            }));

            return res.json({ sucesso: true, total: usuarios.length, usuarios });
        }

        let sql = `
            SELECT u.user_id, u.username, u.full_name, u.email, u.phone, u.avatar_url, u.is_active,
                   u.created_at, u.last_login, r.role_name, r.role_level
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
        `;
        const params = [];
        if (!incluirInativos) {
            sql += ' WHERE u.is_active = true';
        }
        sql += ' ORDER BY u.full_name';
        const result = await pool.query(sql, params);
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
                    .select('product_id, product_name, sku, current_stock, minimum_stock, is_active')
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

                const inicio7Dias = new Date();
                inicio7Dias.setDate(agora.getDate() - 6);
                inicio7Dias.setHours(0, 0, 0, 0);
                const { data: vendas7Data, error: vendas7Err } = await supabase
                    .from('sales_orders')
                    .select('total_amount, status, order_date')
                    .gte('order_date', inicio7Dias.toISOString())
                    .lt('order_date', hojeFim.toISOString());
                if (vendas7Err) throw vendas7Err;

                const vendasPorDia = new Map();
                (vendas7Data || []).forEach(v => {
                    if (v.status === 'CANCELLED') return;
                    const dataKey = new Date(v.order_date).toISOString().split('T')[0];
                    vendasPorDia.set(dataKey, (vendasPorDia.get(dataKey) || 0) + Number(v.total_amount || 0));
                });
                const graficoDias = [];
                const graficoVendas = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const key = d.toISOString().split('T')[0];
                    graficoDias.push(d.toLocaleDateString('pt-BR', { weekday: 'short' }));
                    graficoVendas.push(vendasPorDia.get(key) || 0);
                }

                const { data: ultimasVendas, error: ultimasErr } = await supabase
                    .from('sales_orders')
                    .select('order_number, customer_id, total_amount, status, order_date')
                    .order('order_date', { ascending: false })
                    .limit(5);
                if (ultimasErr) throw ultimasErr;

                const baixoEstoque = (produtosData || [])
                    .filter(p => Number(p.current_stock || 0) <= Number(p.minimum_stock || 0))
                    .slice(0, 5)
                    .map(p => ({
                        product_id: p.product_id,
                        product_name: p.product_name,
                        current_stock: p.current_stock,
                        minimum_stock: p.minimum_stock,
                        sku: p.sku
                    }));

            return res.json({
                sucesso: true,
                vendas_mes: vendasMesValor,
                estoque_baixo: estoqueBaixoValor,
                pedidos_hoje: pedidosHojeValor,
                    lucro_mes: lucroMesValor,
                    grafico: {
                        dias: graficoDias,
                        vendas: graficoVendas
                    },
                    ultimas_vendas: ultimasVendas || [],
                    baixo_estoque: baixoEstoque
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
              lucro_mes: parseFloat(lucroMes.rows[0].valor),
              grafico: { dias: [], vendas: [] },
              ultimas_vendas: [],
              baixo_estoque: []
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
app.get('/api/produtos', autenticar, async (req, res) => {
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
            await registrarAtividade({
                req,
                action: 'CREATE',
                resourceType: 'product',
                resourceId: data.product_id,
                newValues: { sku, product_name, cost_price, selling_price, current_stock }
            });
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
        await registrarAtividade({
            req,
            action: 'CREATE',
            resourceType: 'product',
            resourceId: result.rows[0].product_id,
            newValues: { sku, product_name, cost_price, selling_price, current_stock }
        });
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

// Validação de preço removida por solicitação do usuário

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
            // Verificar se produto existe e obter dados atuais
            const { data: atual } = await supabase
                .from('products')
                .select('*')
                .eq('product_id', productId)
                .limit(1);
            if (!atual || atual.length === 0) {
                return res.status(404).json({ erro: 'Produto não encontrado', mensagem: 'ID do produto não existe' });
            }

            // Preparar dados para atualização
            const updatesBase = {};
            if (product_name !== undefined) updatesBase.product_name = product_name;
            if (description !== undefined) updatesBase.description = description;
            if (cost_price !== undefined) updatesBase.cost_price = cost_price;
            if (selling_price !== undefined) updatesBase.selling_price = selling_price;
            if (minimum_stock !== undefined) updatesBase.minimum_stock = minimum_stock;
            if (maximum_stock !== undefined) updatesBase.maximum_stock = maximum_stock;
            if (current_stock !== undefined) updatesBase.current_stock = current_stock;
            if (category_id !== undefined) updatesBase.category_id = category_id;
            if (brand_id !== undefined) updatesBase.brand_id = brand_id;
            if (barcode !== undefined) updatesBase.barcode = barcode;

            if (Object.keys(updatesBase).length === 0) {
                return res.status(400).json({
                    erro: 'Dados incompletos',
                    mensagem: 'Informe ao menos um campo para atualizar o produto'
                });
            }

            let updatesAplicados = { ...updatesBase, updated_by: req.usuario.id };
            let { data, error } = await supabase
                .from('products')
                .update(updatesAplicados)
                .eq('product_id', productId)
                .select('product_id')
                .single();

            if (error && isMissingColumnError(error, 'updated_by')) {
                // Compatibilidade com schemas onde products não possui updated_by.
                updatesAplicados = { ...updatesBase };
                const retry = await supabase
                    .from('products')
                    .update(updatesAplicados)
                    .eq('product_id', productId)
                    .select('product_id')
                    .single();
                data = retry.data;
                error = retry.error;
            }

            if (error) throw error;
            await registrarAtividade({
                req,
                action: 'UPDATE',
                resourceType: 'product',
                resourceId: data.product_id,
                oldValues: atual[0] || null,
                newValues: updatesAplicados
            });
            return res.json({ sucesso: true, mensagem: 'Produto atualizado com sucesso', id: data.product_id });
        }

        // Fallback Postgres - compatibilidade com schemas sem coluna updated_by
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
        
        if (updates.length === 0) {
            return res.status(400).json({
                erro: 'Dados incompletos',
                mensagem: 'Informe ao menos um campo para atualizar o produto'
            });
        }

        const updatesSemAuditoria = [...updates];
        const valuesSemAuditoria = [...values];

        updates.push(`updated_by = $${paramCount++}`); values.push(req.usuario.id);
        
        values.push(productId);

        const updateQuery = `
            UPDATE products
            SET ${updates.join(', ')}
            WHERE product_id = $${paramCount}
            RETURNING product_id
        `;

        let result;
        try {
            result = await pool.query(updateQuery, values);
        } catch (error) {
            if (!isMissingColumnError(error, 'updated_by')) throw error;

            const paramSemAuditoria = valuesSemAuditoria.length + 1;
            const querySemAuditoria = `
                UPDATE products
                SET ${updatesSemAuditoria.join(', ')}
                WHERE product_id = $${paramSemAuditoria}
                RETURNING product_id
            `;
            result = await pool.query(querySemAuditoria, [...valuesSemAuditoria, productId]);
        }
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado', mensagem: 'ID do produto não existe' });
        }
        await registrarAtividade({
            req,
            action: 'UPDATE',
            resourceType: 'product',
            resourceId: result.rows[0].product_id,
            newValues: updates
        });
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
 * @desc Deleta um produto (hard-delete)
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
                .select('*')
                .eq('product_id', productId)
                .limit(1);
            if (!existe || existe.length === 0) {
                return res.status(404).json({ erro: 'Produto não encontrado', mensagem: 'ID do produto não existe' });
            }

            const { data, error } = await supabase
                .from('products')
                .delete()
                .eq('product_id', productId)
                .select('product_id')
                .single();
            
            if (error) throw error;
            await registrarAtividade({
                req,
                action: 'DELETE',
                resourceType: 'product',
                resourceId: data.product_id,
                oldValues: existe[0] || null
            });
            return res.json({ sucesso: true, mensagem: 'Produto deletado com sucesso', id: data.product_id });
        }

        const oldQuery = 'SELECT * FROM products WHERE product_id = $1';
        const oldResult = await pool.query(oldQuery, [productId]);
        const deleteQuery = `
            DELETE FROM products
            WHERE product_id = $1
            RETURNING product_id
        `;
        const result = await pool.query(deleteQuery, [productId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Produto não encontrado', mensagem: 'ID do produto não existe' });
        }
        await registrarAtividade({
            req,
            action: 'DELETE',
            resourceType: 'product',
            resourceId: result.rows[0].product_id,
            oldValues: oldResult.rows[0] || null
        });
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
 * @route GET /api/categorias
 * @desc Lista categorias
 * @access Privado
 */
app.get('/api/categorias', autenticar, async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('category_name', { ascending: true });
            if (error) throw error;
            return res.json({ sucesso: true, total: data.length, categorias: data });
        }
        const result = await pool.query('SELECT * FROM categories ORDER BY category_name');
        return res.json({ sucesso: true, total: result.rows.length, categorias: result.rows });
    } catch (error) {
        if (isMissingTableError(error, 'categories')) {
            console.warn('Tabela categories não encontrada; retornando lista vazia.');
            return res.json({ sucesso: true, total: 0, categorias: [] });
        }
        console.error('Erro ao listar categorias:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao listar categorias' });
    }
});

app.post('/api/categorias', autenticar, autorizar(2, 3), async (req, res) => {
    const { category_name, description, parent_category_id } = req.body;
    if (!category_name) {
        return res.status(400).json({ erro: 'Dados incompletos', mensagem: 'Nome da categoria é obrigatório' });
    }
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('categories')
                .insert({ category_name, description: description || null, parent_category_id: parent_category_id || null })
                .select('category_id')
                .single();
            if (error) throw error;
            await registrarAtividade({ req, action: 'CREATE', resourceType: 'category', resourceId: data.category_id, newValues: { category_name } });
            return res.status(201).json({ sucesso: true, id: data.category_id });
        }
        const result = await pool.query(
            'INSERT INTO categories (category_name, description, parent_category_id) VALUES ($1, $2, $3) RETURNING category_id',
            [category_name, description || null, parent_category_id || null]
        );
        await registrarAtividade({ req, action: 'CREATE', resourceType: 'category', resourceId: result.rows[0].category_id, newValues: { category_name } });
        return res.status(201).json({ sucesso: true, id: result.rows[0].category_id });
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao criar categoria' });
    }
});

app.delete('/api/categorias/:id', autenticar, autorizar(3), async (req, res) => {
    const id = req.params.id;
    try {
        if (supabase) {
            const { data: old } = await supabase.from('categories').select('*').eq('category_id', id).limit(1);
            const { data, error } = await supabase
                .from('categories')
                .delete()
                .eq('category_id', id)
                .select('category_id')
                .single();
            if (error) throw error;
            await registrarAtividade({ req, action: 'DELETE', resourceType: 'category', resourceId: data.category_id, oldValues: old?.[0] || null });
            return res.json({ sucesso: true, id: data.category_id });
        }
        const old = await pool.query('SELECT * FROM categories WHERE category_id = $1', [id]);
        const result = await pool.query('DELETE FROM categories WHERE category_id = $1 RETURNING category_id', [id]);
        await registrarAtividade({ req, action: 'DELETE', resourceType: 'category', resourceId: result.rows[0].category_id, oldValues: old.rows[0] || null });
        return res.json({ sucesso: true, id: result.rows[0].category_id });
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao deletar categoria' });
    }
});

/**
 * @route GET /api/marcas
 */
app.get('/api/marcas', autenticar, async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .order('brand_name', { ascending: true });
            if (error) throw error;
            return res.json({ sucesso: true, total: data.length, marcas: data });
        }
        const result = await pool.query('SELECT * FROM brands ORDER BY brand_name');
        return res.json({ sucesso: true, total: result.rows.length, marcas: result.rows });
    } catch (error) {
        if (isMissingTableError(error, 'brands')) {
            console.warn('Tabela brands não encontrada; retornando lista vazia.');
            return res.json({ sucesso: true, total: 0, marcas: [] });
        }
        console.error('Erro ao listar marcas:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao listar marcas' });
    }
});

app.post('/api/marcas', autenticar, autorizar(2, 3), async (req, res) => {
    const { brand_name, description } = req.body;
    if (!brand_name) {
        return res.status(400).json({ erro: 'Dados incompletos', mensagem: 'Nome da marca é obrigatório' });
    }
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('brands')
                .insert({ brand_name, description: description || null })
                .select('brand_id')
                .single();
            if (error) throw error;
            await registrarAtividade({ req, action: 'CREATE', resourceType: 'brand', resourceId: data.brand_id, newValues: { brand_name } });
            return res.status(201).json({ sucesso: true, id: data.brand_id });
        }
        const result = await pool.query(
            'INSERT INTO brands (brand_name, description) VALUES ($1, $2) RETURNING brand_id',
            [brand_name, description || null]
        );
        await registrarAtividade({ req, action: 'CREATE', resourceType: 'brand', resourceId: result.rows[0].brand_id, newValues: { brand_name } });
        return res.status(201).json({ sucesso: true, id: result.rows[0].brand_id });
    } catch (error) {
        console.error('Erro ao criar marca:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao criar marca' });
    }
});

app.delete('/api/marcas/:id', autenticar, autorizar(3), async (req, res) => {
    const id = req.params.id;
    try {
        if (supabase) {
            const { data: old } = await supabase.from('brands').select('*').eq('brand_id', id).limit(1);
            const { data, error } = await supabase
                .from('brands')
                .delete()
                .eq('brand_id', id)
                .select('brand_id')
                .single();
            if (error) throw error;
            await registrarAtividade({ req, action: 'DELETE', resourceType: 'brand', resourceId: data.brand_id, oldValues: old?.[0] || null });
            return res.json({ sucesso: true, id: data.brand_id });
        }
        const old = await pool.query('SELECT * FROM brands WHERE brand_id = $1', [id]);
        const result = await pool.query('DELETE FROM brands WHERE brand_id = $1 RETURNING brand_id', [id]);
        await registrarAtividade({ req, action: 'DELETE', resourceType: 'brand', resourceId: result.rows[0].brand_id, oldValues: old.rows[0] || null });
        return res.json({ sucesso: true, id: result.rows[0].brand_id });
    } catch (error) {
        console.error('Erro ao deletar marca:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao deletar marca' });
    }
});

/**
 * @route GET /api/unidades
 */
app.get('/api/unidades', autenticar, async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('units')
                .select('*')
                .order('unit_name', { ascending: true });
            if (error) throw error;
            return res.json({ sucesso: true, total: data.length, unidades: data });
        }
        const result = await pool.query('SELECT * FROM units ORDER BY unit_name');
        return res.json({ sucesso: true, total: result.rows.length, unidades: result.rows });
    } catch (error) {
        if (isMissingTableError(error, 'units')) {
            console.warn('Tabela units não encontrada; retornando lista vazia.');
            return res.json({ sucesso: true, total: 0, unidades: [] });
        }
        console.error('Erro ao listar unidades:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao listar unidades' });
    }
});

app.post('/api/unidades', autenticar, autorizar(2, 3), async (req, res) => {
    const { unit_name, abbreviation } = req.body;
    if (!unit_name || !abbreviation) {
        return res.status(400).json({ erro: 'Dados incompletos', mensagem: 'Nome e abreviação são obrigatórios' });
    }
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('units')
                .insert({ unit_name, abbreviation })
                .select('unit_id')
                .single();
            if (error) throw error;
            await registrarAtividade({ req, action: 'CREATE', resourceType: 'unit', resourceId: data.unit_id, newValues: { unit_name, abbreviation } });
            return res.status(201).json({ sucesso: true, id: data.unit_id });
        }
        const result = await pool.query(
            'INSERT INTO units (unit_name, abbreviation) VALUES ($1, $2) RETURNING unit_id',
            [unit_name, abbreviation]
        );
        await registrarAtividade({ req, action: 'CREATE', resourceType: 'unit', resourceId: result.rows[0].unit_id, newValues: { unit_name, abbreviation } });
        return res.status(201).json({ sucesso: true, id: result.rows[0].unit_id });
    } catch (error) {
        console.error('Erro ao criar unidade:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao criar unidade' });
    }
});

app.delete('/api/unidades/:id', autenticar, autorizar(3), async (req, res) => {
    const id = req.params.id;
    try {
        if (supabase) {
            const { data: old } = await supabase.from('units').select('*').eq('unit_id', id).limit(1);
            const { data, error } = await supabase
                .from('units')
                .delete()
                .eq('unit_id', id)
                .select('unit_id')
                .single();
            if (error) throw error;
            await registrarAtividade({ req, action: 'DELETE', resourceType: 'unit', resourceId: data.unit_id, oldValues: old?.[0] || null });
            return res.json({ sucesso: true, id: data.unit_id });
        }
        const old = await pool.query('SELECT * FROM units WHERE unit_id = $1', [id]);
        const result = await pool.query('DELETE FROM units WHERE unit_id = $1 RETURNING unit_id', [id]);
        await registrarAtividade({ req, action: 'DELETE', resourceType: 'unit', resourceId: result.rows[0].unit_id, oldValues: old.rows[0] || null });
        return res.json({ sucesso: true, id: result.rows[0].unit_id });
    } catch (error) {
        console.error('Erro ao deletar unidade:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao deletar unidade' });
    }
});

/**
 * @route GET /api/auditoria
 * @desc Lista logs de auditoria
 * @access Privado - Admin
 */
app.get('/api/auditoria', autenticar, autorizar(3), async (req, res) => {
    const limite = Math.min(parseInt(req.query.limit) || 100, 500);
    try {
        if (supabase) {
            const { data: logs, error } = await supabase
                .from('activity_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limite);
            if (error) throw error;

            const userIds = [...new Set((logs || []).map(l => l.user_id).filter(Boolean))];
            const { data: users } = userIds.length ? await supabase
                .from('users')
                .select('user_id, full_name, username')
                .in('user_id', userIds) : { data: [] };
            const uMap = new Map((users || []).map(u => [u.user_id, u]));
            const enriched = (logs || []).map(l => ({
                ...l,
                usuario_nome: uMap.get(l.user_id)?.full_name || null,
                username: uMap.get(l.user_id)?.username || null
            }));
            return res.json({ sucesso: true, total: enriched.length, logs: enriched });
        }

        const result = await pool.query(
            `SELECT al.*, u.full_name as usuario_nome, u.username
             FROM activity_log al
             LEFT JOIN users u ON al.user_id = u.user_id
             ORDER BY al.created_at DESC
             LIMIT $1`,
            [limite]
        );
        return res.json({ sucesso: true, total: result.rows.length, logs: result.rows });
    } catch (error) {
        console.error('Erro ao listar auditoria:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao listar auditoria' });
    }
});

/**
 * @route GET /api/configuracoes
 * @desc Retorna configuracoes globais do sistema
 * @access Privado - Admin
 */
app.get('/api/configuracoes', autenticar, autorizar(3), async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('system_settings')
                .select('setting_key, setting_value')
                .order('setting_key', { ascending: true });
            if (!error) {
                const settings = (data || []).reduce((acc, row) => {
                    acc[row.setting_key] = row.setting_value;
                    return acc;
                }, {});
                return res.json({ sucesso: true, configuracoes: settings });
            }

            if (error.code === '42703' || String(error.message || '').includes('setting_key')) {
                const colunasPt = 'id,empresa_nome,moeda,imposto_padrao,estoque_minimo_padrao,logo_url';
                const colunasEn = 'id,company_name,currency,tax_rate,min_stock_alert,logo_url';
                let esquemaPt = true;
                let tentativa = await supabase
                    .from('system_settings')
                    .select(colunasPt)
                    .limit(1);
                if (tentativa.error) {
                    esquemaPt = false;
                    tentativa = await supabase
                        .from('system_settings')
                        .select(colunasEn)
                        .limit(1);
                }
                if (tentativa.error) throw tentativa.error;
                const row = tentativa.data && tentativa.data[0] ? tentativa.data[0] : {};
                const settings = esquemaPt
                    ? {
                        empresa_nome: row.empresa_nome || '',
                        moeda: row.moeda || '',
                        imposto_padrao: row.imposto_padrao ?? '',
                        estoque_minimo_padrao: row.estoque_minimo_padrao ?? '',
                        logo_url: row.logo_url || ''
                    }
                    : {
                        empresa_nome: row.company_name || '',
                        moeda: row.currency || '',
                        imposto_padrao: row.tax_rate ?? '',
                        estoque_minimo_padrao: row.min_stock_alert ?? '',
                        logo_url: row.logo_url || ''
                    };
                return res.json({ sucesso: true, configuracoes: settings });
            }

            throw error;
        }
        const result = await pool.query('SELECT setting_key, setting_value FROM system_settings ORDER BY setting_key');
        const settings = result.rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        return res.json({ sucesso: true, configuracoes: settings });
    } catch (error) {
        console.error('Erro ao carregar configuracoes:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao carregar configuracoes' });
    }
});

/**
 * @route PUT /api/configuracoes
 * @desc Atualiza configuracoes globais do sistema
 * @access Privado - Admin
 */
app.put('/api/configuracoes', autenticar, autorizar(3), async (req, res) => {
    const configuracoes = req.body || {};
    try {
        if (supabase) {
            const payload = Object.entries(configuracoes).map(([key, value]) => ({
                setting_key: key,
                setting_value: String(value)
            }));
            if (payload.length > 0) {
                const { error } = await supabase
                    .from('system_settings')
                    .upsert(payload, { onConflict: 'setting_key' });
                if (!error) {
                    await registrarAtividade({ req, action: 'UPDATE', resourceType: 'system_settings', resourceId: null, newValues: configuracoes });
                    return res.json({ sucesso: true, mensagem: 'Configurações atualizadas' });
                }

                if (error.code === '42703' || String(error.message || '').includes('setting_key')) {
                    const colunasPt = 'id,empresa_nome,moeda,imposto_padrao,estoque_minimo_padrao,logo_url';
                    const colunasEn = 'id,company_name,currency,tax_rate,min_stock_alert,logo_url';
                    let esquemaPt = true;
                    let tentativa = await supabase
                        .from('system_settings')
                        .select(colunasPt)
                        .limit(1);
                    if (tentativa.error) {
                        esquemaPt = false;
                        tentativa = await supabase
                            .from('system_settings')
                            .select(colunasEn)
                            .limit(1);
                    }
                    if (tentativa.error) throw tentativa.error;
                    const row = tentativa.data && tentativa.data[0] ? tentativa.data[0] : null;
                    const updatePayload = esquemaPt
                        ? {
                            empresa_nome: configuracoes.empresa_nome ?? '',
                            moeda: configuracoes.moeda ?? '',
                            imposto_padrao: configuracoes.imposto_padrao ?? '0',
                            estoque_minimo_padrao: configuracoes.estoque_minimo_padrao ?? '0',
                            logo_url: configuracoes.logo_url ?? ''
                        }
                        : {
                            company_name: configuracoes.empresa_nome ?? '',
                            currency: configuracoes.moeda ?? '',
                            tax_rate: configuracoes.imposto_padrao ?? '0',
                            min_stock_alert: configuracoes.estoque_minimo_padrao ?? '0',
                            logo_url: configuracoes.logo_url ?? ''
                        };

                    if (row && row.id !== undefined && row.id !== null) {
                        const { error: errUpdate } = await supabase
                            .from('system_settings')
                            .update(updatePayload)
                            .eq('id', row.id);
                        if (errUpdate) throw errUpdate;
                    } else {
                        const { error: errInsert } = await supabase
                            .from('system_settings')
                            .insert(updatePayload);
                        if (errInsert) throw errInsert;
                    }

                    await registrarAtividade({ req, action: 'UPDATE', resourceType: 'system_settings', resourceId: null, newValues: configuracoes });
                    return res.json({ sucesso: true, mensagem: 'Configurações atualizadas' });
                }

                throw error;
            }
            await registrarAtividade({ req, action: 'UPDATE', resourceType: 'system_settings', resourceId: null, newValues: configuracoes });
            return res.json({ sucesso: true, mensagem: 'Configurações atualizadas' });
        }

        for (const [key, value] of Object.entries(configuracoes)) {
            await pool.query(
                `INSERT INTO system_settings (setting_key, setting_value)
                 VALUES ($1, $2)
                 ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`,
                [key, String(value)]
            );
        }
        await registrarAtividade({ req, action: 'UPDATE', resourceType: 'system_settings', resourceId: null, newValues: configuracoes });
        return res.json({ sucesso: true, mensagem: 'Configurações atualizadas' });
    } catch (error) {
        console.error('Erro ao salvar configuracoes:', error);
        res.status(500).json({ erro: 'Erro no servidor', mensagem: 'Erro ao salvar configuracoes' });
    }
});

/**
 * @route PUT /api/usuarios/:id
 * @desc Atualiza um usuário existente
 * @access Privado - Admin
 */
app.put('/api/usuarios/:id', autenticar, autorizar(3), async (req, res) => {
    const userId = req.params.id;
    const { full_name, email, username, phone, role_name, avatar_url, is_active, senha } = req.body;

    if (!userId) {
        return res.status(400).json({ 
            erro: 'ID inválido',
            mensagem: 'ID do usuário é obrigatório'
        });
    }

    if (is_active !== undefined && typeof is_active !== 'boolean') {
        return res.status(400).json({
            erro: 'Valor inválido',
            mensagem: 'Campo is_active deve ser booleano'
        });
    }

    if (senha !== undefined && senha !== null && String(senha).trim() !== '' && String(senha).length < 6) {
        return res.status(400).json({
            erro: 'Senha inválida',
            mensagem: 'A nova senha deve ter no mínimo 6 caracteres'
        });
    }

    try {
        if (supabase) {
            // Verificar se usuário existe
            const { data: existe } = await supabase
                .from('users')
                .select('*')
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
            if (avatar_url !== undefined) updates.avatar_url = avatar_url;
            if (is_active !== undefined) updates.is_active = is_active;
            if (senha !== undefined && senha !== null && String(senha).trim() !== '') {
                updates.password_hash = await bcrypt.hash(String(senha), CONFIG.SALT_ROUNDS);
            }
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
            await registrarAtividade({
                req,
                action: 'UPDATE',
                resourceType: 'user',
                resourceId: data.user_id,
                oldValues: existe[0] || null,
                newValues: updates
            });
            return res.json({ sucesso: true, mensagem: 'Usuário atualizado com sucesso', id: data.user_id });
        }

        // Fallback Postgres
        const oldResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (full_name !== undefined) { updates.push(`full_name = $${paramCount++}`); values.push(full_name); }
        if (email !== undefined) { updates.push(`email = $${paramCount++}`); values.push(email); }
        if (username !== undefined) { updates.push(`username = $${paramCount++}`); values.push(username); }
        if (phone !== undefined) { updates.push(`phone = $${paramCount++}`); values.push(phone); }
        if (avatar_url !== undefined) { updates.push(`avatar_url = $${paramCount++}`); values.push(avatar_url); }
        if (is_active !== undefined) { updates.push(`is_active = $${paramCount++}`); values.push(is_active); }
        if (senha !== undefined && senha !== null && String(senha).trim() !== '') {
            const senhaHash = await bcrypt.hash(String(senha), CONFIG.SALT_ROUNDS);
            updates.push(`password_hash = $${paramCount++}`);
            values.push(senhaHash);
        }
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
        await registrarAtividade({
            req,
            action: 'UPDATE',
            resourceType: 'user',
            resourceId: result.rows[0].user_id,
            oldValues: oldResult.rows[0] || null,
            newValues: updates
        });
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
 * @desc Deleta um usuário do sistema (hard-delete)
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
                .select('*')
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

            const { data, error } = await supabase
                .from('users')
                .delete()
                .eq('user_id', userId)
                .select('user_id')
                .single();
            
            if (error) throw error;
            await registrarAtividade({
                req,
                action: 'DELETE',
                resourceType: 'user',
                resourceId: data.user_id,
                oldValues: existe[0] || null
            });
            return res.json({ sucesso: true, mensagem: 'Usuário deletado com sucesso', id: data.user_id });
        }

        // Fallback Postgres
        const checkQuery = 'SELECT * FROM users WHERE user_id = $1';
        const checkResult = await pool.query(checkQuery, [userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado', mensagem: 'ID do usuário não existe' });
        }

        // Proteger contra deleção do último admin
        if (checkResult.rows[0].role_id === 3) { // ADMIN
            const adminQuery = 'SELECT COUNT(*) as count FROM users WHERE role_id = 3';
            const adminResult = await pool.query(adminQuery);
            if (parseInt(adminResult.rows[0].count) <= 1) {
                return res.status(400).json({ erro: 'Operação não permitida', mensagem: 'Não pode deletar o último administrador' });
            }
        }

        const deleteQuery = `
            DELETE FROM users
            WHERE user_id = $1
            RETURNING user_id
        `;
        const result = await pool.query(deleteQuery, [userId]);
        
        await registrarAtividade({
            req,
            action: 'DELETE',
            resourceType: 'user',
            resourceId: result.rows[0].user_id,
            oldValues: checkResult.rows[0] || null
        });
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
 * @route GET /api/clientes
 * @desc Lista clientes ativos
 * @access Privado
 */
app.get('/api/clientes', autenticar, async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('customers')
                .select('customer_id, full_name, email, phone, is_active')
                .eq('is_active', true)
                .order('full_name', { ascending: true });
            if (error) throw error;
            return res.json({ sucesso: true, total: (data || []).length, clientes: data || [] });
        }

        const result = await pool.query(`
            SELECT customer_id, full_name, email, phone, is_active
            FROM customers
            WHERE is_active = true
            ORDER BY full_name
        `);
        return res.json({ sucesso: true, total: result.rows.length, clientes: result.rows });
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        res.status(500).json({
            erro: 'Erro no servidor',
            mensagem: 'Erro ao listar clientes'
        });
    }
});

/**
 * @route POST /api/vendas
 * @desc Cria uma nova venda com itens e baixa de estoque
 * @access Privado (Manager/Admin)
 */
app.post('/api/vendas', autenticar, autorizar(2, 3), async (req, res) => {
    const { customer_id, items, payment_method, notes } = req.body;

    if (!customer_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            erro: 'Dados incompletos',
            mensagem: 'customer_id e items são obrigatórios'
        });
    }

    const itensValidados = items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity)
    }));

    if (itensValidados.some((item) => !item.product_id || !item.quantity || item.quantity <= 0)) {
        return res.status(400).json({
            erro: 'Itens inválidos',
            mensagem: 'Cada item deve conter product_id e quantity > 0'
        });
    }

    try {
        const orderNumber = `VEN-${Date.now()}`;

        if (supabase) {
            const { data: customerData, error: customerErr } = await supabase
                .from('customers')
                .select('customer_id, is_active')
                .eq('customer_id', customer_id)
                .limit(1);
            if (customerErr) throw customerErr;
            if (!customerData || customerData.length === 0 || !customerData[0].is_active) {
                return res.status(400).json({ erro: 'Cliente inválido', mensagem: 'Cliente não encontrado ou inativo' });
            }

            const productIds = [...new Set(itensValidados.map((i) => i.product_id))];
            const { data: produtos, error: prodErr } = await supabase
                .from('products')
                .select('product_id, product_name, current_stock, selling_price, is_active')
                .in('product_id', productIds);
            if (prodErr) throw prodErr;

            const produtosMap = new Map((produtos || []).map((p) => [p.product_id, p]));

            for (const item of itensValidados) {
                const produto = produtosMap.get(item.product_id);
                if (!produto || !produto.is_active) {
                    return res.status(400).json({ erro: 'Produto inválido', mensagem: `Produto ${item.product_id} não encontrado/ativo` });
                }
                if (Number(produto.current_stock || 0) < item.quantity) {
                    return res.status(400).json({
                        erro: 'Estoque insuficiente',
                        mensagem: `Estoque insuficiente para ${produto.product_name}`
                    });
                }
            }

            const saleItems = itensValidados.map((item) => {
                const produto = produtosMap.get(item.product_id);
                const unitPrice = Number(produto?.selling_price || 0);
                const lineTotal = unitPrice * item.quantity;
                return {
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: unitPrice,
                    line_total: lineTotal,
                    product_name: produto?.product_name || 'Produto'
                };
            });

            const totalAmount = saleItems.reduce((sum, item) => sum + item.line_total, 0);

            const { data: order, error: orderErr } = await supabase
                .from('sales_orders')
                .insert({
                    order_number: orderNumber,
                    customer_id,
                    total_amount: totalAmount,
                    notes: notes || null,
                    created_by: req.usuario.id
                })
                .select('order_id, order_number, total_amount')
                .single();
            if (orderErr) throw orderErr;

            const { error: itemsErr } = await supabase
                .from('sales_order_items')
                .insert(
                    saleItems.map((item) => ({
                        order_id: order.order_id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        line_total: item.line_total
                    }))
                );
            if (itemsErr) throw itemsErr;

            for (const item of saleItems) {
                const produto = produtosMap.get(item.product_id);
                const novoEstoque = Number(produto.current_stock || 0) - item.quantity;

                const { error: stockErr } = await supabase
                    .from('products')
                    .update({ current_stock: novoEstoque })
                    .eq('product_id', item.product_id);
                if (stockErr) throw stockErr;

                const { error: movErr } = await supabase
                    .from('stock_movements')
                    .insert({
                        product_id: item.product_id,
                        movement_type: 'OUT',
                        quantity: -item.quantity,
                        previous_stock: Number(produto.current_stock || 0),
                        new_stock: novoEstoque,
                        user_id: req.usuario.id,
                        reference_type: 'ADJUSTMENT',
                        reference_id: order.order_id,
                        notes: `Saída por venda ${order.order_number}`
                    });
                if (movErr) throw movErr;
            }

            await registrarAtividade({
                req,
                action: 'CREATE',
                resourceType: 'sale',
                resourceId: order.order_id,
                newValues: { order_number: order.order_number, total_amount: order.total_amount }
            });

            return res.status(201).json({
                sucesso: true,
                mensagem: 'Venda criada com sucesso',
                venda: {
                    order_id: order.order_id,
                    order_number: order.order_number,
                    total_amount: order.total_amount
                }
            });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const customerResult = await client.query(
                'SELECT customer_id, is_active FROM customers WHERE customer_id = $1',
                [customer_id]
            );
            if (customerResult.rows.length === 0 || !customerResult.rows[0].is_active) {
                await client.query('ROLLBACK');
                return res.status(400).json({ erro: 'Cliente inválido', mensagem: 'Cliente não encontrado ou inativo' });
            }

            const productIds = [...new Set(itensValidados.map((i) => i.product_id))];
            const productsResult = await client.query(
                `SELECT product_id, product_name, current_stock, selling_price, is_active
                 FROM products
                 WHERE product_id = ANY($1::int[])`,
                [productIds]
            );
            const produtosMap = new Map(productsResult.rows.map((p) => [p.product_id, p]));

            for (const item of itensValidados) {
                const produto = produtosMap.get(item.product_id);
                if (!produto || !produto.is_active) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ erro: 'Produto inválido', mensagem: `Produto ${item.product_id} não encontrado/ativo` });
                }
                if (Number(produto.current_stock || 0) < item.quantity) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        erro: 'Estoque insuficiente',
                        mensagem: `Estoque insuficiente para ${produto.product_name}`
                    });
                }
            }

            const saleItems = itensValidados.map((item) => {
                const produto = produtosMap.get(item.product_id);
                const unitPrice = Number(produto?.selling_price || 0);
                const lineTotal = unitPrice * item.quantity;
                return {
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: unitPrice,
                    line_total: lineTotal,
                    product_name: produto?.product_name || 'Produto'
                };
            });

            const totalAmount = saleItems.reduce((sum, item) => sum + item.line_total, 0);

            const orderResult = await client.query(
                `INSERT INTO sales_orders (order_number, customer_id, total_amount, notes, created_by)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING order_id, order_number, total_amount`,
                [orderNumber, customer_id, totalAmount, notes || null, req.usuario.id]
            );
            const order = orderResult.rows[0];

            for (const item of saleItems) {
                await client.query(
                    `INSERT INTO sales_order_items (order_id, product_id, quantity, unit_price, line_total)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [order.order_id, item.product_id, item.quantity, item.unit_price, item.line_total]
                );

                await client.query(
                    'UPDATE products SET current_stock = current_stock - $1 WHERE product_id = $2',
                    [item.quantity, item.product_id]
                );

                await client.query(
                    `INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, new_stock, user_id, reference_type, reference_id, notes)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        item.product_id,
                        'OUT',
                        -item.quantity,
                        Number(produtosMap.get(item.product_id)?.current_stock || 0),
                        Number(produtosMap.get(item.product_id)?.current_stock || 0) - item.quantity,
                        req.usuario.id,
                        'ADJUSTMENT',
                        order.order_id,
                        `Saída por venda ${order.order_number}`
                    ]
                );
            }

            await client.query('COMMIT');

            await registrarAtividade({
                req,
                action: 'CREATE',
                resourceType: 'sale',
                resourceId: order.order_id,
                newValues: { order_number: order.order_number, total_amount: order.total_amount }
            });

            return res.status(201).json({
                sucesso: true,
                mensagem: 'Venda criada com sucesso',
                venda: {
                    order_id: order.order_id,
                    order_number: order.order_number,
                    total_amount: order.total_amount
                }
            });
        } catch (txError) {
            await client.query('ROLLBACK');
            throw txError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erro ao criar venda:', error);
        res.status(500).json({
            erro: 'Erro no servidor',
            mensagem: 'Erro ao criar venda'
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
        if (isMissingTableError(error, 'time_records')) {
            return res.json({ sucesso: true, total: 0, registros: [] });
        }
        console.error('Erro ao buscar ponto:', error);
        res.status(500).json({ 
            erro: 'Erro no servidor',
            mensagem: 'Erro ao buscar registros de ponto'
        });
    }
});

/**
 * @route POST /api/ponto
 * @desc Registra entrada ou saída (clock in/out)
 * @access Privado (Autenticado)
 */
app.post('/api/ponto', autenticar, async (req, res) => {
    const userId = req.usuario.id;
    const tipo = req.body.tipo; // 'entrada' ou 'saida'
    
    if (!tipo || (tipo !== 'entrada' && tipo !== 'saida')) {
        return res.status(400).json({
            erro: 'Tipo inválido',
            mensagem: 'Tipo deve ser "entrada" ou "saida"'
        });
    }
    
    try {
        if (supabase) {
            if (tipo === 'entrada') {
                // Registrar entrada (clock_in)
                const { data: novoRegistro, error } = await supabase
                    .from('time_records')
                    .insert([{
                        user_id: userId,
                        clock_in: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    }])
                    .select();
                
                if (error) throw error;
                
                return res.status(201).json({
                    sucesso: true,
                    mensagem: 'Entrada registrada com sucesso',
                    registro: novoRegistro[0]
                });
            } else {
                // Registrar saída (clock_out)
                // Buscar o registro de entrada do dia
                const dataHoje = new Date().toISOString().split('T')[0];
                const inicioDia = new Date(`${dataHoje}T00:00:00.000Z`);
                
                const { data: registroDia, error: erroSelect } = await supabase
                    .from('time_records')
                    .select('record_id')
                    .eq('user_id', userId)
                    .gte('clock_in', inicioDia.toISOString())
                    .is('clock_out', null)
                    .order('clock_in', { ascending: false })
                    .limit(1);
                
                if (erroSelect) throw erroSelect;
                
                if (!registroDia || registroDia.length === 0) {
                    return res.status(400).json({
                        erro: 'Sem entrada',
                        mensagem: 'Nenhuma entrada registrada hoje para fazer saída'
                    });
                }
                
                const recordId = registroDia[0].record_id;
                const agora = new Date();
                const { data: datosSelect, error: erroUpdate } = await supabase
                    .from('time_records')
                    .select('clock_in')
                    .eq('record_id', recordId);
                
                if (erroUpdate) throw erroUpdate;
                
                const clockIn = new Date(datosSelect[0].clock_in);
                const duracao = Math.floor((agora - clockIn) / 60000); // minutos
                
                const { data: registroAtualizado, error } = await supabase
                    .from('time_records')
                    .update({
                        clock_out: agora.toISOString()
                    })
                    .eq('record_id', recordId)
                    .select();
                
                if (error) throw error;
                
                return res.status(200).json({
                    sucesso: true,
                    mensagem: 'Saída registrada com sucesso',
                    registro: registroAtualizado[0],
                    duracao_minutos: duracao
                });
            }
        }
        
        // Fallback para PostgreSQL direto (se Supabase não disponível)
        if (tipo === 'entrada') {
            const query = `
                INSERT INTO time_records (user_id, clock_in, created_at)
                VALUES ($1, NOW(), NOW())
                RETURNING *
            `;
            const result = await pool.query(query, [userId]);
            
            return res.status(201).json({
                sucesso: true,
                mensagem: 'Entrada registrada com sucesso',
                registro: result.rows[0]
            });
        } else {
            const query = `
                UPDATE time_records
                SET clock_out = NOW(),
                    duration_minutes = EXTRACT(EPOCH FROM (NOW() - clock_in)) / 60
                WHERE user_id = $1 
                    AND DATE(clock_in) = CURRENT_DATE
                    AND clock_out IS NULL
                ORDER BY clock_in DESC
                LIMIT 1
                RETURNING *
            `;
            const result = await pool.query(query, [userId]);
            
            if (result.rows.length === 0) {
                return res.status(400).json({
                    erro: 'Sem entrada',
                    mensagem: 'Nenhuma entrada registrada hoje para fazer saída'
                });
            }
            
            return res.status(200).json({
                sucesso: true,
                mensagem: 'Saída registrada com sucesso',
                registro: result.rows[0],
                duracao_minutos: Math.floor(result.rows[0].duration_minutes)
            });
        }
    } catch (error) {
        if (isMissingTableError(error, 'time_records')) {
            return res.status(503).json({
                erro: 'Recurso indisponível',
                mensagem: 'Tabela de ponto não está configurada no banco'
            });
        }
        console.error('Erro ao registrar ponto:', error);
        res.status(500).json({
            erro: 'Erro no servidor',
            mensagem: 'Erro ao registrar ponto',
            detalhe: error.message
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

/**
 * @route POST /api/movimentacoes
 * @desc Criar nova movimentação de estoque
 * @access Privado (Manager e Admin)
 * @body {
 *   product_id: number,
 *   movement_type: 'IN' | 'OUT' | 'ADJUSTMENT',
 *   quantity: number,
 *   reference_type?: string,
 *   reference_id?: number,
 *   notes?: string
 * }
 */
app.post('/api/movimentacoes', autenticar, autorizar(2, 3), async (req, res) => {
    const { product_id, movement_type, quantity, reference_type, reference_id, notes } = req.body;
    const user_id = req.usuario.id;

    try {
        // Validações
        if (!product_id || !movement_type || !quantity) {
            return res.status(400).json({
                erro: 'Dados incompletos',
                mensagem: 'product_id, movement_type e quantity são obrigatórios'
            });
        }

        if (!['IN', 'OUT', 'ADJUSTMENT'].includes(movement_type)) {
            return res.status(400).json({
                erro: 'Tipo inválido',
                mensagem: 'movement_type deve ser: IN, OUT ou ADJUSTMENT'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                erro: 'Quantidade inválida',
                mensagem: 'A quantidade deve ser maior que 0'
            });
        }

        if (supabase) {
            // Verificar se produto existe
            const { data: produto, error: produtoError } = await supabase
                .from('products')
                .select('product_id, product_name, current_stock, minimum_stock')
                .eq('product_id', product_id)
                .single();

            if (produtoError || !produto) {
                return res.status(404).json({
                    erro: 'Produto não encontrado',
                    mensagem: `Produto com ID ${product_id} não existe`
                });
            }

            // Criar movimentação
            // Força reference_type para 'ADJUSTMENT' para atender constraint atual do Supabase
            const refType = 'ADJUSTMENT';
            const prevStock = Number.isFinite(Number(produto.current_stock)) ? Number(produto.current_stock) : 0;
            const delta = Number(quantity);
            const newStock = movement_type === 'OUT' ? prevStock - delta : prevStock + delta;
            let refId = reference_id;

            if (!refId) {
                const hoje = new Date();
                const ymd = hoje.toISOString().split('T')[0].replace(/-/g, '');
                const base = parseInt(ymd, 10) * 10000;
                const inicioDia = new Date(hoje); inicioDia.setHours(0, 0, 0, 0);
                const fimDia = new Date(hoje); fimDia.setHours(23, 59, 59, 999);

                const { data: ultRef } = await supabase
                    .from('stock_movements')
                    .select('reference_id, movement_date')
                    .gte('movement_date', inicioDia.toISOString())
                    .lt('movement_date', fimDia.toISOString())
                    .order('reference_id', { ascending: false })
                    .limit(1);

                const last = ultRef && ultRef[0] && Number(ultRef[0].reference_id) ? Number(ultRef[0].reference_id) : base;
                refId = last + 1;
            }
            
            const movData = {
                product_id,
                movement_type,
                quantity: movement_type === 'OUT' ? -delta : delta,
                user_id,
                reference_type: refType,
                reference_id: refId || null,
                notes: notes || null,
                movement_date: new Date().toISOString(),
                previous_stock: prevStock,
                new_stock: newStock
            };
            
            const { data: movimento, error: movError } = await supabase
                .from('stock_movements')
                .insert([movData])
                .select();

            if (movError) throw movError;

            // Atualizar estoque do produto (usando newStock já calculado)
            const { error: updateError } = await supabase
                .from('products')
                .update({ current_stock: newStock })
                .eq('product_id', product_id);

            if (updateError) throw updateError;

            // Preparar resposta com dados enriquecidos
            const resultado = {
                movement_id: movimento[0].movement_id,
                product_id: produto.product_id,
                product_name: produto.product_name,
                movement_type,
                quantity: movement_type === 'OUT' ? -quantity : quantity,
                user_id,
                notes,
                reference_type: refType,
                reference_id: refId || null,
                estoque_anterior: movement_type === 'OUT' 
                    ? produto.current_stock 
                    : produto.current_stock,
                estoque_novo: newStock,
                abaixo_minimo: newStock < produto.minimum_stock,
                movement_date: new Date().toISOString()
            };

            await registrarAtividade({
                req,
                action: 'CREATE',
                resourceType: 'stock_movement',
                resourceId: movimento[0].movement_id,
                newValues: movData
            });

            return res.status(201).json({
                sucesso: true,
                mensagem: 'Movimentação criada com sucesso',
                movimentacao: resultado
            });
        }

        // Fallback PostgreSQL
        // Verificar produto
        const prodResult = await pool.query(
            'SELECT product_id, product_name, current_stock, minimum_stock FROM products WHERE product_id = $1',
            [product_id]
        );

        if (prodResult.rows.length === 0) {
            return res.status(404).json({
                erro: 'Produto não encontrado',
                mensagem: `Produto com ID ${product_id} não existe`
            });
        }

        const produto = prodResult.rows[0];

        // Criar movimentação
        const movResult = await pool.query(
            `INSERT INTO stock_movements 
            (product_id, movement_type, quantity, user_id, reference_type, reference_id, notes, movement_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING *`,
            [product_id, movement_type, movement_type === 'OUT' ? -quantity : quantity, user_id, reference_type, reference_id, notes]
        );

        const movimento = movResult.rows[0];

        // Atualizar estoque
        const newStock = movement_type === 'OUT' 
            ? produto.current_stock - quantity
            : produto.current_stock + quantity;

        await pool.query(
            'UPDATE products SET current_stock = $1, updated_at = NOW() WHERE product_id = $2',
            [newStock, product_id]
        );

        const resultado = {
            movement_id: movimento.movement_id,
            product_id: produto.product_id,
            product_name: produto.product_name,
            movement_type,
            quantity: movimento.quantity,
            user_id,
            notes,
            reference_type,
            reference_id,
            estoque_anterior: movement_type === 'OUT' 
                ? produto.current_stock 
                : produto.current_stock,
            estoque_novo: newStock,
            abaixo_minimo: newStock < produto.minimum_stock,
            movement_date: movimento.movement_date
        };

        await registrarAtividade({
            req,
            action: 'CREATE',
            resourceType: 'stock_movement',
            resourceId: movimento.movement_id,
            newValues: movimento
        });

        res.status(201).json({
            sucesso: true,
            mensagem: 'Movimentação criada com sucesso',
            movimentacao: resultado
        });

    } catch (error) {
        console.error('Erro ao criar movimentação:', error);
        res.status(500).json({
            erro: 'Erro no servidor',
            mensagem: 'Erro ao criar movimentação',
            detalhe: error?.message || String(error),
            codigo: error?.code || undefined
        });
    }
});

/**
 * @route GET /api/movimentacoes/:id
 * @desc Obter detalhes de uma movimentação
 * @access Privado (Manager e Admin)
 */
app.get('/api/movimentacoes/:id', autenticar, autorizar(2, 3), async (req, res) => {
    const { id } = req.params;

    try {
        if (supabase) {
            const { data: movimento, error } = await supabase
                .from('stock_movements')
                .select('*')
                .eq('movement_id', id)
                .single();

            if (error || !movimento) {
                return res.status(404).json({
                    erro: 'Movimentação não encontrada',
                    mensagem: `Movimentação com ID ${id} não existe`
                });
            }

            // Enriquecer com dados do produto e usuário
            const { data: produto } = await supabase
                .from('products')
                .select('product_name, sku, category_id')
                .eq('product_id', movimento.product_id)
                .single();

            const { data: usuario } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('user_id', movimento.user_id)
                .single();

            return res.json({
                sucesso: true,
                movimentacao: {
                    ...movimento,
                    product_name: produto?.product_name,
                    sku: produto?.sku,
                    usuario_nome: usuario?.full_name,
                    usuario_email: usuario?.email
                }
            });
        }

        const result = await pool.query(
            `SELECT 
                sm.*,
                p.product_name,
                p.sku,
                u.full_name as usuario_nome,
                u.email as usuario_email
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.product_id
            JOIN users u ON sm.user_id = u.user_id
            WHERE sm.movement_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                erro: 'Movimentação não encontrada',
                mensagem: `Movimentação com ID ${id} não existe`
            });
        }

        res.json({
            sucesso: true,
            movimentacao: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao buscar movimentação:', error);
        res.status(500).json({
            erro: 'Erro no servidor',
            mensagem: 'Erro ao buscar movimentação'
        });
    }
});

/**
 * @route GET /api/movimentacoes/produto/:productId
 * @desc Obter histórico de movimentações de um produto
 * @access Privado (Autenticado)
 */
app.get('/api/movimentacoes/produto/:productId', autenticar, async (req, res) => {
    const { productId } = req.params;
    const limite = Math.min(parseInt(req.query.limit) || 100, 500);

    try {
        if (supabase) {
            const { data: movimentos, error } = await supabase
                .from('stock_movements')
                .select('*')
                .eq('product_id', productId)
                .order('movement_date', { ascending: false })
                .limit(limite);

            if (error) throw error;

            if (!movimentos || movimentos.length === 0) {
                return res.json({
                    sucesso: true,
                    total: 0,
                    movimentacoes: []
                });
            }

            // Enriquecer com dados do usuário
            const userIds = [...new Set(movimentos.map(m => m.user_id).filter(Boolean))];
            const { data: usuarios } = userIds.length ? await supabase
                .from('users')
                .select('user_id, full_name')
                .in('user_id', userIds) : { data: [] };

            const usuarioMap = new Map((usuarios || []).map(u => [u.user_id, u]));

            const movimentoEnriquecido = movimentos.map(m => ({
                ...m,
                usuario_nome: usuarioMap.get(m.user_id)?.full_name || null
            }));

            return res.json({
                sucesso: true,
                total: movimentoEnriquecido.length,
                movimentacoes: movimentoEnriquecido
            });
        }

        const result = await pool.query(
            `SELECT 
                sm.*,
                u.full_name as usuario_nome
            FROM stock_movements sm
            LEFT JOIN users u ON sm.user_id = u.user_id
            WHERE sm.product_id = $1
            ORDER BY sm.movement_date DESC
            LIMIT $2`,
            [productId, limite]
        );

        res.json({
            sucesso: true,
            total: result.rows.length,
            movimentacoes: result.rows
        });

    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({
            erro: 'Erro no servidor',
            mensagem: 'Erro ao buscar histórico de movimentações'
        });
    }
});

/**
 * @route GET /api/movimentacoes/filtros/analise
 * @desc Análise de movimentações com filtros
 * @access Privado (Manager e Admin)
 */
app.get('/api/movimentacoes/filtros/analise', autenticar, autorizar(2, 3), async (req, res) => {
    const { tipo, data_inicio, data_fim, produto_id } = req.query;

    try {
        if (supabase) {
            let query = supabase
                .from('stock_movements')
                .select('movement_type, quantity, movement_date, product_id');

            if (tipo && ['IN', 'OUT', 'ADJUSTMENT'].includes(tipo)) {
                query = query.eq('movement_type', tipo);
            }

            if (data_inicio) {
                query = query.gte('movement_date', new Date(data_inicio).toISOString());
            }

            if (data_fim) {
                query = query.lte('movement_date', new Date(data_fim).toISOString());
            }

            if (produto_id) {
                query = query.eq('product_id', produto_id);
            }

            const { data: movimentos, error } = await query;

            if (error) throw error;

            // Calcular estatísticas
            const stats = {
                total_movimentacoes: movimentos.length,
                entradas: 0,
                saidas: 0,
                ajustes: 0,
                qtd_total_entrada: 0,
                qtd_total_saida: 0,
                qtd_total_ajuste: 0
            };

            movimentos.forEach(m => {
                switch (m.movement_type) {
                    case 'IN':
                        stats.entradas++;
                        stats.qtd_total_entrada += m.quantity;
                        break;
                    case 'OUT':
                        stats.saidas++;
                        stats.qtd_total_saida += Math.abs(m.quantity);
                        break;
                    case 'ADJUSTMENT':
                        stats.ajustes++;
                        stats.qtd_total_ajuste += m.quantity;
                        break;
                }
            });

            return res.json({
                sucesso: true,
                filtros: { tipo, data_inicio, data_fim, produto_id },
                estatisticas: stats,
                movimentacoes: movimentos
            });
        }

        let query = `
            SELECT movement_type, quantity, movement_date, product_id
            FROM stock_movements
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (tipo && ['IN', 'OUT', 'ADJUSTMENT'].includes(tipo)) {
            query += ` AND movement_type = $${paramCount}`;
            params.push(tipo);
            paramCount++;
        }

        if (data_inicio) {
            query += ` AND movement_date >= $${paramCount}`;
            params.push(new Date(data_inicio));
            paramCount++;
        }

        if (data_fim) {
            query += ` AND movement_date <= $${paramCount}`;
            params.push(new Date(data_fim));
            paramCount++;
        }

        if (produto_id) {
            query += ` AND product_id = $${paramCount}`;
            params.push(produto_id);
            paramCount++;
        }

        const result = await pool.query(query, params);

        // Calcular estatísticas
        const stats = {
            total_movimentacoes: result.rows.length,
            entradas: 0,
            saidas: 0,
            ajustes: 0,
            qtd_total_entrada: 0,
            qtd_total_saida: 0,
            qtd_total_ajuste: 0
        };

        result.rows.forEach(m => {
            switch (m.movement_type) {
                case 'IN':
                    stats.entradas++;
                    stats.qtd_total_entrada += m.quantity;
                    break;
                case 'OUT':
                    stats.saidas++;
                    stats.qtd_total_saida += Math.abs(m.quantity);
                    break;
                case 'ADJUSTMENT':
                    stats.ajustes++;
                    stats.qtd_total_ajuste += m.quantity;
                    break;
            }
        });

        res.json({
            sucesso: true,
            filtros: { tipo, data_inicio, data_fim, produto_id },
            estatisticas: stats,
            movimentacoes: result.rows
        });

    } catch (error) {
        console.error('Erro ao buscar análise:', error);
        res.status(500).json({
            erro: 'Erro no servidor',
            mensagem: 'Erro ao buscar análise de movimentações'
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
    console.log('   POST   /api/login                           - Autenticação');
    console.log('   POST   /api/usuarios                        - Criar usuário (Admin)');
    console.log('   GET    /api/usuarios                        - Listar usuários (Manager/Admin)');
    console.log('   PUT    /api/usuarios/:id                    - Atualizar usuário (Admin)');
    console.log('   DELETE /api/usuarios/:id                    - Deletar usuário (Admin)');
    console.log('   GET    /api/produtos                        - Listar produtos (Todos)');
    console.log('   POST   /api/produtos                        - Criar produto (Manager/Admin)');
    console.log('   PUT    /api/produtos/:id                    - Atualizar produto (Manager/Admin)');
    console.log('   DELETE /api/produtos/:id                    - Deletar produto (Admin)');
    console.log('   GET    /api/clientes                        - Listar clientes (Autenticado)');
    console.log('   POST   /api/vendas                          - Criar venda (Manager/Admin)');
    console.log('   GET    /api/vendas                          - Listar vendas (Autenticado)');
    console.log('   GET    /api/dashboard/estatisticas          - Estatísticas (Autenticado)');
    console.log('   GET    /api/ponto                           - Controle de ponto (Autenticado)');
    console.log('   GET    /api/movimentacoes                   - Listar movimentações (Manager/Admin)');
    console.log('   POST   /api/movimentacoes                   - Criar movimentação (Manager/Admin)');
    console.log('   GET    /api/movimentacoes/:id               - Detalhes movimentação (Manager/Admin)');
    console.log('   GET    /api/movimentacoes/produto/:id       - Histórico produto (Autenticado)');
    console.log('   GET    /api/movimentacoes/filtros/analise   - Análise com filtros (Manager/Admin)');
    console.log('   GET    /api/health                          - Status do servidor');
    console.log('\n🔧 Conectando ao PostgreSQL...\n');
    
    await verificarBanco();
});