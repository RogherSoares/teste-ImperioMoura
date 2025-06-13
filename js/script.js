// Simulação de "banco de dados"
class Db {
    static get(key) { return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : null; }
    static set(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
    static initialize() {
        if (!Db.get('dados')) {
            Db.set('dados', {
                categorias: [
                    { id: 'barbearia', nome: 'Barbearia', icone: 'bi-scissors' },
                    { id: 'salao', nome: 'Salão de Beleza', icone: 'bi-brush-fill' },
                ],
                servicos: [
                    { id: 1, categoriaId: 'barbearia', nome: 'Corte Degradê', preco: 45.00, duracao: 45 },
                    { id: 2, categoriaId: 'barbearia', nome: 'Barba Terapia', preco: 40.00, duracao: 30 },
                    { id: 3, categoriaId: 'salao', nome: 'Corte Feminino', preco: 70.00, duracao: 60 },
                ],
                funcionarios: [
                    { id: 1, nome: 'Wesley Rissi', especialidades: ['Barbeiro Chefe'], foto: 'img/wesley.jpg' },
                    { id: 2, nome: 'Fernanda Lima', especialidades: ['Cabeleireira'], foto: 'img/cabeleireira.png' },
                ],
                agendamentos: []
            });
        }
    }
}

let agendamentoAtual = {};

// --- INICIALIZAÇÃO E ROTEAMENTO ---
document.addEventListener('DOMContentLoaded', () => {
    Db.initialize();
    setupLoginPage();
    setupCadastroPage();
    setupAgendaPage();
    setupPerfilPage();
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('usuarioLogado');
            window.location.href = 'index.html';
        });
    }
});

// --- FUNÇÕES DE CONFIGURAÇÃO DE PÁGINA ---
function setupLoginPage() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        if (email.toLowerCase() === 'admin@imperio.com') {
            Db.set('usuarioLogado', { nome: 'Admin', email, tipo: 'admin' });
            window.location.href = 'admin.html';
        } else {
            Db.set('usuarioLogado', { nome: 'Cliente Exemplo', email, tipo: 'cliente' });
            window.location.href = 'agenda.html';
        }
    });
    document.getElementById('admin-login-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('email').value = 'admin@imperio.com';
        document.getElementById('senha').value = 'admin123';
    });
}

function setupCadastroPage() {
    const form = document.getElementById('cadastroForm');
    if (!form) return;
    document.getElementById('telefone')?.addEventListener('input', handlePhoneInput);
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        let formValido = true;
        const cpfInput = document.getElementById('cpf');
        const senhaInput = document.getElementById('senha');
        const confirmarSenhaInput = document.getElementById('confirmarSenha');
        if (!validarCPF(cpfInput.value)) { formValido = false; cpfInput.classList.add('is-invalid'); } 
        else { cpfInput.classList.remove('is-invalid'); }
        if (senhaInput.value !== confirmarSenhaInput.value || senhaInput.value === '') { formValido = false; confirmarSenhaInput.classList.add('is-invalid'); } 
        else { confirmarSenhaInput.classList.remove('is-invalid'); }
        if (formValido && this.checkValidity()) { alert('Cadastro realizado!'); window.location.href = 'index.html'; } 
        else { this.classList.add('was-validated'); }
    });
}

function setupAgendaPage() {
    if (!document.getElementById('wizard')) return;
    renderizarCategorias();
    const dataInput = document.getElementById('data-agendamento');
    dataInput.min = new Date().toISOString().split("T")[0];
    dataInput.addEventListener('change', renderizarHorarios);
    document.getElementById('finalizar-agendamento-btn')?.addEventListener('click', finalizarAgendamento);
}

function setupPerfilPage() {
    if (!document.getElementById('profile-pic')) return;
    const usuario = Db.get('usuarioLogado');
    const dados = Db.get('dados');
    if (!usuario) { window.location.href = 'index.html'; return; }
    document.getElementById('profile-name').textContent = usuario.nome;
    document.getElementById('profile-email').textContent = usuario.email;
    document.getElementById('edit-nome').value = usuario.nome;
    document.getElementById('edit-email').value = usuario.email;
    document.getElementById('edit-cpf').value = "123.456.789-00"; // CPF mockado
    document.getElementById('edit-telefone')?.addEventListener('input', handlePhoneInput);
    
    const meusAgendamentos = dados.agendamentos.filter(a => a.cliente === usuario.nome).sort((a,b) => new Date(`${a.data}T${a.horario}`) - new Date(`${b.data}T${b.horario}`));
    const containerAgendamentos = document.getElementById('lista-meus-agendamentos');
    if (meusAgendamentos.length > 0) {
        containerAgendamentos.innerHTML = meusAgendamentos.map(a => {
            const servico = dados.servicos.find(s => s.id === a.servicoId);
            const funcionario = dados.funcionarios.find(f => f.id === a.funcionarioId);
            return `<div class="list-group-item">
                        <p class="mb-1 fw-bold">${servico?.nome || 'Serviço'}</p>
                        <small>Com: <span class="text-primary">${funcionario?.nome || 'Profissional'}</span></small><br>
                        <small>Data: <span class="text-primary">${new Date(a.data + 'T00:00:00').toLocaleDateString('pt-BR')} às ${a.horario}</span></small>
                    </div>`;
        }).join('');
    } else {
        containerAgendamentos.innerHTML = '<div class="list-group-item text-center p-3 text-muted">Você não possui agendamentos.</div>';
    }
}

// --- FUNÇÕES DO FLUXO DE AGENDAMENTO ---
function irParaPasso(passo) {
    document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
    const proximoPasso = document.getElementById(`passo${passo}-${passo===1 ? 'categoria' : passo===2 ? 'servico' : passo===3 ? 'profissional' : 'data'}`);
    proximoPasso.classList.add('active');
    proximoPasso.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderizarCategorias() {
    const dados = Db.get('dados');
    document.getElementById('lista-categorias').innerHTML = dados.categorias.map(cat => `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="card card-select h-100" onclick="selecionarCategoria('${cat.id}')">
                <div class="card-body text-center p-4"><i class="bi ${cat.icone} display-4 text-primary"></i><h5 class="card-title mt-3">${cat.nome}</h5></div>
            </div>
        </div>`).join('');
}

function selecionarCategoria(categoriaId) {
    agendamentoAtual.categoriaId = categoriaId;
    const servicosFiltrados = Db.get('dados').servicos.filter(s => s.categoriaId === categoriaId);
    document.getElementById('lista-servicos').innerHTML = servicosFiltrados.map(s => `
        <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-start fs-5" onclick="selecionarServico(${s.id})">
            <div>${s.nome}<br><small class="text-muted"><i class="bi bi-clock"></i> ${s.duracao} min</small></div>
            <span class="badge bg-primary rounded-pill">R$ ${s.preco.toFixed(2).replace('.',',')}</span>
        </a>`).join('');
    irParaPasso(2);
}

function selecionarServico(servicoId) {
    agendamentoAtual.servico = Db.get('dados').servicos.find(s => s.id === servicoId);
    document.getElementById('lista-profissionais').innerHTML = Db.get('dados').funcionarios.map(p => `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="card card-select h-100" onclick="selecionarProfissional(${p.id})">
                <img src="${p.foto || 'img/avatar-padrao.png'}" class="card-img-top" alt="${p.nome}" style="height: 200px; object-fit: cover;">
                <div class="card-body text-center"><h5 class="card-title">${p.nome}</h5></div>
            </div>
        </div>`).join('');
    irParaPasso(3);
}

function selecionarProfissional(profissionalId) {
    agendamentoAtual.profissional = Db.get('dados').funcionarios.find(p => p.id === profissionalId);
    document.getElementById('data-agendamento').value = '';
    document.getElementById('lista-horarios').innerHTML = '<p class="text-muted">Selecione uma data para ver os horários.</p>';
    irParaPasso(4);
}

function renderizarHorarios() {
    const container = document.getElementById('lista-horarios');
    container.innerHTML = `<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div>`;
    setTimeout(() => {
        const dataSelecionada = document.getElementById('data-agendamento').value;
        if (!dataSelecionada) { container.innerHTML = '<p class="text-muted">Selecione uma data para ver os horários.</p>'; return; }
        const horariosDisponiveis = getHorariosDisponiveis(dataSelecionada, agendamentoAtual.profissional.id, agendamentoAtual.servico.duracao);
        if (horariosDisponiveis.length === 0) {
            container.innerHTML = '<div class="alert alert-warning text-center">Nenhum horário disponível para esta data.</div>';
        } else {
            container.innerHTML = horariosDisponiveis.map(h => `<button class="btn btn-outline-primary horario-btn" onclick="selecionarHorario(this, '${h}')">${h}</button>`).join('');
        }
    }, 200);
}

function getHorariosDisponiveis(data, funcionarioId, duracaoServico) {
    const dados = Db.get('dados');
    if (new Date(data + 'T12:00:00').getDay() === 0) return []; // Domingo
    const todosOsHorarios = Array.from({length: 18}, (_, i) => i + 9).flatMap(h => [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`]).slice(0, -1);
    const agendamentosDoDia = dados.agendamentos.filter(a => a.funcionarioId === funcionarioId && a.data === data);
    const horarioParaMinutos = h => h.split(':').map(Number).reduce((acc, val) => acc * 60 + val);

    return todosOsHorarios.filter(horario => {
        const inicioPretendido = horarioParaMinutos(horario);
        const fimPretendido = inicioPretendido + duracaoServico;
        if (fimPretendido > 1080) return false; // Expediente até 18:00
        return !agendamentosDoDia.some(agendamento => {
            const servicoAgendado = dados.servicos.find(s => s.id === agendamento.servicoId);
            if (!servicoAgendado) return false;
            const inicioAgendado = horarioParaMinutos(agendamento.horario);
            const fimAgendado = inicioAgendado + servicoAgendado.duracao;
            return inicioPretendido < fimAgendado && fimPretendido > inicioAgendado;
        });
    });
}

function selecionarHorario(element, horario) {
    agendamentoAtual.data = document.getElementById('data-agendamento').value;
    agendamentoAtual.horario = horario;
    document.querySelectorAll('.horario-btn.selected').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('conf-servico').textContent = agendamentoAtual.servico.nome;
    document.getElementById('conf-duracao').textContent = `${agendamentoAtual.servico.duracao} minutos`;
    document.getElementById('conf-profissional').textContent = agendamentoAtual.profissional.nome;
    document.getElementById('conf-data').textContent = new Date(agendamentoAtual.data + 'T00:00:00').toLocaleDateString('pt-BR');
    document.getElementById('conf-horario').textContent = horario;
    new bootstrap.Modal(document.getElementById('confirmacaoModal')).show();
}

function finalizarAgendamento() {
    const dados = Db.get('dados');
    const usuario = Db.get('usuarioLogado') || { nome: 'Convidado' };
    dados.agendamentos.push({
        id: Date.now(),
        cliente: usuario.nome,
        data: agendamentoAtual.data,
        horario: agendamentoAtual.horario,
        servicoId: agendamentoAtual.servico.id,
        funcionarioId: agendamentoAtual.profissional.id,
    });
    Db.set('dados', dados);
    bootstrap.Modal.getInstance(document.getElementById('confirmacaoModal'))?.hide();
    alert('Agendamento confirmado com sucesso!');
    window.location.href = 'perfil.html';
}

function salvarAlteracoesPerfil() {
    const usuario = Db.get('usuarioLogado');
    const dados = Db.get('dados');
    if (!usuario) return;

    // Pegue os novos valores dos campos do formulário
    const novoNome = document.getElementById('edit-nome').value.trim();
    const novoEmail = document.getElementById('edit-email').value.trim();
    // Se quiser salvar telefone/cpf, adicione aqui

    // Atualize o usuário logado
    usuario.nome = novoNome;
    usuario.email = novoEmail;
    Db.set('usuarioLogado', usuario);

    // Se quiser atualizar também nos dados globais (ex: clientes cadastrados), faça aqui

    alert('Perfil atualizado com sucesso!');
    // Atualize a interface, se necessário
    document.getElementById('profile-name').textContent = usuario.nome;
    document.getElementById('profile-email').textContent = usuario.email;
}