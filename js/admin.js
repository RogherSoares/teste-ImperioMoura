// Simulação de "banco de dados"
class DbAdmin {
    static get() { return localStorage.getItem('dados') ? JSON.parse(localStorage.getItem('dados')) : {}; }
    static set(data) { localStorage.setItem('dados', JSON.stringify(data)); }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('page-content-wrapper')) { // Garante que só rode na página do admin
        renderizarTudo();
        setupModals();
    }
});

function renderizarTudo() {
    renderizarAgenda();
    renderizarTabelaFuncionarios();
    renderizarTabelaServicos();
}

function setupModals() {
    // --- Modal de Funcionário ---
    const modalFuncionario = document.getElementById('modalFuncionario');
    const formFuncionario = document.getElementById('form-funcionario');
    modalFuncionario?.addEventListener('hidden.bs.modal', () => formFuncionario.reset());
    formFuncionario?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('func-id').value;
        const dados = DbAdmin.get();
        const funcionario = {
            nome: document.getElementById('func-nome').value,
            especialidades: document.getElementById('func-especialidades').value.split(',').map(s => s.trim()),
            foto: document.getElementById('func-foto').value,
        };
        if (id) {
            const index = dados.funcionarios.findIndex(f => f.id == id);
            if (index > -1) dados.funcionarios[index] = { ...dados.funcionarios[index], ...funcionario };
        } else {
            funcionario.id = Date.now();
            dados.funcionarios.push(funcionario);
        }
        DbAdmin.set(dados);
        renderizarTudo();
        bootstrap.Modal.getInstance(modalFuncionario).hide();
    });

    // --- Modal de Serviço ---
    const modalServico = document.getElementById('modalServico');
    const formServico = document.getElementById('form-servico');
    modalServico?.addEventListener('hidden.bs.modal', () => formServico.reset());
    modalServico?.addEventListener('show.bs.modal', () => {
        const categoriaSelect = document.getElementById('serv-categoria');
        categoriaSelect.innerHTML = DbAdmin.get().categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    });
    formServico?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('serv-id').value;
        const dados = DbAdmin.get();
        const servico = {
            nome: document.getElementById('serv-nome').value,
            preco: parseFloat(document.getElementById('serv-preco').value),
            duracao: parseInt(document.getElementById('serv-duracao').value),
            categoriaId: document.getElementById('serv-categoria').value,
        };
        if (id) {
            const index = dados.servicos.findIndex(s => s.id == id);
            if (index > -1) dados.servicos[index] = { ...dados.servicos[index], ...servico };
        } else {
            servico.id = Date.now();
            dados.servicos.push(servico);
        }
        DbAdmin.set(dados);
        renderizarTudo();
        bootstrap.Modal.getInstance(modalServico).hide();
    });
}

// --- Funções de Preparação dos Modais ---
function prepararAdicaoFuncionario() {
    document.getElementById('form-funcionario').reset();
    document.getElementById('func-id').value = '';
    document.getElementById('modalFuncionarioLabel').textContent = 'Adicionar Funcionário';
}

function prepararAdicaoServico() {
    document.getElementById('form-servico').reset();
    document.getElementById('serv-id').value = '';
    document.getElementById('modalServicoLabel').textContent = 'Adicionar Serviço';
}

// --- Funções de Edição ---
function editarFuncionario(id) {
    const func = DbAdmin.get().funcionarios.find(f => f.id === id);
    if (!func) return;
    document.getElementById('modalFuncionarioLabel').textContent = 'Editar Funcionário';
    document.getElementById('func-id').value = func.id;
    document.getElementById('func-nome').value = func.nome;
    document.getElementById('func-especialidades').value = func.especialidades.join(', ');
    document.getElementById('func-foto').value = func.foto;
    new bootstrap.Modal(document.getElementById('modalFuncionario')).show();
}

function editarServico(id) {
    const serv = DbAdmin.get().servicos.find(s => s.id === id);
    if (!serv) return;
    document.getElementById('modalServicoLabel').textContent = 'Editar Serviço';
    document.getElementById('serv-id').value = serv.id;
    document.getElementById('serv-nome').value = serv.nome;
    document.getElementById('serv-preco').value = serv.preco;
    document.getElementById('serv-duracao').value = serv.duracao;
    document.getElementById('serv-categoria').value = serv.categoriaId;
    new bootstrap.Modal(document.getElementById('modalServico')).show();
}

// --- Funções de Remoção ---
function removerFuncionario(id) {
    if (confirm('Remover este funcionário? Seus agendamentos também serão removidos.')) {
        const dados = DbAdmin.get();
        dados.funcionarios = dados.funcionarios.filter(f => f.id !== id);
        dados.agendamentos = dados.agendamentos.filter(a => a.funcionarioId !== id);
        DbAdmin.set(dados);
        renderizarTudo();
    }
}

function removerServico(id) {
    if (confirm('Remover este serviço?')) {
        const dados = DbAdmin.get();
        dados.servicos = dados.servicos.filter(s => s.id !== id);
        DbAdmin.set(dados);
        renderizarTudo();
    }
}

function cancelarAgendamento(id) {
    if (confirm('Deseja cancelar este agendamento?')) {
        const dados = DbAdmin.get();
        dados.agendamentos = dados.agendamentos.filter(a => a.id !== id);
        DbAdmin.set(dados);
        renderizarTudo();
    }
}

// --- Funções de Renderização das Tabelas e Agenda ---
function renderizarTabelaFuncionarios() {
    const tbody = document.getElementById('tabela-funcionarios');
    tbody.innerHTML = DbAdmin.get().funcionarios.map(func => `
        <tr>
            <td>${func.id}</td>
            <td><img src="${func.foto || 'img/avatar-padrao.png'}" class="rounded-circle me-2" width="40" height="40" style="object-fit: cover;">${func.nome}</td>
            <td>${func.especialidades.join(', ')}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-2" onclick="editarFuncionario(${func.id})"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="removerFuncionario(${func.id})"><i class="bi bi-trash-fill"></i></button>
            </td>
        </tr>`).join('');
}

function renderizarTabelaServicos() {
    const dados = DbAdmin.get();
    const tbody = document.getElementById('tabela-servicos');
    tbody.innerHTML = dados.servicos.map(s => {
        const categoria = dados.categorias.find(c => c.id === s.categoriaId)?.nome || 'N/A';
        return `
            <tr>
                <td>${s.id}</td>
                <td>${s.nome}</td>
                <td>R$ ${s.preco.toFixed(2).replace('.',',')}</td>
                <td>${s.duracao} min</td>
                <td>${categoria}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="editarServico(${s.id})"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="removerServico(${s.id})"><i class="bi bi-trash-fill"></i></button>
                </td>
            </tr>`;
    }).join('');
}

function renderizarAgenda() {
    const dados = DbAdmin.get();
    const container = document.getElementById('agenda-container');
    const agendaPorFuncionario = dados.funcionarios.map(func => ({...func, agendamentos: dados.agendamentos.filter(a => a.funcionarioId === func.id).sort((a,b) => new Date(`${a.data}T${a.horario}`) - new Date(`${b.data}T${b.horario}`))}));
    if (agendaPorFuncionario.length === 0) { container.innerHTML = '<p class="text-muted">Nenhum funcionário cadastrado.</p>'; return; }
    container.innerHTML = `<div class="accordion" id="accordionAgenda">${agendaPorFuncionario.map((func, index) => `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${func.id}">
                    ${func.nome} <span class="badge bg-primary ms-2">${func.agendamentos.length}</span>
                </button>
            </h2>
            <div id="collapse-${func.id}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" data-bs-parent="#accordionAgenda">
                <div class="list-group list-group-flush">${func.agendamentos.length > 0 ? func.agendamentos.map(a => {
                    const servico = dados.servicos.find(s => s.id === a.servicoId) || {};
                    return `<div class="list-group-item d-flex justify-content-between align-items-center">
                                <div><strong>${a.cliente}</strong> - ${servico.nome} (${servico.duracao} min)<br><small class="text-muted">${new Date(a.data + 'T00:00:00').toLocaleDateString('pt-BR')} às ${a.horario}</small></div>
                                <button class="btn btn-sm btn-outline-danger" onclick="cancelarAgendamento(${a.id})"><i class="bi bi-x-circle"></i></button>
                            </div>`;
                }).join('') : '<div class="list-group-item text-muted">Nenhum agendamento encontrado.</div>'}</div>
            </div>
        </div>`).join('')}</div>`;
}