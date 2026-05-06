// URL da planilha Google Sheets
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1A3qKSO2XwuZuvFlSV0H4CkCBM6J5H02PSU2IdxAQJJ8/gviz/tq?sheet=Datas%20EON';

// Variáveis globais
let allEvents = [];
let filteredEvents = [];

// Elementos do DOM
const loading = document.getElementById('loading');
const eventsList = document.getElementById('events-list');
const noEvents = document.getElementById('no-events');
const filterTipo = document.getElementById('filter-tipo');
const filterModalidade = document.getElementById('filter-modalidade');
const clearFiltersBtn = document.getElementById('clear-filters');
const modal = document.getElementById('event-modal');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    setupEventListeners();
});

// Carregar eventos
async function loadEvents() {
    try {
        loading.style.display = 'block';
        eventsList.style.display = 'none';
        noEvents.style.display = 'none';
        
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        
        const rows = json.table.rows;
        allEvents = [];
        
        // Data de hoje (início do dia)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // A API já remove o cabeçalho (parsedNumHeaders: 1)
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].c;
            if (!cells || !cells[0]) continue;
            
            const event = {
                data: cells[0]?.f || cells[0]?.v || '',
                diaSemana: cells[1]?.v || '',
                horarioInicio: cells[2]?.f || cells[2]?.v || '',
                responsaveis: cells[3]?.v || '',
                coletivo: cells[4]?.v === true || cells[4]?.v === 'TRUE',
                tipo: cells[5]?.v || '',
                modalidade: cells[6]?.v || '',
                nome: cells[7]?.v || '',
                local: cells[8]?.v || '',
                linkMaps: cells[9]?.v || '',
                informacoes: cells[10]?.v || ''
            };
            
            // Validar e parsear data
            if (event.data) {
                const dateMatch = event.data.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (dateMatch) {
                    const [, day, month, year] = dateMatch;
                    event.dateObj = new Date(year, month - 1, day);
                    
                    // Filtro 1: Apenas eventos COLETIVOS
                    if (!event.coletivo) continue;
                    
                    // Filtro 2: Apenas eventos de HOJE em diante
                    if (event.dateObj < today) continue;
                    
                    allEvents.push(event);
                }
            }
        }
        
        // Ordenar eventos por data
        allEvents.sort((a, b) => a.dateObj - b.dateObj);
        
        // Preencher filtros
        populateFilters();
        
        // Renderizar lista
        renderEventsList();
        
        loading.style.display = 'none';
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        loading.innerHTML = '<p>Erro ao carregar eventos. Tente novamente mais tarde.</p>';
    }
}

// Preencher filtros
function populateFilters() {
    const tipos = new Set();
    const modalidades = new Set();
    
    allEvents.forEach(event => {
        if (event.tipo) tipos.add(event.tipo);
        if (event.modalidade) modalidades.add(event.modalidade);
    });
    
    // Limpar e preencher filtro de tipo
    filterTipo.innerHTML = '<option value="">Todos</option>';
    Array.from(tipos).sort().forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        filterTipo.appendChild(option);
    });
    
    // Limpar e preencher filtro de modalidade
    filterModalidade.innerHTML = '<option value="">Todas</option>';
    Array.from(modalidades).sort().forEach(modalidade => {
        const option = document.createElement('option');
        option.value = modalidade;
        option.textContent = modalidade;
        filterModalidade.appendChild(option);
    });
}

// Aplicar filtros
function applyFilters() {
    const tipoFilter = filterTipo.value;
    const modalidadeFilter = filterModalidade.value;
    
    filteredEvents = allEvents.filter(event => {
        if (tipoFilter && event.tipo !== tipoFilter) return false;
        if (modalidadeFilter && event.modalidade !== modalidadeFilter) return false;
        return true;
    });
    
    renderEventsList();
}

// Renderizar lista de eventos
function renderEventsList() {
    const events = filteredEvents.length > 0 ? filteredEvents : allEvents;
    
    if (events.length === 0) {
        eventsList.style.display = 'none';
        noEvents.style.display = 'block';
        return;
    }
    
    eventsList.innerHTML = '';
    eventsList.style.display = 'block';
    noEvents.style.display = 'none';
    
    // Agrupar eventos por mês
    const eventsByMonth = {};
    events.forEach(event => {
        const monthKey = formatMonthYear(event.dateObj);
        if (!eventsByMonth[monthKey]) {
            eventsByMonth[monthKey] = [];
        }
        eventsByMonth[monthKey].push(event);
    });
    
    // Renderizar cada mês
    Object.keys(eventsByMonth).forEach(monthKey => {
        const monthEvents = eventsByMonth[monthKey];
        
        // Criar grupo do mês
        const monthGroup = document.createElement('div');
        monthGroup.className = 'month-group';
        
        // Header do mês
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.textContent = monthKey;
        monthGroup.appendChild(monthHeader);
        
        // Header de colunas
        const columnsHeader = document.createElement('div');
        columnsHeader.className = 'columns-header';
        columnsHeader.innerHTML = `
            <div>TIPO</div>
            <div>DATA</div>
            <div>HORÁRIO</div>
            <div>MODALIDADE</div>
            <div>NOME</div>
            <div>LOCAL</div>
            <div>AÇÃO</div>
        `;
        monthGroup.appendChild(columnsHeader);
        
        // Renderizar eventos do mês
        monthEvents.forEach(event => {
            const eventRow = createEventRow(event);
            monthGroup.appendChild(eventRow);
        });
        
        eventsList.appendChild(monthGroup);
    });
}

// Criar linha de evento
function createEventRow(event) {
    const row = document.createElement('div');
    row.className = 'event-row';
    row.onclick = () => openModal(event);
    
    // Tipo
    const tipoBadge = document.createElement('div');
    tipoBadge.className = `event-badge badge-tipo-${event.tipo.toLowerCase()}`;
    tipoBadge.textContent = event.tipo;
    row.appendChild(tipoBadge);
    
    // Data
    const date = document.createElement('div');
    date.className = 'event-date';
    date.textContent = formatDateWithDay(event.dateObj, event.diaSemana);
    row.appendChild(date);
    
    // Horário
    const time = document.createElement('div');
    time.className = 'event-time';
    time.textContent = formatTime(event.horarioInicio);
    row.appendChild(time);
    
    // Modalidade
    const modalidadeBadge = document.createElement('div');
    const modalidadeClass = event.modalidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    modalidadeBadge.className = `badge-modalidade badge-${modalidadeClass}`;
    modalidadeBadge.textContent = event.modalidade;
    row.appendChild(modalidadeBadge);
    
    // Nome
    const name = document.createElement('div');
    name.className = 'event-name';
    name.textContent = event.nome;
    row.appendChild(name);
    
    // Local
    const local = document.createElement('div');
    local.className = 'event-local';
    local.textContent = event.local;
    row.appendChild(local);
    
    // Ação
    const action = document.createElement('div');
    action.className = 'event-action';
    const btn = document.createElement('button');
    btn.className = 'btn-details';
    btn.textContent = 'Ver +';
    btn.onclick = (e) => {
        e.stopPropagation();
        openModal(event);
    };
    action.appendChild(btn);
    row.appendChild(action);
    
    return row;
}

// Formatar mês e ano
function formatMonthYear(date) {
    const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
                   'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Formatar data com dia da semana
function formatDateWithDay(date, diaSemana) {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const dayAbbr = days[date.getDay()];
    const day = date.getDate();
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 
                   'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const month = months[date.getMonth()];
    return `${dayAbbr}, ${day} ${month}`;
}

// Formatar horário
function formatTime(time) {
    if (!time) return '';
    
    // Se já está no formato HH:MM:SS
    const match = time.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        let [, hours, minutes] = match;
        hours = parseInt(hours);
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        return `${hours}:${minutes}${ampm}`;
    }
    
    return time;
}

// Abrir modal
function openModal(event) {
    document.getElementById('modal-title').textContent = event.nome;
    document.getElementById('modal-date').textContent = formatFullDate(event.dateObj);
    document.getElementById('modal-time').textContent = formatTime(event.horarioInicio);
    document.getElementById('modal-tipo').textContent = event.tipo;
    document.getElementById('modal-modalidade').textContent = event.modalidade;
    document.getElementById('modal-local').textContent = event.local;
    document.getElementById('modal-info').textContent = event.informacoes || 'Nenhuma informação adicional.';
    
    const mapsLink = document.getElementById('modal-maps-link');
    if (event.linkMaps) {
        mapsLink.href = event.linkMaps;
        mapsLink.style.display = 'inline-block';
    } else {
        mapsLink.style.display = 'none';
    }
    
    modal.classList.add('active');
}

// Fechar modal
function closeModal() {
    modal.classList.remove('active');
}

// Formatar data completa
function formatFullDate(date) {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

// Event listeners
function setupEventListeners() {
    filterTipo.addEventListener('change', applyFilters);
    filterModalidade.addEventListener('change', applyFilters);
    
    clearFiltersBtn.addEventListener('click', () => {
        filterTipo.value = '';
        filterModalidade.value = '';
        filteredEvents = [];
        renderEventsList();
    });
    
    // Fechar modal
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.querySelector('.btn-close-modal').addEventListener('click', closeModal);
    document.querySelector('.modal-overlay').addEventListener('click', closeModal);
    
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}
