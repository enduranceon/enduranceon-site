// Configuração
const SPREADSHEET_ID = '1hVpmzwH19BHVEski7cNZtQ0nZnsD-NherUjeEm9UYVo';
const SHEET_NAME = 'Datas Ironman';
const API_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

// Estado global
let allEvents = [];
let filters = {
    periodo: '',
    coletivo: ''
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadEvents();
});

// Configurar event listeners
function setupEventListeners() {
    document.getElementById('filter-periodo').addEventListener('change', applyFilters);
    document.getElementById('filter-coletivo').addEventListener('change', applyFilters);
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    
    // Modal
    const modal = document.getElementById('event-modal');
    const closeBtn = document.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

// Carregar eventos da planilha
async function loadEvents() {
    try {
        const response = await fetch(API_URL);
        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        
        const rows = json.table.rows;
        allEvents = [];
        
        // A API já remove o cabeçalho (parsedNumHeaders: 1)
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].c;
            if (!cells || !cells[0]) continue;
            
            const event = {
                data: cells[0]?.f || cells[0]?.v || '',
                diaSemana: cells[1]?.v || '',
                hora: cells[2]?.f || cells[2]?.v || '',
                treinoColetivo: cells[3]?.v === true || cells[3]?.v === 'TRUE',
                periodo: cells[4]?.v || '',
                nome: cells[5]?.v || '',
                treino: cells[6]?.v || '',
                local: cells[7]?.v || '',
                linkMaps: cells[8]?.v || ''
            };
            
            // Validar e parsear data
            if (event.data) {
                const dateMatch = event.data.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (dateMatch) {
                    const [, day, month, year] = dateMatch;
                    event.dateObj = new Date(year, month - 1, day);
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
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        document.getElementById('events-list').innerHTML = '<p style="text-align:center;padding:40px;color:#999;">Erro ao carregar eventos. Tente novamente mais tarde.</p>';
    }
}

// Preencher filtros
function populateFilters() {
    const periodos = [...new Set(allEvents.map(e => e.periodo))].filter(Boolean).sort();
    
    const periodoSelect = document.getElementById('filter-periodo');
    periodos.forEach(periodo => {
        const option = document.createElement('option');
        option.value = periodo;
        option.textContent = periodo;
        periodoSelect.appendChild(option);
    });
}

// Aplicar filtros
function applyFilters() {
    filters.periodo = document.getElementById('filter-periodo').value;
    filters.coletivo = document.getElementById('filter-coletivo').value;
    renderEventsList();
}

// Limpar filtros
function clearFilters() {
    document.getElementById('filter-periodo').value = '';
    document.getElementById('filter-coletivo').value = '';
    filters = { periodo: '', coletivo: '' };
    renderEventsList();
}

// Obter eventos filtrados
function getFilteredEvents() {
    // Obter data atual (sem considerar hora)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return allEvents.filter(event => {
        // Filtro de data passada - ocultar treinos com datas que já passaram
        if (event.dateObj < today) {
            return false;
        }
        
        // Filtro de período
        if (filters.periodo && event.periodo !== filters.periodo) {
            return false;
        }
        
        // Filtro de treino coletivo
        if (filters.coletivo === 'coletivo' && !event.treinoColetivo) {
            return false;
        }
        if (filters.coletivo === 'individual' && event.treinoColetivo) {
            return false;
        }
        
        return true;
    });
}

// Renderizar lista de eventos
function renderEventsList() {
    const container = document.getElementById('events-list');
    container.innerHTML = '';
    
    const filteredEvents = getFilteredEvents();
    
    if (filteredEvents.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#999;">Nenhum evento encontrado com os filtros selecionados.</p>';
        return;
    }
    
    // Agrupar eventos por mês
    const eventsByMonth = {};
    filteredEvents.forEach(event => {
        const monthKey = `${event.dateObj.getFullYear()}-${event.dateObj.getMonth()}`;
        if (!eventsByMonth[monthKey]) {
            eventsByMonth[monthKey] = [];
        }
        eventsByMonth[monthKey].push(event);
    });
    
    // Renderizar cada mês
    Object.keys(eventsByMonth).sort().forEach(monthKey => {
        const events = eventsByMonth[monthKey];
        const firstEvent = events[0];
        
        // Criar grupo do mês
        const monthGroup = document.createElement('div');
        monthGroup.className = 'month-group';
        
        // Header do mês
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.textContent = formatMonthYear(firstEvent.dateObj);
        monthGroup.appendChild(monthHeader);
        
        // Header de colunas
        const columnsHeader = document.createElement('div');
        columnsHeader.className = 'columns-header';
        columnsHeader.innerHTML = `
            <div>TIPO</div>
            <div>DATA</div>
            <div>HORÁRIO</div>
            <div>NOME</div>
            <div>PERÍODO</div>
            <div>LOCAL</div>
            <div>AÇÃO</div>
        `;
        monthGroup.appendChild(columnsHeader);
        
        // Renderizar eventos do mês
        events.forEach(event => {
            const eventRow = createEventRow(event);
            monthGroup.appendChild(eventRow);
        });
        
        container.appendChild(monthGroup);
    });
}

// Criar linha de evento
function createEventRow(event) {
    const row = document.createElement('div');
    row.className = 'event-row';
    
    if (event.treinoColetivo) {
        row.classList.add('coletivo');
    } else {
        row.classList.add('individual');
    }
    
    // Badge
    const badge = document.createElement('div');
    badge.className = `event-badge ${event.treinoColetivo ? 'coletivo' : 'individual'}`;
    badge.textContent = event.treinoColetivo ? '👥 COLETIVO' : 'INDIVIDUAL';
    row.appendChild(badge);
    
    // Data
    const date = document.createElement('div');
    date.className = 'event-date';
    date.textContent = formatDateShort(event.dateObj);
    row.appendChild(date);
    
    // Horário
    const time = document.createElement('div');
    time.className = 'event-time';
    time.textContent = formatTime(event.hora);
    row.appendChild(time);
    
    // Nome
    const name = document.createElement('div');
    name.className = 'event-name';
    name.textContent = event.nome;
    row.appendChild(name);
    
    // Período
    const periodo = document.createElement('div');
    periodo.className = 'event-periodo';
    periodo.textContent = event.periodo;
    row.appendChild(periodo);
    
    // Local
    const local = document.createElement('div');
    local.className = 'event-local';
    local.textContent = event.local || '-';
    row.appendChild(local);
    
    // Botão Ver detalhes
    const action = document.createElement('div');
    action.className = 'event-action';
    const button = document.createElement('button');
    button.className = 'btn-details';
    button.textContent = 'Ver +';
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(event);
    });
    action.appendChild(button);
    row.appendChild(action);
    
    // Click na linha também abre modal
    row.addEventListener('click', () => openModal(event));
    
    return row;
}

// Abrir modal
function openModal(event) {
    const modal = document.getElementById('event-modal');
    
    // Badge
    const badge = document.getElementById('modal-badge');
    badge.className = `modal-badge ${event.treinoColetivo ? 'coletivo' : 'individual'}`;
    badge.textContent = event.treinoColetivo ? '👥 TREINO COLETIVO' : 'TREINO INDIVIDUAL';
    
    // Título
    document.getElementById('modal-title').textContent = event.nome;
    
    // Data
    document.getElementById('modal-date').textContent = formatDateLong(event.dateObj);
    
    // Horário
    document.getElementById('modal-time').textContent = formatTime(event.hora);
    
    // Período
    document.getElementById('modal-periodo').textContent = event.periodo;
    
    // Local
    const localContainer = document.getElementById('modal-local-container');
    if (event.local) {
        localContainer.style.display = 'flex';
        document.getElementById('modal-local').textContent = event.local;
    } else {
        localContainer.style.display = 'none';
    }
    
    // Descrição
    const treinoContainer = document.getElementById('modal-treino-container');
    if (event.treino) {
        treinoContainer.style.display = 'flex';
        document.getElementById('modal-treino').textContent = event.treino;
    } else {
        treinoContainer.style.display = 'none';
    }
    
    // Footer (Maps)
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = '';
    
    if (event.linkMaps) {
        const mapsBtn = document.createElement('a');
        mapsBtn.href = event.linkMaps;
        mapsBtn.target = '_blank';
        mapsBtn.className = 'modal-btn modal-btn-primary';
        mapsBtn.textContent = '📍 Ver no Maps';
        footer.appendChild(mapsBtn);
    }
    
    modal.style.display = 'block';
}

// Funções auxiliares
function formatMonthYear(date) {
    const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
                    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateShort(date) {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
                    'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${dayName}, ${day} ${month}`;
}

function formatDateLong(date) {
    const day = date.getDate();
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} de ${year}`;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    
    // Se já está no formato HH:MM:SS
    const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = hours >= 12 ? 'pm' : 'am';
        
        // Converter para formato 12h
        if (hours > 12) hours -= 12;
        if (hours === 0) hours = 12;
        
        return `${hours}:${minutes}${period}`;
    }
    
    return timeStr;
}
